# Desktop Pet Platform Design

**Goal:** Evolve the current Electron pet window into a customizable desktop pet platform that supports transparent animated pets, free dragging without snapping, agent-aware emotions and actions, a pinned single-agent mode, and a multi-agent group stage mode.

**Architecture:** Keep a single transparent `petWindow` in Electron and move all pet presentation decisions into a renderer-side scene system. Introduce a unified `SceneController` and `PetStateMachine` that convert OpenClaw agent snapshots into display-ready scene data. Support multiple visual styles through renderer adapters and installable pet packs so built-in and user-imported assets use the same contract.

**Tech Stack:** Electron, React, Zustand, TypeScript, bridge event snapshots, `Rive` for 2D animated packs, sprite atlas rendering for pixel packs, JSON manifest validation, Vitest, Testing Library

---

## Product Model

The desktop app should expose a single always-on-top transparent pet surface with two display modes:

- `Pinned Agent`: only one selected agent is rendered as the resident pet
- `Group Stage`: a single scene renders one focused agent in the primary slot plus supporting agents in secondary slots

The user can switch modes without creating new windows. A pinned agent remains stable across focus changes. Group stage changes the primary slot based on focus and activity, while secondary roles stay visible with lighter reactions.

This keeps windowing, drag behavior, focus handling, hit testing, persistence, and future scaling rules centralized in one surface.

## Windowing And Interaction

Electron should continue to own exactly two windows:

- `petWindow`: transparent, frameless, always-on-top, skip taskbar
- `panelWindow`: settings and control surface

The pet window should support free drag placement with no snap behavior. The current drag pipeline can keep using `movePetWindow()`, but `snapPetWindow()` should be removed from the renderer flow and eventually from the preload/main-process contract.

Position should be persisted after drag end as `{ x, y, displayId }` and restored on startup. Main process window logic should only clamp to the visible work area, not magnetize to edges. The panel should anchor relative to the pet window when opened, but it should not force permanent side-lock behavior beyond that open action.

## Scene System

Introduce a renderer-side scene pipeline:

1. `AgentSnapshotStore`
   Collects bridge events and derives stable per-agent snapshots.
2. `PetStateMachine`
   Maps agent status and recent events into pet emotions and animation cues.
3. `SceneController`
   Resolves display mode, focused agent, pinned agent, stage layout, and visible cast.
4. `RendererAdapter`
   Renders the scene through a concrete visual backend such as Rive or sprite sheets.

Suggested state inputs:

- `displayMode`
- `pinnedAgentId`
- `focusedAgentId`
- `agentSnapshots[]`
- `installedPetPackId`
- `scenePreferences`

Suggested scene outputs:

- `sceneMode`
- `windowBoundsHint`
- `primaryActor`
- `supportActors[]`
- `ambientEffects[]`
- `interactionRegions[]`

The renderer should never consume bridge events directly. It should only consume normalized scene state.

## Agent Snapshot Model

Bridge events should be aggregated into a stable snapshot per agent instead of driving animations directly. Each snapshot should carry enough information for both UI and animation logic:

```ts
interface AgentSnapshot {
  agentId: string;
  gatewayId: string;
  displayName: string;
  runtimeStatus: 'idle' | 'thinking' | 'working' | 'waiting' | 'collaborating' | 'done' | 'blocked';
  recentEvent: 'task-started' | 'message-received' | 'task-completed' | 'error' | null;
  lastActiveAt: number;
  priorityScore: number;
  personaId?: string;
}
```

`focusedAgentId` in group mode should be derived from recency and importance, not just whichever event arrived last. This prevents visual thrashing when multiple agents update together.

## Emotion And Animation Mapping

Do not map runtime status directly to a single animation name. Use a three-stage pipeline:

`runtime status -> emotion -> animation cue`

Example:

- `idle -> calm -> breathe_loop / blink_loop / look_around_short`
- `thinking -> curious -> look_up_loop / ponder_short`
- `working -> busy -> typing_loop / claw_shuffle_loop`
- `waiting -> patient -> side_glance_loop`
- `blocked -> frustrated -> slump_short / alert_flash_short`
- `done -> delighted -> celebrate_short`

This allows the same agent status to remain expressive and non-repetitive. The system should support:

- loop animations for long-lived states
- one-shot animations for event reactions
- weighted random selection within an emotion pool
- cooldowns so short reactions do not spam
- reduced reactions on support actors during group stage

An `AnimationDirector` should own transitions between loops and one-shots so each renderer backend remains dumb and asset-focused.

## Display Modes

### Pinned Agent

Render one actor only. All state and emotion cues come from the pinned agent snapshot. This mode is the simplest and should be the default for users who want a stable companion.

### Group Stage

Render a single shared scene. One focused agent occupies the primary slot. Remaining visible agents occupy support slots. Support actors should show lower-intensity reactions so the stage does not become noisy.

Recommended layout semantics:

- `center`: focused agent
- `left-support`: recent collaborator or next-most-active agent
- `right-support`: another active or idle agent
- optional `rear-support` slots for packs that support larger casts

Group stage should be pack-aware. Some pet packs may support 3 actors, some 5, and some none at all. Packs that do not support group stage should automatically fall back to pinned mode.

## Pet Pack System

All visuals should ship as `Pet Pack` bundles, regardless of whether they are built-in or user-imported.

Each pack should contain:

- `manifest.json`
- renderer-specific assets
- state and emotion mapping config
- group-stage layout config
- optional metadata for interaction and effects

Suggested manifest shape:

```json
{
  "id": "lobster-classic",
  "name": "Lobster Classic",
  "version": "1.0.0",
  "renderer": "rive",
  "recommendedWindowSize": { "width": 240, "height": 240 },
  "hitRegion": { "x": 30, "y": 40, "width": 180, "height": 170 },
  "anchorPoint": { "x": 0.5, "y": 0.9 },
  "supportsGroupStage": true,
  "maxActors": 3,
  "states": {
    "idle": ["breathe_loop", "blink_loop"],
    "thinking": ["ponder_loop"],
    "working": ["typing_loop"],
    "done": ["celebrate_short"]
  },
  "slots": {
    "primary": { "x": 120, "y": 150, "scale": 1.0 },
    "left-support": { "x": 56, "y": 168, "scale": 0.78 },
    "right-support": { "x": 184, "y": 168, "scale": 0.78 }
  }
}
```

Official packs and imported packs should both resolve through the same install registry.

## Renderer Adapters

Use one shared scene interface and multiple renderers:

- `RiveRenderer`
  Best for Q-style 2D animated pets with state machines and smooth blends.
- `SpriteRenderer`
  Best for pixel and retro sprite-sheet pets.

The renderer contract should look like:

```ts
interface PetRenderer {
  mount(container: HTMLElement): void;
  loadPack(pack: InstalledPetPack): Promise<void>;
  render(scene: PetScene): void;
  destroy(): void;
}
```

This keeps pack selection and art style extensible without coupling scene logic to specific asset formats.

## Built-In And Imported Packs

Support three pack sources:

- built-in official packs
- locally imported user packs
- future synced or marketplace packs

Imported packs should go through validation before install. Validation should cover:

- required files exist
- manifest schema is valid
- referenced animations actually exist
- declared group-stage support matches slot config
- resource size limits
- transparency and hit-region sanity

Accepted packs should install into a local registry, for example under `~/.openclaw/pet-packs/`, and be indexed in settings storage.

## Settings Model

Persist the following pet-platform settings:

```ts
interface PetSceneSettings {
  displayMode: 'pinned' | 'group';
  pinnedAgentId: string | null;
  installedPetPackId: string;
  sceneScale: number;
  position: { x: number; y: number; displayId?: string } | null;
}
```

Optional later settings:

- `reduceMotion`
- `reactionIntensity`
- `showSupportActors`
- `autoFocusPolicy`

## Migration From Current Implementation

The current DOM lobster in `DesktopPet.tsx` should be treated as a temporary built-in renderer. Migration should proceed in layers:

1. Preserve the current single pet window and drag behavior
2. Remove snap-on-drop
3. Add persisted free placement
4. Introduce snapshot aggregation
5. Introduce a scene controller with `pinned` and `group`
6. Wrap the current DOM pet as a temporary renderer adapter
7. Add `RiveRenderer`
8. Add `SpriteRenderer`
9. Add built-in pack selection
10. Add imported pack validation and installation

This order allows continuous delivery without requiring all assets and backends up front.

## Testing Strategy

Test at four levels:

- Unit
  `PetStateMachine`, snapshot aggregation, pack manifest validation, group-stage slot selection
- Component
  `DesktopPetScene`, mode switching, pinned-agent selection, drag persistence
- Integration
  preload/main-process IPC for free movement, no snap behavior, window position restoration
- Asset validation
  pack schema tests plus runtime checks that referenced animations and sprites exist

Critical regression cases:

- dragging moves window and does not snap
- pinned mode ignores focus churn from other agents
- group mode promotes the right agent to primary slot
- unsupported group packs fall back safely
- malformed imported packs are rejected with actionable errors

## Implementation Phases

### Phase 1: Window Behavior And Mode Foundation

- remove snap behavior from the pet window flow
- persist and restore free placement
- add `displayMode` and `pinnedAgentId` settings

### Phase 2: Snapshot And Scene Core

- introduce `AgentSnapshotStore`
- introduce `PetStateMachine`
- introduce `SceneController`
- keep current DOM lobster as renderer

### Phase 3: Official Animated Pack Support

- add `Pet Pack` manifest schema
- add `RiveRenderer`
- ship first official animated pack
- implement pinned and group-stage presentation on the same window

### Phase 4: Pixel Pack Support

- add `SpriteRenderer`
- ship first pixel pack
- verify shared scene behavior across both renderer types

### Phase 5: Imported Pack Workflow

- add pack import UI
- validate and install custom packs
- surface pack errors and compatibility warnings in settings

## Risks

- animation assets can dominate scope if the runtime contract is not frozen early
- group-stage motion can become visually noisy without support-actor throttling
- user-imported packs can create performance and compatibility issues without strict validation
- focus heuristics can feel unstable if snapshot scoring is too reactive

## Recommendation

Build this as one pet-platform runtime with one transparent pet window, two display modes, a shared scene system, and pluggable renderers. Do not build separate feature silos for Q-style pets, pixel pets, and group mode. The correct abstraction boundary is:

`agent snapshots -> state machine -> scene controller -> renderer adapter -> installed pet pack`

That boundary gives you customization, multi-style support, and multi-agent presentation without multiplying window-management and interaction complexity.

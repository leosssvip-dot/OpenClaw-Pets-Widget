# Desktop Pet Platform Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a single-window desktop pet platform with free drag placement, pinned and group display modes, scene-driven rendering, and a pet-pack foundation for both built-in and imported visual styles.

**Architecture:** Extend the current Electron pet window instead of replacing it. Keep one transparent `petWindow`, remove snap behavior, persist placement in settings, then move pet presentation behind a renderer-facing scene system fed by normalized agent snapshots. Reuse the existing `features/habitat` area for snapshot and state logic, and treat the current DOM lobster as the first temporary renderer backend before adding Rive and sprite-pack support.

**Tech Stack:** Electron, React 19, TypeScript, Zustand, Vitest, Testing Library, XState, JSON manifest validation, `@openclaw-habitat/bridge`, `@openclaw-habitat/domain`

---

### Task 1: Remove snapping and persist free pet placement

**Files:**
- Modify: `apps/macos-shell/src/features/widget/DesktopPet.tsx`
- Modify: `apps/macos-shell/src/runtime/habitat-api.ts`
- Modify: `apps/macos-shell/electron/preload.ts`
- Modify: `apps/macos-shell/electron/main.ts`
- Modify: `apps/macos-shell/src/features/settings/settings-store.ts`
- Modify: `apps/macos-shell/src/features/widget/__tests__/DesktopPet.test.tsx`
- Create: `apps/macos-shell/electron/__tests__/main-window-position.test.ts`

**Step 1: Write the failing renderer drag test**

```tsx
it('moves the pet window without snapping on drag end', async () => {
  const movePetWindow = vi.fn().mockResolvedValue(undefined);
  const persistPetWindowPosition = vi.fn().mockResolvedValue(undefined);

  mockHabitatDesktopApi({
    movePetWindow,
    persistPetWindowPosition,
    togglePanel: vi.fn().mockResolvedValue({ isOpen: false })
  });

  render(<DesktopPet petName="Ruby" connectionStatus="connected" petStatus="idle" />);

  // simulate pointer down -> move -> up
  // expect movePetWindow called
  // expect persistPetWindowPosition called once
  // expect no snap API call
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/DesktopPet.test.tsx`
Expected: FAIL because the current component still calls `snapPetWindow()` and has no persistence call.

**Step 3: Write the failing main-process placement test**

```ts
it('stores free pet coordinates and restores them without edge snapping', async () => {
  // initialize main handlers with a mocked BrowserWindow and screen
  // invoke window:movePet and window:persistPetPosition
  // relaunch placement restore path
  // expect saved x/y reused directly, clamped only to work area
});
```

**Step 4: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run electron/__tests__/main-window-position.test.ts`
Expected: FAIL because no persistence IPC or restore logic exists yet.

**Step 5: Write minimal implementation**

```ts
// settings-store.ts
export interface PetWindowPlacement {
  x: number;
  y: number;
  displayId?: string;
}

interface SettingsState {
  petWindowPlacement: PetWindowPlacement | null;
  setPetWindowPlacement: (placement: PetWindowPlacement | null) => void;
}
```

```ts
// habitat-api.ts
persistPetWindowPosition: (payload: { x: number; y: number }) => Promise<void>;
```

```tsx
// DesktopPet.tsx
if (dragStateRef.current.isDragging) {
  void getHabitatDesktopApi()?.persistPetWindowPosition({
    x: Math.round(event.screenX - dragStateRef.current.startX),
    y: Math.round(event.screenY - dragStateRef.current.startY)
  });
}
```

```ts
// main.ts
ipcMain.handle('window:persistPetPosition', (_event, payload) => {
  savedPetWindowPlacement = clampToDisplay(payload);
});
```

**Step 6: Run targeted tests to verify they pass**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/DesktopPet.test.tsx electron/__tests__/main-window-position.test.ts`
Expected: PASS

**Step 7: Commit**

```bash
git add apps/macos-shell/src/features/widget/DesktopPet.tsx apps/macos-shell/src/runtime/habitat-api.ts apps/macos-shell/electron/preload.ts apps/macos-shell/electron/main.ts apps/macos-shell/src/features/settings/settings-store.ts apps/macos-shell/src/features/widget/__tests__/DesktopPet.test.tsx apps/macos-shell/electron/__tests__/main-window-position.test.ts
git commit -m "feat: persist pet placement without snap behavior"
```

### Task 2: Add display mode and pinned-agent settings

**Files:**
- Modify: `apps/macos-shell/src/features/settings/settings-store.ts`
- Modify: `apps/macos-shell/src/App.tsx`
- Modify: `apps/macos-shell/src/features/widget/WidgetPanel.tsx`
- Modify: `apps/macos-shell/src/features/settings/AgentBindings.tsx`
- Modify: `apps/macos-shell/src/styles.css`
- Modify: `apps/macos-shell/src/App.test.tsx`
- Create: `apps/macos-shell/src/features/settings/__tests__/display-mode-settings.test.ts`

**Step 1: Write the failing settings-store test**

```ts
it('stores display mode and pinned agent selection', () => {
  const store = createSettingsStore();

  store.getState().setDisplayMode('group');
  store.getState().setPinnedAgentId('ad-expert');

  expect(store.getState().displayMode).toBe('group');
  expect(store.getState().pinnedAgentId).toBe('ad-expert');
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/settings/__tests__/display-mode-settings.test.ts`
Expected: FAIL because the settings model does not include these fields yet.

**Step 3: Write the failing panel integration test**

```tsx
it('lets the user switch between pinned and group modes and choose a pinned agent', async () => {
  render(<App />);

  // seed multiple agents
  // switch to group mode
  // select pinned agent
  // expect UI reflects persisted selections
});
```

**Step 4: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/App.test.tsx`
Expected: FAIL because the panel exposes no display-mode controls.

**Step 5: Write minimal implementation**

```ts
// settings-store.ts
displayMode: 'pinned' | 'group';
pinnedAgentId: string | null;
setDisplayMode: (mode: 'pinned' | 'group') => void;
setPinnedAgentId: (agentId: string | null) => void;
```

```tsx
// WidgetPanel.tsx or AgentBindings.tsx
<fieldset>
  <legend>Display Mode</legend>
  <label><input type="radio" value="pinned" />Pinned Agent</label>
  <label><input type="radio" value="group" />Group Stage</label>
</fieldset>
<select aria-label="Pinned agent">
  {agentRows.map((row) => (
    <option key={row.agentId} value={row.agentId}>{row.petName ?? row.agentId}</option>
  ))}
</select>
```

**Step 6: Run targeted tests to verify they pass**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/settings/__tests__/display-mode-settings.test.ts src/App.test.tsx`
Expected: PASS

**Step 7: Commit**

```bash
git add apps/macos-shell/src/features/settings/settings-store.ts apps/macos-shell/src/App.tsx apps/macos-shell/src/features/widget/WidgetPanel.tsx apps/macos-shell/src/features/settings/AgentBindings.tsx apps/macos-shell/src/styles.css apps/macos-shell/src/App.test.tsx apps/macos-shell/src/features/settings/__tests__/display-mode-settings.test.ts
git commit -m "feat: add pinned and group pet display modes"
```

### Task 3: Introduce normalized agent snapshots

**Files:**
- Create: `apps/macos-shell/src/features/habitat/agent-snapshots.ts`
- Create: `apps/macos-shell/src/features/habitat/__tests__/agent-snapshots.test.ts`
- Modify: `apps/macos-shell/src/features/habitat/store.ts`
- Modify: `apps/macos-shell/src/features/habitat/types.ts`
- Modify: `apps/macos-shell/src/App.tsx`

**Step 1: Write the failing snapshot reducer test**

```ts
it('derives focused activity and recent events from habitat events', () => {
  const state = reduceAgentSnapshots(initialState, {
    kind: 'agent.status',
    agentId: 'main',
    gatewayId: 'remote-1',
    status: 'working'
  });

  expect(state.byAgentId.main.runtimeStatus).toBe('working');
  expect(state.byAgentId.main.recentEvent).toBe('task-started');
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/habitat/__tests__/agent-snapshots.test.ts`
Expected: FAIL because snapshot aggregation does not exist yet.

**Step 3: Write minimal implementation**

```ts
export interface AgentSnapshot {
  agentId: string;
  gatewayId: string;
  displayName?: string;
  runtimeStatus: PetStatus;
  recentEvent: 'task-started' | 'task-completed' | 'error' | null;
  lastActiveAt: number;
  priorityScore: number;
}

export function reduceAgentSnapshots(...) { ... }
```

```ts
// store.ts
agentSnapshots: Record<string, AgentSnapshot>;
applyEvent: (event) =>
  set((state) => ({
    pets: applyHabitatEvent(state.pets, event),
    agentSnapshots: reduceAgentSnapshots(state.agentSnapshots, event)
  }));
```

**Step 4: Run targeted tests to verify they pass**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/habitat/__tests__/agent-snapshots.test.ts src/features/habitat/__tests__/store.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/macos-shell/src/features/habitat/agent-snapshots.ts apps/macos-shell/src/features/habitat/__tests__/agent-snapshots.test.ts apps/macos-shell/src/features/habitat/store.ts apps/macos-shell/src/features/habitat/types.ts apps/macos-shell/src/App.tsx
git commit -m "feat: normalize live agent snapshots for pet scenes"
```

### Task 4: Add scene-controller logic for pinned and group modes

**Files:**
- Create: `apps/macos-shell/src/features/widget/pet-scene.ts`
- Create: `apps/macos-shell/src/features/widget/__tests__/pet-scene.test.ts`
- Modify: `apps/macos-shell/src/features/widget/DesktopPet.tsx`
- Modify: `apps/macos-shell/src/App.tsx`

**Step 1: Write the failing scene selection test**

```ts
it('builds a pinned scene from the selected agent and a group scene from focused activity', () => {
  expect(
    buildPetScene({
      displayMode: 'group',
      pinnedAgentId: 'main',
      focusedAgentId: 'ad-expert',
      agentSnapshots: [...]
    })
  ).toMatchObject({
    mode: 'group',
    primaryActor: { agentId: 'ad-expert' },
    supportActors: [{ agentId: 'main' }]
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/pet-scene.test.ts`
Expected: FAIL because no scene builder exists.

**Step 3: Write minimal implementation**

```ts
export interface PetSceneActor {
  agentId: string;
  label: string;
  status: PetStatus;
  role: 'primary' | 'support';
}

export interface PetScene {
  mode: 'pinned' | 'group';
  primaryActor: PetSceneActor | null;
  supportActors: PetSceneActor[];
}

export function buildPetScene(input: BuildPetSceneInput): PetScene { ... }
```

```tsx
// DesktopPet.tsx
const scene = buildPetScene({ ... });
```

**Step 4: Run targeted tests to verify they pass**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/pet-scene.test.ts src/App.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/macos-shell/src/features/widget/pet-scene.ts apps/macos-shell/src/features/widget/__tests__/pet-scene.test.ts apps/macos-shell/src/features/widget/DesktopPet.tsx apps/macos-shell/src/App.tsx
git commit -m "feat: drive desktop pet rendering from scene selection"
```

### Task 5: Turn the current DOM lobster into the first renderer adapter

**Files:**
- Create: `apps/macos-shell/src/features/widget/renderers/dom-pet-renderer.tsx`
- Create: `apps/macos-shell/src/features/widget/renderers/types.ts`
- Create: `apps/macos-shell/src/features/widget/__tests__/dom-pet-renderer.test.tsx`
- Modify: `apps/macos-shell/src/features/widget/DesktopPet.tsx`
- Modify: `apps/macos-shell/src/features/widget/pet-appearance.ts`
- Modify: `apps/macos-shell/src/styles.css`

**Step 1: Write the failing renderer test**

```tsx
it('renders primary and support actors through the dom renderer contract', () => {
  render(
    <DomPetRenderer
      scene={{
        mode: 'group',
        primaryActor: { agentId: 'main', label: 'Main', status: 'working', role: 'primary' },
        supportActors: [{ agentId: 'ad-expert', label: 'Ads', status: 'idle', role: 'support' }]
      }}
    />
  );

  expect(screen.getByText('Main')).toBeInTheDocument();
  expect(screen.getByText('Ads')).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/dom-pet-renderer.test.tsx`
Expected: FAIL because the pet DOM is still coupled directly to `DesktopPet`.

**Step 3: Write minimal implementation**

```ts
export interface PetRendererProps {
  scene: PetScene;
  appearance?: PetAppearanceConfig;
}
```

```tsx
export function DomPetRenderer({ scene, appearance }: PetRendererProps) {
  // render one primary actor and optional support actors
}
```

**Step 4: Run targeted tests to verify they pass**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/dom-pet-renderer.test.tsx src/features/widget/__tests__/DesktopPet.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/macos-shell/src/features/widget/renderers/dom-pet-renderer.tsx apps/macos-shell/src/features/widget/renderers/types.ts apps/macos-shell/src/features/widget/__tests__/dom-pet-renderer.test.tsx apps/macos-shell/src/features/widget/DesktopPet.tsx apps/macos-shell/src/features/widget/pet-appearance.ts apps/macos-shell/src/styles.css
git commit -m "refactor: extract dom pet renderer from desktop pet shell"
```

### Task 6: Define the pet-pack manifest and built-in pack registry

**Files:**
- Create: `apps/macos-shell/src/features/widget/pet-pack-schema.ts`
- Create: `apps/macos-shell/src/features/widget/pet-pack-registry.ts`
- Create: `apps/macos-shell/src/features/widget/__tests__/pet-pack-schema.test.ts`
- Create: `apps/macos-shell/src/features/widget/packs/lobster-classic/manifest.json`
- Modify: `apps/macos-shell/src/features/settings/settings-store.ts`

**Step 1: Write the failing schema test**

```ts
it('accepts a built-in pack with group-stage slots', () => {
  expect(
    petPackSchema.parse({
      id: 'lobster-classic',
      renderer: 'dom',
      supportsGroupStage: true,
      maxActors: 3,
      slots: {
        primary: { x: 120, y: 150, scale: 1 },
        'left-support': { x: 56, y: 168, scale: 0.78 }
      }
    }).id
  ).toBe('lobster-classic');
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/pet-pack-schema.test.ts`
Expected: FAIL because no schema or registry exists.

**Step 3: Write minimal implementation**

```ts
export const petPackSchema = z.object({
  id: z.string(),
  name: z.string(),
  renderer: z.enum(['dom', 'rive', 'sprite']),
  supportsGroupStage: z.boolean(),
  maxActors: z.number().int().min(1),
  slots: z.record(z.object({ x: z.number(), y: z.number(), scale: z.number() }))
});
```

```ts
export const builtInPetPacks = {
  'lobster-classic': lobsterClassicManifest
} as const;
```

**Step 4: Run targeted tests to verify they pass**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/pet-pack-schema.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/macos-shell/src/features/widget/pet-pack-schema.ts apps/macos-shell/src/features/widget/pet-pack-registry.ts apps/macos-shell/src/features/widget/__tests__/pet-pack-schema.test.ts apps/macos-shell/src/features/widget/packs/lobster-classic/manifest.json apps/macos-shell/src/features/settings/settings-store.ts
git commit -m "feat: add pet pack manifest registry"
```

### Task 7: Add Rive renderer support for official animated packs

**Files:**
- Modify: `apps/macos-shell/package.json`
- Create: `apps/macos-shell/src/features/widget/renderers/rive-pet-renderer.tsx`
- Create: `apps/macos-shell/src/features/widget/__tests__/rive-pet-renderer.test.tsx`
- Modify: `apps/macos-shell/src/features/widget/DesktopPet.tsx`
- Modify: `apps/macos-shell/src/features/widget/pet-pack-registry.ts`

**Step 1: Write the failing renderer selection test**

```tsx
it('loads the rive renderer when the selected pack declares renderer=rive', async () => {
  // select a rive pack in settings
  // expect DesktopPet to mount the rive renderer path instead of the dom renderer
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/rive-pet-renderer.test.tsx`
Expected: FAIL because there is no Rive renderer or dependency yet.

**Step 3: Write minimal implementation**

```json
{
  "dependencies": {
    "@rive-app/react-canvas": "^4.20.0"
  }
}
```

```tsx
export function RivePetRenderer({ scene, pack }: RivePetRendererProps) {
  // mount rive artboard and drive state inputs from scene.primaryActor/supportActors
}
```

**Step 4: Run targeted tests to verify they pass**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/rive-pet-renderer.test.tsx src/App.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/macos-shell/package.json apps/macos-shell/src/features/widget/renderers/rive-pet-renderer.tsx apps/macos-shell/src/features/widget/__tests__/rive-pet-renderer.test.tsx apps/macos-shell/src/features/widget/DesktopPet.tsx apps/macos-shell/src/features/widget/pet-pack-registry.ts
git commit -m "feat: support rive pet packs"
```

### Task 8: Add sprite-pack support and custom-pack import scaffolding

**Files:**
- Create: `apps/macos-shell/src/features/widget/renderers/sprite-pet-renderer.tsx`
- Create: `apps/macos-shell/src/features/widget/pet-pack-import.ts`
- Create: `apps/macos-shell/src/features/widget/__tests__/sprite-pet-renderer.test.tsx`
- Create: `apps/macos-shell/src/features/widget/__tests__/pet-pack-import.test.ts`
- Modify: `apps/macos-shell/electron/preload.ts`
- Modify: `apps/macos-shell/electron/main.ts`
- Modify: `apps/macos-shell/src/features/widget/WidgetPanel.tsx`

**Step 1: Write the failing import validation test**

```ts
it('rejects imported packs whose manifest references missing assets', async () => {
  await expect(validateImportedPetPack({
    manifest: { id: 'broken-pack', renderer: 'sprite', states: { idle: ['idle_loop'] } },
    files: {}
  })).rejects.toThrow(/missing asset/i);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/pet-pack-import.test.ts`
Expected: FAIL because import validation does not exist.

**Step 3: Write minimal implementation**

```ts
export async function validateImportedPetPack(input: ImportedPackCandidate) {
  // schema validate
  // ensure renderer assets exist
  // ensure stage slots match supportsGroupStage/maxActors
}
```

```tsx
// WidgetPanel.tsx
<button type="button" onClick={onImportPetPack}>Import Pet Pack</button>
```

**Step 4: Run targeted tests to verify they pass**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/sprite-pet-renderer.test.tsx src/features/widget/__tests__/pet-pack-import.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/macos-shell/src/features/widget/renderers/sprite-pet-renderer.tsx apps/macos-shell/src/features/widget/pet-pack-import.ts apps/macos-shell/src/features/widget/__tests__/sprite-pet-renderer.test.tsx apps/macos-shell/src/features/widget/__tests__/pet-pack-import.test.ts apps/macos-shell/electron/preload.ts apps/macos-shell/electron/main.ts apps/macos-shell/src/features/widget/WidgetPanel.tsx
git commit -m "feat: add sprite packs and custom pack import validation"
```

### Task 9: Final verification

**Files:**
- Modify: `README.md`
- Modify: `docs/testing-guide.md`

**Step 1: Update user-facing docs**

Document:

- free dragging without snap
- pinned vs group display modes
- built-in pack selection
- imported pack constraints

**Step 2: Run focused verification**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/DesktopPet.test.tsx src/App.test.tsx src/features/habitat/__tests__/agent-snapshots.test.ts src/features/widget/__tests__/pet-scene.test.ts src/features/widget/__tests__/pet-pack-schema.test.ts`
Expected: PASS

**Step 3: Run app lint**

Run: `pnpm --filter @openclaw-habitat/macos-shell lint`
Expected: PASS

**Step 4: Commit**

```bash
git add README.md docs/testing-guide.md
git commit -m "docs: document desktop pet platform modes and packs"
```

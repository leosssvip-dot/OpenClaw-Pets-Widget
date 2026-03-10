# OpenClaw Agent Habitat for macOS Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a macOS-first desktop pet app that connects to local or remote OpenClaw Gateways, binds one pet per agent, and lets users message agents, assign tasks, and see agent state as customizable desktop characters.

**Architecture:** Use a TypeScript monorepo with a shared domain package, a bridge package for OpenClaw connectivity, and an Electron + React macOS shell for the pet surface. Treat each pet as a projection of `gateway instance + agent id + persona profile`; the UI never owns business logic and only renders synchronized state from the bridge layer. Design the bridge as remote-first so the same contract can back a future iOS client without rewriting agent, session, or task semantics.

**Tech Stack:** `pnpm`, TypeScript, Electron, React, Vite, Zustand, XState, Zod, Vitest, Testing Library, Playwright, ESLint, Prettier

**Related Skills:** `@test-driven-development`, `@verification-before-completion`, `@subagent-driven-development`

---

### Task 1: Bootstrap the workspace and macOS shell

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `apps/macos-shell/package.json`
- Create: `apps/macos-shell/tsconfig.json`
- Create: `apps/macos-shell/vite.config.ts`
- Create: `apps/macos-shell/electron/main.ts`
- Create: `apps/macos-shell/electron/preload.ts`
- Create: `apps/macos-shell/src/main.tsx`
- Create: `apps/macos-shell/src/App.tsx`
- Create: `apps/macos-shell/src/styles.css`
- Create: `apps/macos-shell/src/App.test.tsx`

**Step 1: Write the failing shell smoke test**

```tsx
import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('renders the empty habitat shell', () => {
    render(<App />);
    expect(screen.getByText('No pets connected')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/App.test.tsx`
Expected: FAIL with module resolution or missing component errors because the workspace and app do not exist yet.

**Step 3: Write the minimal implementation**

```json
{
  "name": "openclaw-habitat",
  "private": true,
  "packageManager": "pnpm@10.0.0",
  "scripts": {
    "dev": "pnpm --filter @openclaw-habitat/macos-shell dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint"
  }
}
```

```tsx
export function App() {
  return (
    <main className="app-shell">
      <h1>Agent Habitat</h1>
      <p>No pets connected</p>
    </main>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/App.test.tsx`
Expected: PASS with one passing test for the renderer shell.

**Step 5: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json apps/macos-shell
git commit -m "chore: bootstrap macos habitat shell"
```

### Task 2: Define the shared domain model and pet status contract

**Files:**
- Create: `packages/domain/package.json`
- Create: `packages/domain/tsconfig.json`
- Create: `packages/domain/src/index.ts`
- Create: `packages/domain/src/models.ts`
- Create: `packages/domain/src/pet-status.ts`
- Create: `packages/domain/src/persona.ts`
- Create: `packages/domain/src/__tests__/pet-status.test.ts`

**Step 1: Write the failing domain tests**

```ts
import { describe, expect, it } from 'vitest';
import { mapAgentSnapshotToPetStatus } from '../pet-status';

describe('mapAgentSnapshotToPetStatus', () => {
  it('maps a running task to working', () => {
    expect(
      mapAgentSnapshotToPetStatus({
        taskState: 'running',
        waitingOn: null,
        hasError: false,
        collaboratorIds: [],
        reasoningActive: false,
        justCompleted: false
      })
    ).toBe('working');
  });

  it('maps a collaborator fan-out to collaborating', () => {
    expect(
      mapAgentSnapshotToPetStatus({
        taskState: 'running',
        waitingOn: null,
        hasError: false,
        collaboratorIds: ['agent-b'],
        reasoningActive: false,
        justCompleted: false
      })
    ).toBe('collaborating');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/domain test -- --run src/__tests__/pet-status.test.ts`
Expected: FAIL because the domain package and mapping function do not exist yet.

**Step 3: Write the minimal implementation**

```ts
export type PetStatus =
  | 'idle'
  | 'thinking'
  | 'working'
  | 'waiting'
  | 'collaborating'
  | 'done'
  | 'blocked';

export interface GatewayAgentSnapshot {
  taskState: 'idle' | 'running' | 'completed';
  waitingOn: 'user' | 'channel' | null;
  hasError: boolean;
  collaboratorIds: string[];
  reasoningActive: boolean;
  justCompleted: boolean;
}

export function mapAgentSnapshotToPetStatus(input: GatewayAgentSnapshot): PetStatus {
  if (input.hasError) return 'blocked';
  if (input.collaboratorIds.length > 0) return 'collaborating';
  if (input.justCompleted || input.taskState === 'completed') return 'done';
  if (input.waitingOn) return 'waiting';
  if (input.taskState === 'running') return 'working';
  if (input.reasoningActive) return 'thinking';
  return 'idle';
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @openclaw-habitat/domain test -- --run src/__tests__/pet-status.test.ts`
Expected: PASS with deterministic status mapping for all current cases.

**Step 5: Commit**

```bash
git add packages/domain
git commit -m "feat: define habitat domain contracts"
```

### Task 3: Build the bridge contract for local and remote OpenClaw connections

**Files:**
- Create: `packages/bridge/package.json`
- Create: `packages/bridge/tsconfig.json`
- Create: `packages/bridge/src/index.ts`
- Create: `packages/bridge/src/contracts.ts`
- Create: `packages/bridge/src/profile-schema.ts`
- Create: `packages/bridge/src/mock-bridge-client.ts`
- Create: `packages/bridge/src/openclaw-event-parser.ts`
- Create: `packages/bridge/src/__tests__/profile-schema.test.ts`
- Create: `packages/bridge/src/__tests__/openclaw-event-parser.test.ts`
- Create: `docs/research/openclaw-bridge-contract.md`

**Step 1: Write the failing validation and parser tests**

```ts
import { describe, expect, it } from 'vitest';
import { gatewayProfileSchema } from '../profile-schema';

describe('gatewayProfileSchema', () => {
  it('accepts an ssh profile', () => {
    expect(
      gatewayProfileSchema.parse({
        id: 'devbox',
        label: 'My Remote OpenClaw',
        transport: 'ssh',
        host: 'example.internal',
        username: 'me'
      }).transport
    ).toBe('ssh');
  });
});
```

```ts
import { describe, expect, it } from 'vitest';
import { parseOpenClawEvent } from '../openclaw-event-parser';

describe('parseOpenClawEvent', () => {
  it('normalizes a task completion event', () => {
    expect(
      parseOpenClawEvent({
        type: 'agent.task.completed',
        agentId: 'researcher',
        gatewayId: 'remote-1'
      }).kind
    ).toBe('agent.completed');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm --filter @openclaw-habitat/bridge test -- --run src/__tests__/profile-schema.test.ts src/__tests__/openclaw-event-parser.test.ts`
Expected: FAIL because the bridge package does not exist yet.

**Step 3: Write the minimal implementation**

```ts
export const gatewayProfileSchema = z.discriminatedUnion('transport', [
  z.object({
    id: z.string(),
    label: z.string(),
    transport: z.literal('local')
  }),
  z.object({
    id: z.string(),
    label: z.string(),
    transport: z.literal('ssh'),
    host: z.string(),
    username: z.string(),
    port: z.number().default(22)
  }),
  z.object({
    id: z.string(),
    label: z.string(),
    transport: z.literal('tailnet'),
    baseUrl: z.string().url(),
    token: z.string().min(1)
  })
]);
```

```ts
export interface BridgeClient {
  connect(profileId: string): Promise<void>;
  disconnect(): Promise<void>;
  listAgents(): Promise<AgentBindingSeed[]>;
  subscribe(listener: (event: HabitatEvent) => void): () => void;
  sendMessage(input: SendMessageInput): Promise<void>;
  createTask(input: CreateTaskInput): Promise<void>;
}

export function parseOpenClawEvent(input: { type: string; agentId: string; gatewayId: string }) {
  if (input.type === 'agent.task.completed') {
    return {
      kind: 'agent.completed' as const,
      agentId: input.agentId,
      gatewayId: input.gatewayId
    };
  }

  return {
    kind: 'agent.unknown' as const,
    agentId: input.agentId,
    gatewayId: input.gatewayId
  };
}
```

Document in `docs/research/openclaw-bridge-contract.md` the exact OpenClaw endpoint, event, and auth details discovered from the current upstream docs/source before writing the real network adapter. Keep the bridge interface stable even if concrete endpoint names change.

**Step 4: Run tests to verify they pass**

Run: `pnpm --filter @openclaw-habitat/bridge test -- --run src/__tests__/profile-schema.test.ts src/__tests__/openclaw-event-parser.test.ts`
Expected: PASS with valid transport profile parsing and basic event normalization.

**Step 5: Commit**

```bash
git add packages/bridge docs/research/openclaw-bridge-contract.md
git commit -m "feat: add openclaw bridge contracts"
```

### Task 4: Implement the macOS shell window, tray, and preload API

**Files:**
- Modify: `apps/macos-shell/electron/main.ts`
- Modify: `apps/macos-shell/electron/preload.ts`
- Create: `apps/macos-shell/electron/window-options.ts`
- Create: `apps/macos-shell/electron/tray.ts`
- Create: `apps/macos-shell/electron/__tests__/window-options.test.ts`

**Step 1: Write the failing window option test**

```ts
import { describe, expect, it } from 'vitest';
import { buildPetWindowOptions } from '../window-options';

describe('buildPetWindowOptions', () => {
  it('creates a transparent always-on-top window', () => {
    const options = buildPetWindowOptions();
    expect(options.transparent).toBe(true);
    expect(options.frame).toBe(false);
    expect(options.alwaysOnTop).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run electron/__tests__/window-options.test.ts`
Expected: FAIL because the shell window builder does not exist yet.

**Step 3: Write the minimal implementation**

```ts
export function buildPetWindowOptions(): Electron.BrowserWindowConstructorOptions {
  return {
    width: 420,
    height: 320,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true
    }
  };
}
```

```ts
contextBridge.exposeInMainWorld('habitat', {
  getRuntimeInfo: () => ipcRenderer.invoke('runtime:getInfo'),
  movePetWindow: (payload: { x: number; y: number }) => ipcRenderer.invoke('window:movePet', payload)
});
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run electron/__tests__/window-options.test.ts`
Expected: PASS with the basic desktop pet shell configuration locked in.

**Step 5: Commit**

```bash
git add apps/macos-shell/electron
git commit -m "feat: add macos habitat shell window"
```

### Task 5: Add pet store, state machines, and multi-agent rendering

**Files:**
- Create: `apps/macos-shell/src/features/habitat/store.ts`
- Create: `apps/macos-shell/src/features/habitat/pet-machine.ts`
- Create: `apps/macos-shell/src/features/habitat/types.ts`
- Create: `apps/macos-shell/src/features/habitat/PetCanvas.tsx`
- Create: `apps/macos-shell/src/features/habitat/PetSprite.tsx`
- Create: `apps/macos-shell/src/features/habitat/PetBubble.tsx`
- Create: `apps/macos-shell/src/features/habitat/__tests__/store.test.ts`
- Modify: `apps/macos-shell/src/App.tsx`
- Modify: `apps/macos-shell/src/styles.css`

**Step 1: Write the failing store test**

```ts
import { describe, expect, it } from 'vitest';
import { createHabitatStore } from '../store';

describe('createHabitatStore', () => {
  it('updates a bound pet when a normalized event arrives', () => {
    const store = createHabitatStore();
    store.getState().seedPets([
      { id: 'pet-1', agentId: 'researcher', gatewayId: 'remote-1', status: 'idle' }
    ]);

    store.getState().applyEvent({
      kind: 'agent.completed',
      petId: 'pet-1'
    });

    expect(store.getState().pets['pet-1'].status).toBe('done');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/habitat/__tests__/store.test.ts`
Expected: FAIL because the pet store and event reducer do not exist yet.

**Step 3: Write the minimal implementation**

```ts
export const createHabitatStore = () =>
  create<HabitatState>((set) => ({
    pets: {},
    seedPets: (pets) =>
      set({
        pets: Object.fromEntries(pets.map((pet) => [pet.id, pet]))
      }),
    applyEvent: (event) =>
      set((state) => {
        if (event.kind === 'agent.completed') {
          const pet = state.pets[event.petId];
          return {
            pets: {
              ...state.pets,
              [event.petId]: { ...pet, status: 'done' }
            }
          };
        }

        return state;
      })
  }));
```

```tsx
export function PetCanvas() {
  const pets = useHabitatStore((state) => Object.values(state.pets));
  return (
    <div className="pet-canvas">
      {pets.map((pet) => (
        <PetSprite key={pet.id} pet={pet} />
      ))}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/habitat/__tests__/store.test.ts`
Expected: PASS with deterministic state updates for normalized bridge events.

**Step 5: Commit**

```bash
git add apps/macos-shell/src
git commit -m "feat: render multi-agent pet habitat"
```

### Task 6: Implement click, drag, quick messaging, and task assignment

**Files:**
- Create: `apps/macos-shell/src/features/composer/QuickComposer.tsx`
- Create: `apps/macos-shell/src/features/composer/useQuickComposer.ts`
- Create: `apps/macos-shell/src/features/composer/__tests__/QuickComposer.test.tsx`
- Modify: `apps/macos-shell/src/features/habitat/PetSprite.tsx`
- Modify: `apps/macos-shell/src/features/habitat/store.ts`
- Create: `apps/macos-shell/src/features/results/ResultCard.tsx`
- Create: `apps/macos-shell/src/features/results/__tests__/ResultCard.test.tsx`

**Step 1: Write the failing interaction test**

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { QuickComposer } from '../QuickComposer';

describe('QuickComposer', () => {
  it('submits a quick task to the selected pet', async () => {
    const onSubmit = vi.fn();
    render(<QuickComposer petName="Scout" onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'Summarize today\\'s unread Feishu threads' }
    });
    fireEvent.click(screen.getByText('Send'));

    expect(onSubmit).toHaveBeenCalledWith("Summarize today's unread Feishu threads");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/composer/__tests__/QuickComposer.test.tsx`
Expected: FAIL because the composer flow does not exist yet.

**Step 3: Write the minimal implementation**

```tsx
export function QuickComposer({
  petName,
  onSubmit
}: {
  petName: string;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState('');

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(value.trim());
        setValue('');
      }}
    >
      <label>
        Message
        <input value={value} onChange={(event) => setValue(event.target.value)} />
      </label>
      <button type="submit">Send</button>
    </form>
  );
}
```

```ts
async function sendQuickPrompt(petId: string, content: string) {
  const { bridge } = getRuntimeDeps();
  await bridge.sendMessage({ petId, content });
  getState().markPetAsThinking(petId, content);
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/composer/__tests__/QuickComposer.test.tsx`
Expected: PASS with a verified quick message submission flow.

**Step 5: Commit**

```bash
git add apps/macos-shell/src/features/composer apps/macos-shell/src/features/results apps/macos-shell/src/features/habitat
git commit -m "feat: add quick messaging and task assignment"
```

### Task 7: Add gateway profiles, agent binding, and connection-state UX

**Files:**
- Create: `apps/macos-shell/src/features/settings/GatewayProfiles.tsx`
- Create: `apps/macos-shell/src/features/settings/AgentBindings.tsx`
- Create: `apps/macos-shell/src/features/settings/settings-store.ts`
- Create: `apps/macos-shell/src/features/settings/__tests__/settings-store.test.ts`
- Create: `apps/macos-shell/src/features/connection/ConnectionBadge.tsx`
- Create: `apps/macos-shell/src/features/connection/ReconnectBanner.tsx`
- Modify: `apps/macos-shell/src/App.tsx`

**Step 1: Write the failing settings test**

```ts
import { describe, expect, it } from 'vitest';
import { createSettingsStore } from '../settings-store';

describe('createSettingsStore', () => {
  it('persists the selected gateway profile and pet binding', () => {
    const store = createSettingsStore();
    store.getState().saveGatewayProfile({
      id: 'remote-1',
      label: 'Studio Gateway',
      transport: 'ssh',
      host: 'studio.internal',
      username: 'chenyang'
    });
    store.getState().bindPetToAgent({
      petId: 'pet-1',
      gatewayId: 'remote-1',
      agentId: 'researcher'
    });

    expect(store.getState().bindings['pet-1'].agentId).toBe('researcher');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/settings/__tests__/settings-store.test.ts`
Expected: FAIL because settings and binding persistence do not exist yet.

**Step 3: Write the minimal implementation**

```ts
export const createSettingsStore = () =>
  create<SettingsState>()(
    persist(
      (set) => ({
        gatewayProfiles: {},
        bindings: {},
        saveGatewayProfile: (profile) =>
          set((state) => ({
            gatewayProfiles: { ...state.gatewayProfiles, [profile.id]: profile }
          })),
        bindPetToAgent: (binding) =>
          set((state) => ({
            bindings: { ...state.bindings, [binding.petId]: binding }
          }))
      }),
      { name: 'openclaw-habitat-settings' }
    )
  );
```

Render connection state with distinct UI for `connecting`, `connected`, `reconnecting`, `offline`, and `auth-expired`. Do not collapse `agent is waiting` into `network is broken`; those states must remain visibly different.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/settings/__tests__/settings-store.test.ts`
Expected: PASS with persistent remote profile and binding state.

**Step 5: Commit**

```bash
git add apps/macos-shell/src/features/settings apps/macos-shell/src/features/connection apps/macos-shell/src/App.tsx
git commit -m "feat: add remote gateway profiles and bindings"
```

### Task 8: Wire the real OpenClaw transport, add end-to-end coverage, and document operation

**Files:**
- Create: `packages/bridge/src/openclaw-client.ts`
- Modify: `packages/bridge/src/index.ts`
- Create: `apps/macos-shell/e2e/app-connect-and-send.spec.ts`
- Create: `apps/macos-shell/e2e/fixtures/mock-openclaw-server.ts`
- Create: `README.md`
- Create: `.env.example`
- Create: `.gitignore`

**Step 1: Write the failing end-to-end test**

```ts
import { test, expect } from '@playwright/test';

test('connects to a mock gateway and sends a quick message', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Add Gateway').click();
  await page.getByLabel('Gateway URL').fill('http://127.0.0.1:4318');
  await page.getByText('Connect').click();
  await page.getByText('Scout').click();
  await page.getByLabel('Message').fill('Prepare a handoff note');
  await page.getByText('Send').click();

  await expect(page.getByText('Prepare a handoff note')).toBeVisible();
  await expect(page.getByText('Done')).toBeVisible();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell exec playwright test e2e/app-connect-and-send.spec.ts`
Expected: FAIL because no mock gateway or real bridge is wired yet.

**Step 3: Write the minimal implementation**

```ts
export class OpenClawClient implements BridgeClient {
  async connect(profileId: string): Promise<void> {
    this.socket = new WebSocket(resolveGatewayUrl(profileId));
    await onceOpen(this.socket);
  }

  subscribe(listener: (event: HabitatEvent) => void) {
    this.socket?.addEventListener('message', (message) => {
      listener(parseOpenClawEvent(JSON.parse(String(message.data))));
    });
    return () => this.socket?.close();
  }

  async sendMessage(input: SendMessageInput): Promise<void> {
    this.socket?.send(
      JSON.stringify({
        type: 'agent.message.send',
        payload: input
      })
    );
  }
}
```

Write `README.md` with:
- local development commands
- required OpenClaw prerequisites
- supported transports for v1: `local`, `ssh`, `tailnet`
- current non-goals: public cloud relay, Windows, iOS shipping client

**Step 4: Run verification to prove the system works**

Run: `pnpm lint`
Expected: PASS with zero lint errors.

Run: `pnpm test`
Expected: PASS with unit and component tests green.

Run: `pnpm --filter @openclaw-habitat/macos-shell exec playwright test`
Expected: PASS with the mock gateway connection flow green.

**Step 5: Commit**

```bash
git add packages/bridge apps/macos-shell/e2e README.md .env.example .gitignore
git commit -m "feat: integrate openclaw transport and document v1"
```

### Delivery Notes

- Do not implement public cloud relay in v1.
- Do not build Windows support in this plan.
- Keep iOS out of scope for code, but preserve shared bridge/domain contracts so iOS can reuse them later.
- Preserve the distinction between `agent state` and `connection state` in every layer.
- Treat persona customization as data, not branching code paths. Add skins and personality presets after the bridge and state model are stable.

### Suggested Milestones

1. `Milestone A`: repository boots, shell renders, domain model exists
2. `Milestone B`: remote profiles connect, events normalize, pets render
3. `Milestone C`: quick messaging and task assignment work against a mock gateway
4. `Milestone D`: real OpenClaw transport is wired and documented

Plan complete and saved to `docs/plans/2026-03-10-openclaw-agent-habitat-macos.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**

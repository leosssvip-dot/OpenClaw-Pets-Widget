# OpenClaw Desktop Widget Over SSH Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert the current React-first habitat into a real macOS desktop widget: a single floating pet window with edge-snapping, a popout control panel, and first-class SSH tunneling to a remote always-on OpenClaw Gateway.

**Architecture:** Keep Electron as the real app shell and move the current renderer into a compact popout panel instead of a full-page dashboard. Add a main-process SSH tunnel manager that owns the remote lifecycle boundary, exposes connection state to the renderer through IPC, and feeds the existing bridge layer with a local forwarded WebSocket endpoint. Preserve the shared domain/bridge contracts, but split “desktop shell state” from “remote gateway connection state” so the pet remains responsive even while the tunnel reconnects or fails.

**Tech Stack:** `pnpm`, TypeScript, Electron, React, Vite, Zustand, XState, Zod, Vitest, Playwright, Node `child_process`, OpenSSH client

---

### Task 1: Turn dev/start flows into a real Electron desktop app

**Files:**
- Modify: `package.json`
- Modify: `apps/macos-shell/package.json`
- Modify: `apps/macos-shell/electron/main.ts`
- Create: `apps/macos-shell/electron/dev-runner.ts`
- Create: `apps/macos-shell/electron/panel-window.ts`
- Create: `apps/macos-shell/electron/pet-window.ts`
- Create: `apps/macos-shell/electron/__tests__/pet-window.test.ts`

**Step 1: Write the failing Electron window test**

```ts
import { describe, expect, it } from 'vitest';
import { buildPetWidgetWindowOptions } from '../pet-window';

describe('buildPetWidgetWindowOptions', () => {
  it('creates a compact always-on-top pet widget window', () => {
    const options = buildPetWidgetWindowOptions();
    expect(options.width).toBe(140);
    expect(options.height).toBe(160);
    expect(options.transparent).toBe(true);
    expect(options.alwaysOnTop).toBe(true);
    expect(options.resizable).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run electron/__tests__/pet-window.test.ts`
Expected: FAIL because the desktop widget window builder does not exist yet.

**Step 3: Write the minimal implementation**

- Add a true Electron entry flow for local development and app startup.
- Split the single renderer host window into:
  - a compact pet widget window
  - a separate popout control panel window anchored to the pet position
- Keep both windows frameless and macOS-friendly.

```ts
export function buildPetWidgetWindowOptions(): Electron.BrowserWindowConstructorOptions {
  return {
    width: 140,
    height: 160,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true
    }
  };
}
```

- Add root scripts such as:
  - `pnpm dev:desktop`
  - `pnpm start:desktop`

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run electron/__tests__/pet-window.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add package.json apps/macos-shell/package.json apps/macos-shell/electron
git commit -m "feat: run habitat as desktop widget"
```

### Task 2: Add pet widget shell, expand/collapse panel, and edge snapping

**Files:**
- Create: `apps/macos-shell/src/features/widget/DesktopPet.tsx`
- Create: `apps/macos-shell/src/features/widget/WidgetPanel.tsx`
- Create: `apps/macos-shell/src/features/widget/widget-store.ts`
- Create: `apps/macos-shell/src/features/widget/__tests__/widget-store.test.ts`
- Modify: `apps/macos-shell/src/App.tsx`
- Modify: `apps/macos-shell/src/styles.css`
- Modify: `apps/macos-shell/electron/preload.ts`
- Modify: `apps/macos-shell/electron/main.ts`

**Step 1: Write the failing widget state test**

```ts
import { describe, expect, it } from 'vitest';
import { createWidgetStore } from '../widget-store';

describe('createWidgetStore', () => {
  it('opens the control panel when the pet is toggled', () => {
    const store = createWidgetStore();
    store.getState().togglePanel();
    expect(store.getState().isPanelOpen).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/widget-store.test.ts`
Expected: FAIL because the widget store does not exist yet.

**Step 3: Write the minimal implementation**

- Replace the full-page dashboard layout with:
  - a pet character shell in collapsed mode
  - a side popout panel when expanded
- Add IPC methods for:
  - toggle panel
  - drag move
  - snap to left/right edge on mouse release
- Keep the control panel content centered on:
  - selected agent status
  - message input
  - recent result

```ts
export const createWidgetStore = () =>
  createStore<WidgetState>((set) => ({
    isPanelOpen: false,
    togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen }))
  }));
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/widget-store.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/macos-shell/src apps/macos-shell/electron
git commit -m "feat: add floating desktop pet widget"
```

### Task 3: Implement SSH tunnel manager for remote always-on OpenClaw

**Files:**
- Create: `packages/bridge/src/ssh-tunnel.ts`
- Create: `packages/bridge/src/__tests__/ssh-tunnel.test.ts`
- Modify: `packages/bridge/src/contracts.ts`
- Modify: `packages/bridge/src/profile-schema.ts`
- Modify: `packages/bridge/src/openclaw-client.ts`
- Modify: `packages/bridge/src/index.ts`
- Create: `apps/macos-shell/electron/ssh-runtime.ts`
- Modify: `apps/macos-shell/electron/main.ts`

**Step 1: Write the failing SSH command builder test**

```ts
import { describe, expect, it } from 'vitest';
import { buildSshTunnelCommand } from '../ssh-tunnel';

describe('buildSshTunnelCommand', () => {
  it('forwards a remote gateway to local loopback', () => {
    expect(
      buildSshTunnelCommand({
        host: 'studio.internal',
        username: 'chenyang',
        sshPort: 22,
        identityFile: '~/.ssh/id_ed25519',
        localPort: 18789,
        remotePort: 18789
      })
    ).toEqual([
      'ssh',
      '-N',
      '-p',
      '22',
      '-L',
      '18789:127.0.0.1:18789',
      '-i',
      '~/.ssh/id_ed25519',
      'chenyang@studio.internal'
    ]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/bridge test -- --run src/__tests__/ssh-tunnel.test.ts`
Expected: FAIL because the SSH tunnel module does not exist yet.

**Step 3: Write the minimal implementation**

- Add a dedicated `ssh` gateway profile shape with fields such as:
  - `host`
  - `username`
  - `sshPort`
  - `identityFile`
  - `remoteGatewayPort`
  - `gatewayToken`
- Start an OpenSSH tunnel from Electron main process using `child_process.spawn`.
- Connect the existing `OpenClawClient` to `ws://127.0.0.1:<forwarded-port>` after the tunnel is ready.
- If tunnel startup fails, surface `offline` or `auth-expired`; do not try to remote-start OpenClaw.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @openclaw-habitat/bridge test -- --run src/__tests__/ssh-tunnel.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/bridge apps/macos-shell/electron
git commit -m "feat: add ssh tunnel runtime for remote gateway"
```

### Task 4: Replace generic gateway form with SSH-first remote connection UX

**Files:**
- Modify: `apps/macos-shell/src/features/settings/GatewayProfiles.tsx`
- Modify: `apps/macos-shell/src/features/settings/settings-store.ts`
- Create: `apps/macos-shell/src/features/settings/SshConnectionForm.tsx`
- Create: `apps/macos-shell/src/features/settings/__tests__/ssh-connection-form.test.tsx`
- Modify: `apps/macos-shell/src/App.tsx`

**Step 1: Write the failing SSH connection form test**

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { SshConnectionForm } from '../SshConnectionForm';

describe('SshConnectionForm', () => {
  it('submits remote ssh settings', () => {
    const onSubmit = vi.fn();
    render(<SshConnectionForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Remote Host'), {
      target: { value: 'studio.internal' }
    });
    fireEvent.change(screen.getByLabelText('SSH User'), {
      target: { value: 'chenyang' }
    });
    fireEvent.click(screen.getByText('Connect'));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'studio.internal',
        username: 'chenyang'
      })
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/settings/__tests__/ssh-connection-form.test.tsx`
Expected: FAIL.

**Step 3: Write the minimal implementation**

- Replace the current generic Gateway URL input with an SSH-oriented form.
- Required fields:
  - `Remote Host`
  - `SSH User`
- Optional fields:
  - `SSH Port`
  - `Identity File`
  - `Gateway Port`
  - `Gateway Token`
- Make the copy explicit: “OpenClaw must already be running on the remote machine.”

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/settings/__tests__/ssh-connection-form.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/macos-shell/src/features/settings apps/macos-shell/src/App.tsx
git commit -m "feat: add ssh-first remote connection form"
```

### Task 5: Update end-to-end coverage for desktop-remote widget behavior

**Files:**
- Modify: `apps/macos-shell/e2e/app-connect-and-send.spec.ts`
- Modify: `apps/macos-shell/e2e/fixtures/mock-openclaw-server.ts`
- Create: `apps/macos-shell/e2e/fixtures/mock-ssh.ts`
- Modify: `README.md`
- Modify: `docs/testing-guide.md`
- Modify: `.env.example`

**Step 1: Write the failing E2E expectation update**

- Update the existing E2E flow so it fills SSH fields instead of a bare gateway URL.
- Add assertions for:
  - collapsed pet shell visible
  - panel opens on click
  - SSH-backed remote connect succeeds
  - message send produces `Done`

**Step 2: Run E2E to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell exec playwright test e2e/app-connect-and-send.spec.ts`
Expected: FAIL because the current UI and runtime are not SSH-first desktop widget flows yet.

**Step 3: Write the minimal implementation**

- Mock SSH tunnel startup in E2E.
- Keep the renderer tests browser-based, but ensure the user-facing flow matches the desktop widget UX and remote-over-SSH setup.
- Update docs to explain exactly how a user connects to another computer over SSH.

**Step 4: Run full verification**

Run: `pnpm lint`
Expected: PASS.

Run: `pnpm test`
Expected: PASS.

Run: `pnpm --filter @openclaw-habitat/macos-shell exec playwright test`
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/macos-shell/e2e README.md docs/testing-guide.md .env.example
git commit -m "feat: document and verify ssh desktop widget flow"
```

### Delivery Notes

- The final UX is a desktop widget, not a browser dashboard.
- Remote connection is SSH-first; Tailscale is out of scope.
- OpenClaw on the remote machine is assumed to be already running.
- If SSH, port forwarding, or token verification fails, show connection failure and stop.
- Keep control panel content focused on one selected agent at a time.


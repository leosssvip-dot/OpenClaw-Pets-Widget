# Lobster Pet Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve the desktop lobster pet with a better default appearance, customizable avatar inputs, double-click-only panel opening, and clearer multi-agent status visibility.

**Architecture:** Keep the Electron window controls unchanged at the IPC boundary and move behavior updates into the React renderer. Add a lightweight appearance config model in the renderer so the default pet can still render without assets, but users can supply image URLs or local file URLs later. Reuse the existing habitat store as the source of truth for live agent state and derive richer panel rows from `pets + bindings`.

**Tech Stack:** React 19, Vitest, Testing Library, Zustand, Electron preload IPC

---

### Task 1: Plan the interaction and appearance model

**Files:**
- Create: `docs/plans/2026-03-11-lobster-pet-polish.md`
- Modify: `apps/macos-shell/src/features/widget/DesktopPet.tsx`
- Modify: `apps/macos-shell/src/features/widget/widget-store.ts`
- Test: `apps/macos-shell/src/features/widget/__tests__/DesktopPet.test.tsx`

**Step 1: Write the failing interaction test**

```tsx
it('moves on drag without toggling the panel and toggles on double click', async () => {
  // render DesktopPet with mocked desktop API
  // drag: expect movePetWindow + snapPetWindow, but no togglePanel
  // double click: expect togglePanel once
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/DesktopPet.test.tsx`
Expected: FAIL because the current component toggles on single click and has no drag threshold protection.

**Step 3: Write minimal implementation**

Update `DesktopPet.tsx` to:
- track pointer start position
- treat movement beyond a small threshold as drag
- skip toggle on drag end
- open panel only from `onDoubleClick`

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/DesktopPet.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/macos-shell/src/features/widget/DesktopPet.tsx apps/macos-shell/src/features/widget/__tests__/DesktopPet.test.tsx
git commit -m "fix: require double click to open pet panel"
```

### Task 2: Add customizable lobster appearance plumbing

**Files:**
- Create: `apps/macos-shell/src/features/widget/pet-appearance.ts`
- Modify: `apps/macos-shell/src/features/widget/DesktopPet.tsx`
- Modify: `apps/macos-shell/src/styles.css`
- Test: `apps/macos-shell/src/features/widget/__tests__/pet-appearance.test.ts`

**Step 1: Write the failing appearance test**

```ts
it('normalizes custom avatar inputs and falls back to the default lobster shell', () => {
  // file URL / https URL / data URL accepted
  // unsupported inputs fall back to default
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/pet-appearance.test.ts`
Expected: FAIL because no appearance model exists yet.

**Step 3: Write minimal implementation**

Create an appearance helper that:
- exposes the supported input contract
- validates remote/local/data URLs
- provides a better built-in lobster variant when no custom art exists

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/pet-appearance.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/macos-shell/src/features/widget/pet-appearance.ts apps/macos-shell/src/features/widget/__tests__/pet-appearance.test.ts apps/macos-shell/src/features/widget/DesktopPet.tsx apps/macos-shell/src/styles.css
git commit -m "feat: support custom lobster pet appearances"
```

### Task 3: Surface multi-agent state clearly in the panel

**Files:**
- Modify: `apps/macos-shell/src/App.tsx`
- Modify: `apps/macos-shell/src/features/widget/WidgetPanel.tsx`
- Modify: `apps/macos-shell/src/features/settings/AgentBindings.tsx`
- Modify: `apps/macos-shell/src/styles.css`
- Test: `apps/macos-shell/src/App.test.tsx`

**Step 1: Write the failing agent-status test**

```tsx
it('shows connected agent rows with live status in the panel', async () => {
  // seed multiple pets + bindings
  // expect names, agent ids, gateway ids, and status text in the panel
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/App.test.tsx`
Expected: FAIL because the current panel only renders a static bindings list with no joined pet status model.

**Step 3: Write minimal implementation**

Derive a richer `agentCards` array from current pets and bindings, then render each row with:
- pet label
- agent id
- gateway id
- current pet status
- selection indicator

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/App.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/macos-shell/src/App.tsx apps/macos-shell/src/features/widget/WidgetPanel.tsx apps/macos-shell/src/features/settings/AgentBindings.tsx apps/macos-shell/src/styles.css apps/macos-shell/src/App.test.tsx
git commit -m "feat: show live agent status in widget panel"
```

### Task 4: Final verification

**Files:**
- Modify: `README.md`

**Step 1: Update user-facing guidance**

Document:
- supported custom image formats (`https:`, `file:`, `data:`)
- double-click to open panel
- drag to move

**Step 2: Run focused verification**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/DesktopPet.test.tsx src/features/widget/__tests__/pet-appearance.test.ts src/App.test.tsx`
Expected: PASS

**Step 3: Run app lint**

Run: `pnpm --filter @openclaw-habitat/macos-shell lint`
Expected: PASS

**Step 4: Commit**

```bash
git add README.md
git commit -m "docs: clarify pet customization and panel controls"
```

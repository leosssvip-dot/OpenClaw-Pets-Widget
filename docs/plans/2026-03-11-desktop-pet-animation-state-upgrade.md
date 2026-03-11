# Desktop Pet Animation State Upgrade Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add layered agent-state and owner-interaction animations to the desktop pet while keeping the current React/Electron shell stable.

**Architecture:** Introduce a small animation-state mapper so `DesktopPet` no longer collapses everything into one visual state. Split animation inputs into agent activity, mood, and owner interaction flags, then drive richer role-pack-specific motion from those semantic outputs in `styles.css`.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, CSS animations

---

### Task 1: Lock the new animation contract with tests

**Files:**
- Create: `apps/macos-shell/src/features/widget/__tests__/pet-animation-state.test.ts`
- Modify: `apps/macos-shell/src/features/widget/__tests__/DesktopPet.test.tsx`

**Step 1: Write the failing test**

Add pure mapping tests for activity/mood derivation and component tests for hover, press, drag, and richer state classes.

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/pet-animation-state.test.ts src/features/widget/__tests__/DesktopPet.test.tsx`

Expected: FAIL because the helper and interaction classes do not exist yet.

### Task 2: Implement the animation-state mapper

**Files:**
- Create: `apps/macos-shell/src/features/widget/pet-animation-state.ts`

**Step 1: Write minimal implementation**

Define semantic animation activity, mood, and interaction types plus a resolver from `petStatus` and connection state.

**Step 2: Run test to verify it passes**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/pet-animation-state.test.ts`

Expected: PASS.

### Task 3: Wire DesktopPet owner interactions to animation state

**Files:**
- Modify: `apps/macos-shell/src/features/widget/DesktopPet.tsx`
- Test: `apps/macos-shell/src/features/widget/__tests__/DesktopPet.test.tsx`

**Step 1: Write minimal implementation**

Track hovered, pressed, focused, dragging, and recent-owner-interaction flags, resolve semantic animation state, and expose stable classes on the root button.

**Step 2: Run test to verify it passes**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/DesktopPet.test.tsx`

Expected: PASS.

### Task 4: Upgrade role-pack motion rules

**Files:**
- Modify: `apps/macos-shell/src/styles.css`

**Step 1: Write minimal implementation**

Add generic interaction animations and role-pack-specific activity/mood/interaction motion so agent state changes and owner hover/press/panel-open actions look distinct.

**Step 2: Run targeted verification**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/pet-animation-state.test.ts src/features/widget/__tests__/DesktopPet.test.tsx`

Expected: PASS.

### Task 5: Full verification and commit

**Files:**
- Verify existing modified files only

**Step 1: Run verification**

Run: `pnpm --filter @openclaw-habitat/macos-shell build`

Expected: PASS.

**Step 2: Commit**

Run: `git add apps/macos-shell/src/features/widget/pet-animation-state.ts apps/macos-shell/src/features/widget/__tests__/pet-animation-state.test.ts apps/macos-shell/src/features/widget/DesktopPet.tsx apps/macos-shell/src/features/widget/__tests__/DesktopPet.test.tsx apps/macos-shell/src/styles.css docs/plans/2026-03-11-desktop-pet-animation-state-upgrade.md && git commit -m "feat: add layered pet animation states"`

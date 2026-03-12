# Professional Pet Panel Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the approved `Code / Plan / Ops / Focus` redesign across the desktop pet window and the widget panel so the active character reads as a specific work role instead of a generic mascot.

**Architecture:** Keep the current React + Zustand renderer split intact. Extend the existing role-pack metadata so both the panel and the floating pet can render role-specific labels, descriptions, and visuals from one source of truth. Rework `WidgetPanel` and `AgentBindings` around that metadata while preserving current connection, composer, and selection flows.

**Tech Stack:** React, TypeScript, Zustand, Vitest, Testing Library, CSS

---

### Task 1: Centralize professional role-pack metadata

**Files:**
- Modify: `apps/macos-shell/src/features/widget/pet-appearance.ts`
- Modify: `apps/macos-shell/src/features/widget/__tests__/pet-appearance.test.ts`
- Test: `apps/macos-shell/src/features/widget/__tests__/pet-appearance.test.ts`

**Step 1: Write the failing test**

Add assertions that built-in role packs expose the approved labels and role descriptors:
- `lobster -> Coder Claw / Code`
- `cat -> Planner Cat / Plan`
- `robot -> Ops Bot / Ops`
- `monk -> Mokugyo Monk / Focus`

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/pet-appearance.test.ts`

Expected: FAIL because current metadata still exposes generic `Lobster / Cat / Robot / Monk` labels and no explicit role descriptors.

**Step 3: Write minimal implementation**

Extend the role-pack metadata with:
- display label
- explicit work role label
- short panel tagline
- optional action-oriented prompt hint

Keep the existing default/fallback behavior intact.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/pet-appearance.test.ts`

Expected: PASS.

### Task 2: Redesign the widget panel around the current work role

**Files:**
- Modify: `apps/macos-shell/src/features/widget/WidgetPanel.tsx`
- Modify: `apps/macos-shell/src/features/settings/AgentBindings.tsx`
- Modify: `apps/macos-shell/src/App.test.tsx`
- Modify: `apps/macos-shell/src/features/settings/__tests__/agent-bindings.test.tsx`
- Modify: `apps/macos-shell/src/styles.css`
- Test: `apps/macos-shell/src/App.test.tsx`
- Test: `apps/macos-shell/src/features/settings/__tests__/agent-bindings.test.tsx`

**Step 1: Write the failing test**

Add assertions that require:
- the main panel to surface role-aware copy (`Coder Claw`, `Code`, etc.)
- the quick actions to describe role switching instead of generic character swapping
- the settings drawer character cards to show explicit role labels (`Code`, `Plan`, `Ops`, `Focus`)

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/App.test.tsx src/features/settings/__tests__/agent-bindings.test.tsx`

Expected: FAIL because the current panel and settings still use generic character names and generic helper text.

**Step 3: Write minimal implementation**

Drive panel copy from centralized role-pack metadata and:
- restyle the companion stage into a role-aware work stage
- update picker and settings labels to use work-role language
- keep connection and existing interaction handlers unchanged

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/App.test.tsx src/features/settings/__tests__/agent-bindings.test.tsx`

Expected: PASS.

### Task 3: Redesign the floating desktop pet markup and styling

**Files:**
- Modify: `apps/macos-shell/src/features/widget/DesktopPet.tsx`
- Modify: `apps/macos-shell/src/features/widget/__tests__/DesktopPet.test.tsx`
- Modify: `apps/macos-shell/src/styles.css`
- Test: `apps/macos-shell/src/features/widget/__tests__/DesktopPet.test.tsx`

**Step 1: Write the failing test**

Add assertions that require role-specific professional details in the built-in pet markup:
- coder lobster exposes headset or keyboard anatomy
- planner cat exposes task-board planning anatomy
- ops robot exposes status-screen or repair-arm anatomy
- monk exposes wooden-fish execution anatomy

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/DesktopPet.test.tsx`

Expected: FAIL because the current built-in art is still generic and does not expose these professional-role selectors.

**Step 3: Write minimal implementation**

Update the built-in render branches and CSS so each role pack has readable job cues while preserving:
- drag behavior
- panel toggle behavior
- status-driven activity classes
- custom-avatar fallback

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/DesktopPet.test.tsx`

Expected: PASS.

### Task 4: Run final focused verification

**Files:**
- Modify: `docs/plans/2026-03-11-professional-pet-panel-redesign-implementation.md`

**Step 1: Run the touched verification suite**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/pet-appearance.test.ts src/App.test.tsx src/features/settings/__tests__/agent-bindings.test.tsx src/features/widget/__tests__/DesktopPet.test.tsx`

Expected: PASS with the role-aware panel and desktop-pet redesign covered.

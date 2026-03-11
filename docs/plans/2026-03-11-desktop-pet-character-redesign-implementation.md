# Desktop Pet Character Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the generic desktop pet body with role-pack-specific character art and richer monk wooden-fish animation.

**Architecture:** Keep `DesktopPet.tsx` as the single interaction shell so dragging and panel toggling remain unchanged, but move built-in character rendering to role-pack-specific markup branches. Drive motion entirely from semantic state classes in `styles.css`, with monk-specific working/thinking/done sequences layered on top of the shared state model.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, CSS animations

---

### Task 1: Lock the redesign with tests

**Files:**
- Modify: `apps/macos-shell/src/features/widget/__tests__/DesktopPet.test.tsx`

**Step 1: Write the failing test**

Add assertions that built-in role packs render distinct anatomy selectors and that monk includes a wooden-fish rig.

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/DesktopPet.test.tsx`

Expected: FAIL because the generic renderer does not output the new role-specific elements.

### Task 2: Implement the new role-pack renderer

**Files:**
- Modify: `apps/macos-shell/src/features/widget/DesktopPet.tsx`

**Step 1: Write minimal implementation**

Add a small role-pack render helper that returns dedicated markup for `lobster`, `cat`, `robot`, and `monk`, while preserving the custom avatar path.

**Step 2: Run test to verify it passes**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/DesktopPet.test.tsx`

Expected: PASS for the new markup assertions and existing drag/panel behavior tests.

### Task 3: Redesign the visuals and monk animation

**Files:**
- Modify: `apps/macos-shell/src/styles.css`

**Step 1: Write minimal implementation**

Replace the shared-shell character styling with role-pack-specific silhouettes and add monk-specific idle/thinking/working/done animations for the wooden fish, mallet, robe, and body motion.

**Step 2: Run targeted verification**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/DesktopPet.test.tsx`

Expected: PASS with no regressions.

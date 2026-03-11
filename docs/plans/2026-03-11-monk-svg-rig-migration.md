# Monk SVG Rig Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move the monk desktop pet from absolute-positioned DOM shapes to a stable SVG rig while preserving the new layered animation-state model.

**Architecture:** Keep the root `DesktopPet` shell and animation-state mapping unchanged, but replace only the monk renderer branch with an inline SVG component that exposes stable part classes. Rework monk CSS so transforms target SVG groups instead of DOM boxes, preserving the same semantic classes for activity and interaction animation.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, SVG, CSS animations

---

### Task 1: Lock monk SVG migration with tests

**Files:**
- Modify: `apps/macos-shell/src/features/widget/__tests__/DesktopPet.test.tsx`

**Step 1: Write the failing test**

Add assertions that monk renders through an SVG rig with stable root and body-group classes.

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/DesktopPet.test.tsx`

Expected: FAIL because monk is still rendered as nested DOM spans.

### Task 2: Implement the monk SVG component

**Files:**
- Create: `apps/macos-shell/src/features/widget/MonkPetSvg.tsx`
- Modify: `apps/macos-shell/src/features/widget/DesktopPet.tsx`

**Step 1: Write minimal implementation**

Replace the monk branch with an inline SVG component that includes stable groups for the head, robe, arms, mallet, woodfish, and impact ring.

**Step 2: Run test to verify it passes**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/DesktopPet.test.tsx`

Expected: PASS.

### Task 3: Rework monk motion styles for SVG transforms

**Files:**
- Modify: `apps/macos-shell/src/styles.css`

**Step 1: Write minimal implementation**

Convert monk-specific fill/stroke/transform rules to SVG-friendly selectors while preserving layered activity and interaction animation behavior.

**Step 2: Run targeted verification**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/DesktopPet.test.tsx`

Expected: PASS.

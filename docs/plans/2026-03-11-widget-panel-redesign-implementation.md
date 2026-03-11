# Widget Panel Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rework the widget main panel into a lightweight desktop companion UI and replace image-first appearance settings with role-pack-based character selection.

**Architecture:** Keep the existing React + Zustand + Electron renderer boundaries intact. Extend the current appearance model into a role-pack model, derive the visible companion from existing habitat/settings state, and reorganize the panel into a primary control surface with a secondary settings drawer. Preserve current gateway and composer behavior while changing the presentation and character selection flow.

**Tech Stack:** React, TypeScript, Zustand, Vitest, Testing Library, CSS

---

### Task 1: Add role-pack state coverage

**Files:**
- Modify: `apps/macos-shell/src/features/widget/__tests__/pet-appearance.test.ts`
- Modify: `apps/macos-shell/src/features/settings/__tests__/settings-store.test.ts`
- Test: `apps/macos-shell/src/features/widget/__tests__/pet-appearance.test.ts`
- Test: `apps/macos-shell/src/features/settings/__tests__/settings-store.test.ts`

**Step 1: Write the failing test**

Add tests that require:
- role-pack identifiers to resolve into built-in pet variants
- settings state to persist a selected role pack per pet without requiring a custom image

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/pet-appearance.test.ts src/features/settings/__tests__/settings-store.test.ts`

Expected: FAIL because the current appearance model only supports image avatars.

**Step 3: Write minimal implementation**

Extend `PetAppearanceConfig` and the settings store to persist a `rolePack` field with a safe default fallback.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/pet-appearance.test.ts src/features/settings/__tests__/settings-store.test.ts`

Expected: PASS.

### Task 2: Make the pet renderer role-pack aware

**Files:**
- Modify: `apps/macos-shell/src/features/widget/__tests__/DesktopPet.test.tsx`
- Modify: `apps/macos-shell/src/features/widget/pet-appearance.ts`
- Modify: `apps/macos-shell/src/features/widget/DesktopPet.tsx`
- Modify: `apps/macos-shell/src/styles.css`
- Test: `apps/macos-shell/src/features/widget/__tests__/DesktopPet.test.tsx`

**Step 1: Write the failing test**

Add tests that require the pet renderer to expose a character-specific class or label when a non-default role pack is selected.

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/DesktopPet.test.tsx`

Expected: FAIL because the current renderer only knows default/custom avatar rendering.

**Step 3: Write minimal implementation**

Render built-in role packs using semantic classes and keep status-driven animation classes working on top of them.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/DesktopPet.test.tsx src/features/widget/__tests__/pet-appearance.test.ts`

Expected: PASS.

### Task 3: Simplify the panel layout and settings structure

**Files:**
- Modify: `apps/macos-shell/src/App.test.tsx`
- Modify: `apps/macos-shell/src/features/settings/__tests__/agent-bindings.test.tsx`
- Modify: `apps/macos-shell/src/features/widget/WidgetPanel.tsx`
- Modify: `apps/macos-shell/src/features/settings/AgentBindings.tsx`
- Modify: `apps/macos-shell/src/App.tsx`
- Modify: `apps/macos-shell/src/styles.css`
- Test: `apps/macos-shell/src/App.test.tsx`
- Test: `apps/macos-shell/src/features/settings/__tests__/agent-bindings.test.tsx`

**Step 1: Write the failing test**

Add tests that require:
- the main panel to show a current companion stage and quick actions
- settings content to appear under `Display`, `Characters`, and `Connection`
- per-agent rows to use role-pack selectors instead of avatar URL inputs

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/App.test.tsx src/features/settings/__tests__/agent-bindings.test.tsx`

Expected: FAIL because the current panel still exposes the older dashboard layout and avatar-url controls.

**Step 3: Write minimal implementation**

Recompose the panel around the main companion card and quick composer, add a settings drawer, and replace avatar inputs with role-pack selection controls.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/App.test.tsx src/features/settings/__tests__/agent-bindings.test.tsx`

Expected: PASS.

### Task 4: Final verification

**Files:**
- Modify: `docs/plans/2026-03-11-widget-panel-redesign-implementation.md`

**Step 1: Run the touched verification suite**

Run: `pnpm --filter @openclaw-habitat/macos-shell test -- --run src/features/widget/__tests__/pet-appearance.test.ts src/features/settings/__tests__/settings-store.test.ts src/features/widget/__tests__/DesktopPet.test.tsx src/features/settings/__tests__/agent-bindings.test.tsx src/App.test.tsx`

Expected: PASS with the redesigned panel and role-pack behavior covered.

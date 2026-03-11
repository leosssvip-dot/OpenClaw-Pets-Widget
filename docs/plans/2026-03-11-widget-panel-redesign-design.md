# OpenClaw Widget Panel Redesign Design

## Goal

Redesign the `openclaw-widget` application main panel and settings panel into a lightweight, cute-cartoon desktop-pet control surface. The primary experience should emphasize quick prompting and current agent awareness, while low-frequency configuration moves behind a simplified secondary settings layer. Character customization should be based on animated role packs, not static uploaded images.

## Product Direction

The panel should feel like a compact desktop companion, not an admin console. The first-screen experience must optimize for the user opening the widget, checking the current agent, and sending a task within a few seconds. Connection setup, display mode changes, and SSH details are still supported, but they should no longer dominate the visual hierarchy.

The visual language is intentionally cute and cartoony:

- soft rounded shapes
- warm or candy-like accent colors
- gentle floating motion
- character-forward presentation
- playful but still readable utility copy

The product goal is not merely “show an agent,” but “make each agent feel like a small digital companion with personality.”

## Information Architecture

### Layer 1: Main Panel

The main panel is a lightweight single-column floating surface with four high-priority regions:

1. Current companion stage
2. Quick prompt composer
3. Short action strip
4. Optional selected-agent result context

The current companion stage shows the active role pack in a small character scene, plus the pet or agent name, connection badge, and latest runtime state. The quick prompt composer becomes the main visual anchor. The short action strip exposes three direct actions:

- Switch agent
- Switch character
- More settings

This keeps the main path focused on everyday use instead of configuration.

### Layer 2: Settings Drawer

The settings experience moves into a secondary drawer instead of living on the main surface. The drawer is grouped into three sections in order of frequency:

1. Display
2. Characters
3. Connection

This separates using the pet from configuring the system.

## Main Panel Behavior

Opening the panel should land the user directly in an action-ready state. The top character stage reflects whichever agent is currently visible according to the display mode and pinned-agent selection. The composer sits directly below it and supports immediate task submission without requiring the user to navigate into another section.

The short action strip replaces broad settings blocks on the main screen. `Switch agent` opens a compact picker showing live agents and their statuses. `Switch character` opens a compact role-pack picker for the current agent. `More settings` opens the full drawer for lower-frequency configuration.

When no pet is connected, the panel should still keep the same lightweight structure: a compact empty state with connection status, a short explanation, and a single path into connection setup.

## Settings Drawer Structure

### Display

The display section contains only high-value controls:

- Display mode: `Single agent` or `Group`
- Pinned agent selector when relevant

Labels should be user-facing and not overly technical.

### Characters

Each bound pet appears as a compact card showing:

- current role-pack preview
- pet or agent name
- runtime status
- character selector
- short personality or motion hint

Character selection should not use static image upload. Instead, it should expose animated role packs such as:

- Lobster
- Cat
- Robot
- Monk

Each option should feel like choosing a complete “digital performer,” not merely swapping a skin.

### Connection

The connection section becomes a maintenance area instead of the default landing content. It should show:

- active gateway summary
- current connection status
- reconnect action
- edit connection action

SSH host, username, ports, and token fields should move into an explicit editing state instead of always occupying panel space.

## Character System

Character customization should be based on a role-pack model, not raw artwork. A role pack represents a full animated character identity with:

- visual style
- idle pose
- state-driven motion rules
- interaction responses
- optional sound or effect hooks later

The system should allow large differences between characters. A lobster, cat, robot, and monk are all valid role packs even if they share very little visual structure.

To keep the system scalable, the architecture should use a unified behavior protocol with per-character implementations underneath it.

### Unified Behavior Protocol

The renderer should drive characters using semantic states such as:

- `idle`
- `thinking`
- `working`
- `done`
- `blocked`
- `interacting`

The application drives these high-level states. Each role pack then decides how to express them.

Examples:

- Lobster: claw waving, shell bounce, antenna wiggle
- Cat: tail swish, ear flick, blink, paw stretch
- Robot: panel lights, head rotation, scan-line pulses
- Monk: calm breathing at idle, paused mallet while thinking, rhythmic wooden-fish tapping while working, a soft finishing gesture on done

This gives the system a common API without forcing all characters to share the same body plan.

## Interaction And Data Flow

The existing renderer/store structure is still a good fit. `settings-store` should remain the source of truth for display mode, pinned agent, and per-pet character selection. `App.tsx` should continue deriving the visible pet row from the combination of settings state and habitat state.

The redesign mainly changes presentation and the appearance model:

- replace image-first appearance customization with role-pack selection
- map semantic pet state into character-specific animation behavior
- split panel content into primary actions versus secondary settings

No bridge contract changes are required for the first pass. The redesign stays inside the React renderer and Zustand state.

## Error Handling

The redesigned panel should avoid turning errors into full-screen friction. Recommended behavior:

- connection failure remains visible in the reconnect banner
- missing agent bindings show a compact empty state in the characters area
- if a role pack fails to load, fall back to a default lobster pack
- if no active gateway exists, the connection section becomes the only expanded settings group

## Testing Strategy

Add or update tests around:

- role-pack selection persistence
- visible pet derivation from pinned-agent and display-mode settings
- main panel rendering of the current companion stage and primary action strip
- simplified settings grouping and character selection controls
- semantic pet-state mapping into character variants or animation classes
- unchanged quick prompt and pinned-agent behavior

Targeted tests in `App.test.tsx`, `agent-bindings.test.tsx`, `DesktopPet.test.tsx`, and a new role-pack appearance test should be sufficient for the first implementation pass.

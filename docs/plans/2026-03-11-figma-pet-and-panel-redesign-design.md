# Figma Pet And Panel Redesign Design

## Goal

Produce a refreshed visual direction for the OpenClaw desktop pet and settings surface inside the shared Figma file, with a stronger companion-first personality and a clearer separation between quick daily actions and low-frequency system configuration.

## Chosen Direction

- Visual tone: soft, warm, rounded, lightly candy-colored
- Character mood: playful and slightly mischievous, not sleepy or passive
- System model: mixed-character universe with a shared motion grammar
- Launch cast: four role packs
- Panel density: lightweight main panel with a secondary settings drawer

## Character System

The redesign keeps a single OpenClaw universe but allows mixed species so the product does not feel trapped inside a single mascot. The shared rules are:

- large head-to-body ratio
- rounded geometry
- low-aggression facial expressions
- sticker-like highlights
- motion verbs that stay consistent across packs: `bounce`, `blink`, `sway`, `wave`, `pulse`, `nod`

Launch role packs:

1. `Coder Claw`
   - code role
   - headset, keyboard, bug sticker
   - type, debug, blink
2. `Planner Cat`
   - planning role
   - sticky-note board, task cards, pointer paw
   - sort, plan, blink
3. `Ops Bot`
   - operations role
   - beacon light, status screen, repair arm
   - scan, alert, repair
4. `Mokugyo Monk`
   - focus role
   - raised mallet, large wooden fish, beat marks
   - tap, count, nod

## Panel Structure

### Main Panel

The main panel should feel action-ready within a few seconds. It contains:

1. current companion stage
2. quick prompt composer
3. short action strip
4. optional compact context cells for agent, mood, and last task

Primary actions remain:

- `Switch Agent`
- `Switch Character`
- `More`

### Settings Drawer

The drawer stays secondary and groups lower-frequency controls in this order:

1. `Display`
2. `Characters`
3. `Connection`

Character management is intentionally more visible than SSH editing so the interface reads as a companion tool first and an infrastructure tool second. Character cards should expose direct role labels such as `Code`, `Plan`, `Ops`, and `Focus` instead of generic skin names alone.

## Deliverables

- Local mockup source: `docs/design-mockups/2026-03-11-pet-panel-redesign.html`
- Imported Figma frame: `https://www.figma.com/design/fScJHzYBEbMmzsRrCYnb7M?node-id=4-2`

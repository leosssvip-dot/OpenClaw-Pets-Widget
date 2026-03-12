# Pet Animation Import Guide

Use third-party animation tools to create monk (or other pet) animations, then import them into the widget. This document covers supported formats, integration points, and constraints.

---

## Recommended Format: Rive (.riv)

The project already has a Rive renderer (`RivePetRenderer.tsx`) and `@rive-app/react-canvas` installed. This is the **primary recommended path**.

### Rive State Machine Requirements

Your `.riv` file must contain a state machine named **`PetStateMachine`** with:

| Input / Event | Type | Description |
|---|---|---|
| `status` | Number input | Drives animation state transitions |
| `strike` | Event (fired from timeline) | Fires when mallet hits woodfish, triggers merit particles |

#### `status` input values

| Value | Activity | Description |
|---|---|---|
| 0 | idle | Slow, relaxed tapping loop |
| 1 | thinking | Pause / contemplation pose |
| 2 | working | Fast, vigorous tapping loop |
| 3 | waiting | Same as idle (slow tap) |
| 4 | done | Celebration / completion pose |
| 5 | blocked | Same as idle (slow tap) |

### Rive Animation Notes

1. **Canvas size**: Design at **144 × 138 px** (matches current SVG `viewBox`). The widget renders at this size.
2. **Artboard name**: Can be anything; the renderer uses `stateMachines` to find the state machine.
3. **Strike event**: Add a Rive Event named `strike` on the timeline keyframe where the mallet contacts the woodfish. This drives the merit particle system. Without this event, merit particles will fall back to a fixed interval timer.
4. **Transparent background**: The artboard must have a transparent background. The widget window is transparent with no chrome.
5. **Loop behavior**: idle/working/waiting/blocked states should loop. thinking/done should play once and hold.

### How to Enable

1. Export your `.riv` file from [Rive](https://rive.app)
2. Place it at `apps/macos-shell/public/assets/pets/monk.riv`
3. Uncomment the line in `pet-engine.ts`:
   ```ts
   monk: '/assets/pets/monk.riv',
   ```
4. The `PetRenderer` will automatically use Rive when the `.riv` file is available, falling back to SVG if it fails to load.

---

## Alternative Format: Lottie (.json)

If you prefer After Effects / Lottie workflow, you'll need to add `lottie-react` or `@lottiefiles/react-lottie-player` as a dependency and create a `LottiePetRenderer` component following the same pattern as `RivePetRenderer`.

### Lottie Animation Notes

1. **Export as Lottie JSON** from After Effects (via Bodymovin plugin) or from Lottie editor.
2. **Canvas size**: 144 × 138 px.
3. **Segments**: Define named markers or frame ranges for each activity state:
   - `idle`: e.g. frames 0–60
   - `working`: e.g. frames 61–90
   - `thinking`: e.g. frames 91–120
   - `done`: e.g. frames 121–150
4. **Strike callback**: Use a Lottie `onEnterFrame` listener to detect the strike frame and fire the merit particle.
5. **File size**: Keep under 100KB. Avoid embedded images — use vector shapes only.

---

## Animation Design Constraints

These apply regardless of format:

### Monk Tapping Motion (Key Reference)

The correct woodfish tapping motion:

```
Rest position:         Strike position:

   (shoulder)            (shoulder)
      \                     |
       \ arm                | arm
        \                   |
     (hand/grip) ←pivot  (hand/grip) ←pivot
          |                  \
          | handle            \ handle
          |                    \
       [mallet head]        [mallet head]
                                 ↓
       ──────────           ──[woodfish]──
       [woodfish]
```

- **Pivot point**: The hand/grip end of the mallet (where monk holds it). This is the **fixed** point.
- **Rotation**: The mallet head swings **downward ~80–95 degrees** from rest to strike.
- **Arm movement**: The arm/shoulder moves **only slightly** (±10–15 degrees). The big motion is in the mallet, not the arm.
- **Two separate rotations**: Arm rotates subtly around shoulder; mallet rotates largely around grip. Do NOT rotate the entire arm 80 degrees.

### Timing

| Activity | Full cycle duration | Strike contact point |
|---|---|---|
| idle | ~2.1s | ~36% through cycle |
| working | ~0.72s | ~32% through cycle |

### Motion Phases (per cycle)

1. **Lift** (0–25%): Mallet rises, arm lifts slightly
2. **Anticipation** (25–32%): Brief pause at peak
3. **Strike** (32–36%): Fast downswing, mallet hits woodfish
4. **Impact** (36–40%): Bounce, woodfish squash, ripple rings
5. **Recover** (40–100%): Return to rest

### Impact Effects

On strike contact, these effects should fire:
- Woodfish **squash**: scaleY compress briefly (0.88 → 1.0)
- **Impact ring**: circle expanding outward from woodfish, fading
- **Echo ring**: second ring, slightly delayed
- Breath **halo**: subtle glow pulse behind monk
- **Merit particle**: +1 floats upward (handled by code, just fire the event)

### Color Palette

| Element | Fill | Stroke |
|---|---|---|
| Monk skin | #e8bc84 | #c79661 |
| Monk robe | #c87835 | #a65d2b |
| Mallet handle | #d6b17a | — |
| Mallet head | #b97636 | #975822 |
| Woodfish shell | #b97033 | #8a4b1f |
| Cushion | #c96d3a | #9d4f28 |
| Breath halo | #f5d59b (opacity 0.2) | — |
| Eyes | #5b432e | — |
| Cheeks | #e59c86 (opacity 0.3) | — |
| Beads | — | #8a5428 (dashed) |

### Layout Coordinates (in 144×138 viewport)

| Element | Position |
|---|---|
| Monk head center | (73, 35) |
| Monk body center | (73, 67) |
| Right shoulder | (83, 63) |
| Right hand (grip) | (80, 73) |
| Woodfish center | (89, 89) |
| Cushion center | (73, 111) |
| Mallet head (at rest) | (80, 82) |

*Note: all coordinates include the root `translate(10 8)` offset.*

---

## File Placement

```
apps/macos-shell/
├── public/
│   └── assets/
│       └── pets/
│           ├── monk.riv          ← Rive file goes here
│           └── monk.lottie.json  ← or Lottie file here
```

---

## Integration Checklist

- [ ] Animation canvas is 144 × 138 px
- [ ] Background is transparent
- [ ] State machine has `status` Number input (Rive) or frame segments (Lottie)
- [ ] Strike event fires at mallet-woodfish contact
- [ ] Mallet pivots at grip/hand, not at shoulder or midpoint
- [ ] Mallet rotation arc is 80–95 degrees
- [ ] Arm rotation is subtle (10–15 degrees max)
- [ ] idle loop is ~2.1s, working loop is ~0.72s
- [ ] All states loop except thinking and done
- [ ] Colors match the palette above (or intentionally restyle)
- [ ] File placed in `public/assets/pets/`
- [ ] `pet-engine.ts` RIVE_ASSETS updated with the path

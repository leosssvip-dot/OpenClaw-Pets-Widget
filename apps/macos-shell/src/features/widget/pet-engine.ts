/**
 * Pet Animation Engine — picks the asset protocol for built-in desktop pets.
 *
 * Built-in role packs now animate only through Rive assets. When a Rive file is
 * unavailable or fails at runtime, the UI falls back to the static SVG illustration.
 */

import type { PetAnimationActivity } from './pet-animation-state';
import type { PetRolePackId } from './pet-appearance';

// ---------------------------------------------------------------------------
// Rive state machine input mapping
// ---------------------------------------------------------------------------

/**
 * Maps PetAnimationActivity to the imported three-state Rive boolean input.
 * `true` drives the working loop, `false` keeps the pet in the idle side.
 */
export const ACTIVITY_TO_RIVE_BOOLEAN: Record<PetAnimationActivity, boolean> = {
  idle: false,
  thinking: true,
  working: true,
  waiting: false,
  done: false,
  blocked: false,
};

/**
 * Name of the Rive boolean input that toggles between idle and working loops.
 */
export const RIVE_WORKING_INPUT = 'state';

/**
 * Backward-compatible alias kept while docs and old code paths catch up.
 */
export const RIVE_STATUS_INPUT = RIVE_WORKING_INPUT;

/**
 * Name of the Rive trigger input used for click feedback.
 */
export const RIVE_CLICK_INPUT = 'click';

/**
 * Duration for Boolean/Number click pulses so the state machine has time
 * to observe the transition and play the tap animation.
 */
export const RIVE_CLICK_PULSE_MS = 900;

/**
 * Name of the Rive event fired when a "strike" happens (e.g. mallet hits woodfish).
 * The merit particle system listens for this event.
 */
export const RIVE_STRIKE_EVENT = 'strike';

/**
 * Name of the Rive state machine to use inside .riv files.
 */
export const RIVE_STATE_MACHINE = 'State Machine 1';

// ---------------------------------------------------------------------------
// Engine type detection
// ---------------------------------------------------------------------------

export type PetEngineType = 'rive' | 'svg';

/**
 * Character asset manifest — maps a role pack to its .riv file path.
 * When a .riv file is available, the Rive engine is used; otherwise SVG fallback.
 */
const RIVE_ASSETS: Partial<Record<PetRolePackId, string>> = {
  monk: '/assets/pets/monk(1).riv',
  lobster: '/assets/pets/lobster(1).riv',
  cat: '/assets/pets/cat(1).riv',
  robot: '/assets/pets/robot(1).riv',
};

export function resolveEngine(rolePack: PetRolePackId): {
  type: PetEngineType;
  riveSrc: string | null;
} {
  const riveSrc = RIVE_ASSETS[rolePack] ?? null;
  if (riveSrc) {
    return { type: 'rive', riveSrc };
  }

  return { type: 'svg', riveSrc: null };
}

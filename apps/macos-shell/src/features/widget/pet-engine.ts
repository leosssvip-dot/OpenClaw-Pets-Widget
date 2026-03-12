/**
 * Pet Animation Engine — abstraction layer for rendering animated pet characters.
 *
 * Supports two backends:
 *   1. Rive (.riv files with built-in state machines)
 *   2. Legacy SVG + CSS/GSAP (current implementation, used as fallback)
 *
 * The engine exposes a uniform interface so the DesktopPet component
 * doesn't need to know which backend is active.
 */

import type { PetAnimationActivity } from './pet-animation-state';
import type { PetRolePackId } from './pet-appearance';

// ---------------------------------------------------------------------------
// Rive state machine input mapping
// ---------------------------------------------------------------------------

/**
 * Maps PetAnimationActivity to a numeric Rive state machine input.
 * The .riv file should define a Number input called "status" that
 * accepts these values to transition between animation states.
 */
export const ACTIVITY_TO_RIVE_INPUT: Record<PetAnimationActivity, number> = {
  idle: 0,
  thinking: 1,
  working: 2,
  waiting: 3,
  done: 4,
  blocked: 5,
};

/**
 * Name of the Rive state machine input that drives pet activity transitions.
 */
export const RIVE_STATUS_INPUT = 'status';

/**
 * Name of the Rive event fired when a "strike" happens (e.g. mallet hits woodfish).
 * The merit particle system listens for this event.
 */
export const RIVE_STRIKE_EVENT = 'strike';

/**
 * Name of the Rive state machine to use inside .riv files.
 */
export const RIVE_STATE_MACHINE = 'PetStateMachine';

// ---------------------------------------------------------------------------
// Engine type detection
// ---------------------------------------------------------------------------

export type PetEngineType = 'rive' | 'svg';

/**
 * Character asset manifest — maps a role pack to its .riv file path.
 * When a .riv file is available, the Rive engine is used; otherwise SVG fallback.
 */
const RIVE_ASSETS: Partial<Record<PetRolePackId, string>> = {
  // Uncomment as .riv files become available:
  // monk: '/assets/pets/monk.riv',
  // lobster: '/assets/pets/lobster.riv',
  // cat: '/assets/pets/cat.riv',
  // robot: '/assets/pets/robot.riv',
};

export function resolveEngine(rolePack: PetRolePackId): {
  type: PetEngineType;
  riveSrc: string | null;
} {
  const src = RIVE_ASSETS[rolePack] ?? null;
  return {
    type: src ? 'rive' : 'svg',
    riveSrc: src,
  };
}

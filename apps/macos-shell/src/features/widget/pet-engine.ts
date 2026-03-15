/**
 * Pet Animation Engine — abstraction layer for rendering animated pet characters.
 *
 * Supports three backends:
 *   1. Lottie (.json files with per-state animations, free)
 *   2. Rive (.riv files with built-in state machines)
 *   3. Legacy SVG + CSS/GSAP (current implementation, used as fallback)
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
// Lottie per-state animation mapping
// ---------------------------------------------------------------------------

/**
 * Maps a PetAnimationActivity to a simplified animation state for Lottie.
 * Multiple activities can share the same Lottie file.
 */
export type LottieAnimationState = 'idle' | 'working' | 'offline';

export function activityToLottieState(activity: PetAnimationActivity): LottieAnimationState {
  switch (activity) {
    case 'working':
    case 'thinking':
      return 'working';
    case 'blocked':
      return 'offline';
    case 'idle':
    case 'waiting':
    case 'done':
    default:
      return 'idle';
  }
}

/**
 * Lottie asset manifest — maps a role pack to per-state .json files.
 * Each state has its own Lottie animation file.
 */
export interface LottieAssetSet {
  idle: string;
  working: string;
  offline: string;
}

// ---------------------------------------------------------------------------
// Engine type detection
// ---------------------------------------------------------------------------

export type PetEngineType = 'rive' | 'lottie' | 'svg-bone' | 'sprite' | 'svg';

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

/**
 * Lottie asset manifest — maps a role pack to per-state .json files.
 * Uncomment as Lottie animations become available.
 */
/**
 * Sprite (PNG) asset manifest — maps a role pack to a single image file.
 * The image is animated via whole-body GSAP transforms (float, bob, sway).
 */
/**
 * SVG Bone asset manifest — maps a role pack to a grouped SVG file.
 * The SVG must contain named <g> groups for each body part.
 */
const SVG_BONE_ASSETS: Partial<Record<PetRolePackId, string>> = {
  monk: '/assets/pets/monk-4.svg',
};

const SPRITE_ASSETS: Partial<Record<PetRolePackId, string>> = {
  monk: '/assets/pets/monk.png',
  // lobster: '/assets/pets/lobster.png',
  // cat: '/assets/pets/cat.png',
  // robot: '/assets/pets/robot.png',
};

const LOTTIE_ASSETS: Partial<Record<PetRolePackId, LottieAssetSet>> = {
  // monk: {
  //   idle: '/assets/pets/monk-idle.json',
  //   working: '/assets/pets/monk-working.json',
  //   offline: '/assets/pets/monk-offline.json',
  // },
  // lobster: {
  //   idle: '/assets/pets/lobster-idle.json',
  //   working: '/assets/pets/lobster-working.json',
  //   offline: '/assets/pets/lobster-offline.json',
  // },
  // cat: {
  //   idle: '/assets/pets/cat-idle.json',
  //   working: '/assets/pets/cat-working.json',
  //   offline: '/assets/pets/cat-offline.json',
  // },
  // robot: {
  //   idle: '/assets/pets/robot-idle.json',
  //   working: '/assets/pets/robot-working.json',
  //   offline: '/assets/pets/robot-offline.json',
  // },
};

export function resolveEngine(rolePack: PetRolePackId): {
  type: PetEngineType;
  riveSrc: string | null;
  lottieAssets: LottieAssetSet | null;
  spriteSrc: string | null;
  svgBoneSrc: string | null;
} {
  const riveSrc = RIVE_ASSETS[rolePack] ?? null;
  if (riveSrc) {
    return { type: 'rive', riveSrc, lottieAssets: null, spriteSrc: null, svgBoneSrc: null };
  }

  const lottieAssets = LOTTIE_ASSETS[rolePack] ?? null;
  if (lottieAssets) {
    return { type: 'lottie', riveSrc: null, lottieAssets, spriteSrc: null, svgBoneSrc: null };
  }

  const svgBoneSrc = SVG_BONE_ASSETS[rolePack] ?? null;
  if (svgBoneSrc) {
    return { type: 'svg-bone', riveSrc: null, lottieAssets: null, spriteSrc: null, svgBoneSrc };
  }

  const spriteSrc = SPRITE_ASSETS[rolePack] ?? null;
  if (spriteSrc) {
    return { type: 'sprite', riveSrc: null, lottieAssets: null, spriteSrc, svgBoneSrc: null };
  }

  return { type: 'svg', riveSrc: null, lottieAssets: null, spriteSrc: null, svgBoneSrc: null };
}

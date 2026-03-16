export type PetRolePackId = 'lobster' | 'cat' | 'robot' | 'monk';

export interface PetAppearanceConfig {
  rolePack?: PetRolePackId;
  avatar?: string;
}

export interface ResolvedPetAppearance {
  variant: PetRolePackId | 'custom';
  rolePack: PetRolePackId;
  avatar: string | null;
}

export const DEFAULT_PET_ROLE_PACK: PetRolePackId = 'lobster';

export const PET_ROLE_PACKS: Array<{
  id: PetRolePackId;
  label: string;
  roleLabel: string;
  tagline: string;
  promptHint: string;
  panelTitle: string;
  panelDescription: string;
  signalLabel: string;
  quickPromptExample: string;
}> = [
  {
    id: 'lobster',
    label: 'Coder Claw',
    roleLabel: 'Code',
    tagline: 'Headset on, keyboard ready, bug already spotted.',
    promptHint: 'Ask for a fix, refactor, or implementation patch.',
    panelTitle: 'Your coding pet is already at the keyboard.',
    panelDescription:
      'Every main-panel variant should read like a clear work role first. This one is here to code, patch, and fix.',
    signalLabel: 'typing bugfix',
    quickPromptExample: 'Ask to fix, refactor, or patch...'
  },
  {
    id: 'cat',
    label: 'Planner Cat',
    roleLabel: 'Plan',
    tagline: 'Sticky notes out, priorities sorted, next step in sight.',
    promptHint: 'Ask for a breakdown, plan, or task ordering.',
    panelTitle: 'Your planning pet already sorted the next three moves.',
    panelDescription:
      'This character turns fuzzy asks into clear task cards, scoped steps, and visible priority decisions.',
    signalLabel: 'task mapping',
    quickPromptExample: 'Plan tasks, set priorities...'
  },
  {
    id: 'robot',
    label: 'Ops Bot',
    roleLabel: 'Ops',
    tagline: 'Signals clean, beacon live, runtime under watch.',
    promptHint: 'Ask for a status check, reconnect, or runtime diagnosis.',
    panelTitle: 'Your ops pet is watching the runtime for you.',
    panelDescription:
      'This character exists to keep the bridge stable, surface connection health, and catch system drift early.',
    signalLabel: 'runtime watch',
    quickPromptExample: 'Check status, diagnose issues...'
  },
  {
    id: 'monk',
    label: 'Mokugyo Monk',
    roleLabel: 'Focus',
    tagline: 'Wooden fish steady, rhythm locked, execution underway.',
    promptHint: 'Ask to start, continue, or finish the next focused action.',
    panelTitle: 'Your focus pet keeps the rhythm and pushes execution forward.',
    panelDescription:
      'This character is for deep work. It narrows the next action, keeps momentum, and marks steady progress.',
    signalLabel: 'working-time tapping',
    quickPromptExample: 'Focus on the next task...'
  }
];

const SUPPORTED_IMAGE_EXTENSIONS = /\.(png|apng|jpe?g|webp|gif|svg)(?:\?.*)?$/i;

export const PET_AVATAR_FORMAT_HELP =
  'Custom art supports https://..., file:///..., or data:image/... sources in PNG, JPG, WEBP, GIF, or SVG.';

export function normalizePetRolePack(value?: string | null): PetRolePackId {
  if (value === 'cat' || value === 'robot' || value === 'monk' || value === 'lobster') {
    return value;
  }

  return DEFAULT_PET_ROLE_PACK;
}

function hasSupportedImageExtension(pathname: string) {
  return SUPPORTED_IMAGE_EXTENSIONS.test(pathname);
}

export function normalizePetAvatarSource(value?: string | null) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  try {
    if (trimmed.startsWith('data:image/')) {
      return trimmed;
    }

    if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
      const url = new URL(trimmed);
      return hasSupportedImageExtension(url.pathname) ? url.toString() : null;
    }

    if (trimmed.startsWith('file://')) {
      const url = new URL(trimmed);
      return hasSupportedImageExtension(url.pathname) ? url.toString() : null;
    }

    if (trimmed.startsWith('/')) {
      return hasSupportedImageExtension(trimmed)
        ? new URL(trimmed, 'file://').toString()
        : null;
    }
  } catch {
    return null;
  }

  return null;
}

export function resolvePetAppearance(
  input?: PetAppearanceConfig | null
): ResolvedPetAppearance {
  const rolePack = normalizePetRolePack(input?.rolePack);
  const avatar = normalizePetAvatarSource(input?.avatar);

  if (!avatar) {
    return {
      variant: rolePack,
      rolePack,
      avatar: null
    };
  }

  return {
    rolePack,
    variant: 'custom',
    avatar
  };
}

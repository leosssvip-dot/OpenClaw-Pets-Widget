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
  tagline: string;
}> = [
  {
    id: 'lobster',
    label: 'Lobster',
    tagline: 'Energetic claw-waving classic.'
  },
  {
    id: 'cat',
    label: 'Cat',
    tagline: 'Curious, nimble, and quietly clever.'
  },
  {
    id: 'robot',
    label: 'Robot',
    tagline: 'Precise, focused, and signal-driven.'
  },
  {
    id: 'monk',
    label: 'Monk',
    tagline: 'Calm focus with rhythmic motion.'
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

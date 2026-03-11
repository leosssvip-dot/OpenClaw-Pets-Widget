export interface PetAppearanceConfig {
  avatar?: string;
}

export interface ResolvedPetAppearance {
  variant: 'default' | 'custom';
  avatar: string | null;
}

const SUPPORTED_IMAGE_EXTENSIONS = /\.(png|apng|jpe?g|webp|gif|svg)(?:\?.*)?$/i;

export const PET_AVATAR_FORMAT_HELP =
  'Custom art supports https://..., file:///..., or data:image/... sources in PNG, JPG, WEBP, GIF, or SVG.';

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
  const avatar = normalizePetAvatarSource(input?.avatar);

  if (!avatar) {
    return {
      variant: 'default',
      avatar: null
    };
  }

  return {
    variant: 'custom',
    avatar
  };
}

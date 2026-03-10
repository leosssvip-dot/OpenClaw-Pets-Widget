export interface HabitatDesktopApi {
  getRuntimeInfo: () => Promise<{
    platform: string;
    surface?: 'pet' | 'panel';
  }>;
  movePetWindow: (payload: { x: number; y: number }) => Promise<void>;
  togglePanel: () => Promise<{ isOpen: boolean }>;
  snapPetWindow: () => Promise<{ side: 'left' | 'right' } | null>;
}

export function getHabitatDesktopApi() {
  return (globalThis as { habitat?: HabitatDesktopApi }).habitat;
}

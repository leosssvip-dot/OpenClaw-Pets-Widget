import type { GatewayProfile, PreparedGatewayConnection } from '@openclaw-habitat/bridge';

export interface HabitatDesktopApi {
  getRuntimeInfo: () => Promise<{
    platform: string;
    surface?: 'pet' | 'panel';
  }>;
  prepareGatewayConnection: (
    profile: GatewayProfile
  ) => Promise<PreparedGatewayConnection | null>;
  teardownGatewayConnection: () => Promise<void>;
  movePetWindow: (payload: { x: number; y: number }) => Promise<void>;
  togglePanel: () => Promise<{ isOpen: boolean }>;
  snapPetWindow: () => Promise<{ side: 'left' | 'right' } | null>;
}

export function getHabitatDesktopApi() {
  return (globalThis as { habitat?: HabitatDesktopApi }).habitat;
}

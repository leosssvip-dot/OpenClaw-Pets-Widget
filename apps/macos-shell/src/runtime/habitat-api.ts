import type { GatewayProfile, PreparedGatewayConnection } from '@openclaw-habitat/bridge';
import type { GatewaySessionAuth } from './gateway-session-auth';

export interface PrepareGatewayConnectionInput {
  profile: GatewayProfile;
  sessionAuth?: GatewaySessionAuth;
}

export interface HabitatDesktopApi {
  getRuntimeInfo: () => Promise<{
    platform: string;
    surface?: 'pet' | 'panel';
  }>;
  prepareGatewayConnection: (
    input: PrepareGatewayConnectionInput
  ) => Promise<PreparedGatewayConnection | null>;
  teardownGatewayConnection: () => Promise<void>;
  movePetWindow: (payload: { x: number; y: number }) => Promise<void>;
  persistPetWindowPosition: (payload: { x: number; y: number }) => Promise<void>;
  togglePanel: () => Promise<{ isOpen: boolean }>;
  storeSecret: (key: string, value: string) => Promise<void>;
  retrieveSecret: (key: string) => Promise<string | null>;
  deleteSecret: (key: string) => Promise<void>;
  readSettings: () => Promise<string | null>;
  writeSettings: (data: string) => Promise<void>;
}

export function getHabitatDesktopApi() {
  return (globalThis as { habitat?: HabitatDesktopApi }).habitat;
}

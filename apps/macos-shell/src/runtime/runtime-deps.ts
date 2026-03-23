import { OpenClawClient } from '@openclaw-habitat/bridge';
import type { DeviceIdentityProvider } from '@openclaw-habitat/bridge';
import { settingsStore } from '../features/settings/settings-store';
import { getHabitatDesktopApi } from './habitat-api';
import { createConnectionManager } from './connection-manager';
import { getGatewaySessionAuth } from './gateway-session-auth';

/**
 * Device identity provider that delegates Ed25519 signing to the
 * Electron main process via IPC.
 */
const deviceIdentity: DeviceIdentityProvider = {
  async sign(ctx) {
    const api = getHabitatDesktopApi();
    if (!api?.signDeviceChallenge) {
      throw new Error('signDeviceChallenge not available');
    }
    return api.signDeviceChallenge(ctx);
  }
};

const bridge = new OpenClawClient(
  (profileId) => settingsStore.getState().gatewayProfiles[profileId],
  undefined,
  async (profile) => {
    const sessionAuth = getGatewaySessionAuth(profile.id);
    return getHabitatDesktopApi()?.prepareGatewayConnection({
      profile,
      sessionAuth
    });
  },
  async () => {
    await getHabitatDesktopApi()?.teardownGatewayConnection();
  },
  {},
  deviceIdentity
);
const connectionManager = createConnectionManager(bridge);

export function getRuntimeDeps() {
  return {
    bridge,
    connectionManager
  };
}

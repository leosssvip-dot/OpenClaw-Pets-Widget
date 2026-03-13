import { OpenClawClient } from '@openclaw-habitat/bridge';
import { settingsStore } from '../features/settings/settings-store';
import { getHabitatDesktopApi } from './habitat-api';
import { createConnectionManager } from './connection-manager';
import { getGatewaySessionAuth } from './gateway-session-auth';

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
  }
);
const connectionManager = createConnectionManager(bridge);

export function getRuntimeDeps() {
  return {
    bridge,
    connectionManager
  };
}

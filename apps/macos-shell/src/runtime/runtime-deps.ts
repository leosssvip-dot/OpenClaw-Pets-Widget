import { OpenClawClient } from '@openclaw-habitat/bridge';
import { settingsStore } from '../features/settings/settings-store';
import { getHabitatDesktopApi } from './habitat-api';

const bridge = new OpenClawClient(
  (profileId) => settingsStore.getState().gatewayProfiles[profileId],
  undefined,
  async (profile) => getHabitatDesktopApi()?.prepareGatewayConnection(profile),
  async () => {
    await getHabitatDesktopApi()?.teardownGatewayConnection();
  }
);

export function getRuntimeDeps() {
  return {
    bridge
  };
}

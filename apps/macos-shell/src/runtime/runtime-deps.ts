import { OpenClawClient } from '@openclaw-habitat/bridge';
import { settingsStore } from '../features/settings/settings-store';

const bridge = new OpenClawClient(
  (profileId) => settingsStore.getState().gatewayProfiles[profileId]
);

export function getRuntimeDeps() {
  return {
    bridge
  };
}

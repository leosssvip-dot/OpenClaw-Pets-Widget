import { describe, expect, it } from 'vitest';
import { createSettingsStore } from '../settings-store';

describe('createSettingsStore', () => {
  it('persists the selected gateway profile and pet binding', () => {
    const store = createSettingsStore();

    store.getState().saveGatewayProfile({
      id: 'remote-1',
      label: 'Studio Gateway',
      transport: 'ssh',
      host: 'studio.internal',
      username: 'chenyang',
      sshPort: 22,
      remoteGatewayPort: 18789,
      gatewayToken: 'secret'
    });
    store.getState().bindPetToAgent({
      petId: 'pet-1',
      gatewayId: 'remote-1',
      agentId: 'researcher'
    });

    expect(store.getState().bindings['pet-1'].agentId).toBe('researcher');
  });

  it('promotes another profile when deleting the active gateway', () => {
    const store = createSettingsStore();

    store.getState().saveGatewayProfile({
      id: 'remote-1',
      label: 'Studio Gateway',
      transport: 'ssh',
      host: '10.0.0.52',
      username: 'chenyang',
      sshPort: 22,
      remoteGatewayPort: 18789,
      gatewayToken: 'secret'
    });
    store.getState().saveGatewayProfile({
      id: 'remote-2',
      label: 'Backup Gateway',
      transport: 'ssh',
      host: '10.0.0.53',
      username: 'chenyang',
      sshPort: 22,
      remoteGatewayPort: 18789,
      gatewayToken: 'secret'
    });

    store.getState().deleteGatewayProfile('remote-2');

    expect(store.getState().gatewayProfiles['remote-2']).toBeUndefined();
    expect(store.getState().activeProfileId).toBe('remote-1');
  });
});

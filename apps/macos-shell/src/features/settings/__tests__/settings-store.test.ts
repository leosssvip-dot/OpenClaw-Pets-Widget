import { waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createSettingsStore, settingsStore } from '../settings-store';

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

  it('persists a role-pack appearance without requiring a custom image', () => {
    const store = createSettingsStore();

    store.getState().setPetAppearance('pet-1', { rolePack: 'robot' } as never);

    expect(store.getState().appearances['pet-1']).toEqual({
      rolePack: 'robot'
    });
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

  it('rehydrates persisted appearance changes when another window updates storage', async () => {
    settingsStore.setState({
      gatewayProfiles: {},
      bindings: {},
      appearances: {},
      activeProfileId: null,
      pinnedAgentId: null,
      petWindowPlacement: null
    });

    localStorage.setItem(
      'openclaw-habitat-settings',
      JSON.stringify({
        state: {
          gatewayProfiles: {},
          bindings: {},
          appearances: {
            'pet-1': {
              rolePack: 'monk'
            }
          },
          activeProfileId: null,
          pinnedAgentId: null,
          petWindowPlacement: null
        },
        version: 0
      })
    );

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'openclaw-habitat-settings',
        newValue: localStorage.getItem('openclaw-habitat-settings'),
        storageArea: localStorage
      })
    );

    await waitFor(() => {
      expect(settingsStore.getState().appearances['pet-1']).toEqual({
        rolePack: 'monk'
      });
    });
  });
});

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
      username: 'chenyang'
    });
    store.getState().bindPetToAgent({
      petId: 'pet-1',
      gatewayId: 'remote-1',
      agentId: 'researcher'
    });

    expect(store.getState().bindings['pet-1'].agentId).toBe('researcher');
  });
});

import { describe, expect, it } from 'vitest';
import { createHabitatStore } from '../store';

describe('createHabitatStore', () => {
  it('updates a bound pet when a normalized event arrives', () => {
    const store = createHabitatStore();

    store.getState().seedPets([
      { id: 'pet-1', agentId: 'researcher', gatewayId: 'remote-1', status: 'idle' }
    ]);

    store.getState().applyEvent({
      kind: 'agent.completed',
      agentId: 'researcher',
      gatewayId: 'remote-1',
      petId: 'pet-1'
    });

    expect(store.getState().pets['pet-1'].status).toBe('done');
  });
});

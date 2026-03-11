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

  it('sets pet to blocked with bubble text on agent.error', () => {
    const store = createHabitatStore();

    store.getState().seedPets([
      { id: 'pet-1', agentId: 'researcher', gatewayId: 'remote-1', status: 'working' }
    ]);

    store.getState().applyEvent({
      kind: 'agent.error',
      agentId: 'researcher',
      gatewayId: 'remote-1',
      petId: 'pet-1',
      message: 'Task failed'
    });

    const pet = store.getState().pets['pet-1'];
    expect(pet.status).toBe('blocked');
    expect(pet.bubbleText).toBe('Task failed');
  });

  it('updates pet status on agent.status event', () => {
    const store = createHabitatStore();

    store.getState().seedPets([
      { id: 'pet-1', agentId: 'researcher', gatewayId: 'remote-1', status: 'idle' }
    ]);

    store.getState().applyEvent({
      kind: 'agent.status',
      agentId: 'researcher',
      gatewayId: 'remote-1',
      petId: 'pet-1',
      status: 'thinking'
    });

    expect(store.getState().pets['pet-1'].status).toBe('thinking');
  });

  it('preserves selected pet on seedPets if still present', () => {
    const store = createHabitatStore();

    store.getState().seedPets([
      { id: 'pet-1', agentId: 'a', gatewayId: 'g', status: 'idle' },
      { id: 'pet-2', agentId: 'b', gatewayId: 'g', status: 'idle' }
    ]);

    store.getState().selectPet('pet-2');
    expect(store.getState().selectedPetId).toBe('pet-2');

    store.getState().seedPets([
      { id: 'pet-2', agentId: 'b', gatewayId: 'g', status: 'idle' },
      { id: 'pet-3', agentId: 'c', gatewayId: 'g', status: 'idle' }
    ]);

    expect(store.getState().selectedPetId).toBe('pet-2');
  });
});

import type { HabitatEvent } from '@openclaw-habitat/bridge';
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import type { HabitatPet, HabitatState } from './types';

function applyHabitatEvent(
  pets: Record<string, HabitatPet>,
  event: HabitatEvent
): Record<string, HabitatPet> {
  if (event.kind === 'agent.completed' && event.petId) {
    const pet = pets[event.petId];

    if (!pet) {
      return pets;
    }

    return {
      ...pets,
      [event.petId]: {
        ...pet,
        status: 'done',
        bubbleText: 'Done'
      }
    };
  }

  return pets;
}

export const createHabitatStore = () =>
  createStore<HabitatState>((set) => ({
    pets: {},
    seedPets: (pets) =>
      set({
        pets: Object.fromEntries(pets.map((pet) => [pet.id, pet]))
      }),
    applyEvent: (event: HabitatEvent) =>
      set((state) => ({
        pets: applyHabitatEvent(state.pets, event)
      }))
  }));

export const habitatStore = createHabitatStore();

export function useHabitatStore<T>(selector: (state: HabitatState) => T) {
  return useStore(habitatStore, selector);
}

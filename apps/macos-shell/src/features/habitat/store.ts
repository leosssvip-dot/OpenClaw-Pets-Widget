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
        status: 'done'
      }
    };
  }

  return pets;
}

export const createHabitatStore = () =>
  createStore<HabitatState>((set) => ({
    pets: {},
    selectedPetId: null,
    seedPets: (pets) =>
      set({
        pets: Object.fromEntries(pets.map((pet) => [pet.id, pet])),
        selectedPetId: pets[0]?.id ?? null
      }),
    selectPet: (petId: string) =>
      set({
        selectedPetId: petId
      }),
    markPetAsThinking: (petId: string, content: string) =>
      set((state) => {
        const pet = state.pets[petId];

        if (!pet) {
          return state;
        }

        return {
          pets: {
            ...state.pets,
            [petId]: {
              ...pet,
              status: 'thinking',
              bubbleText: content
            }
          }
        };
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

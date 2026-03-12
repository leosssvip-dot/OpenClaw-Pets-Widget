import type { HabitatEvent } from '@openclaw-habitat/bridge';
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { reduceAgentSnapshots } from './agent-snapshots';
import type { HabitatPet, HabitatState } from './types';

function updatePet(
  pets: Record<string, HabitatPet>,
  petId: string | undefined,
  updater: (pet: HabitatPet) => Partial<HabitatPet>
): Record<string, HabitatPet> {
  if (!petId) {
    return pets;
  }

  const pet = pets[petId];

  if (!pet) {
    return pets;
  }

  return {
    ...pets,
    [petId]: { ...pet, ...updater(pet) }
  };
}

function applyHabitatEvent(
  pets: Record<string, HabitatPet>,
  event: HabitatEvent
): Record<string, HabitatPet> {
  switch (event.kind) {
    case 'agent.completed':
      return updatePet(pets, event.petId, () => ({
        status: 'done'
      }));

    case 'agent.error':
      return updatePet(pets, event.petId, () => ({
        status: 'blocked',
        bubbleText: event.message ?? 'An error occurred'
      }));

    case 'agent.status': {
      const statusMap: Record<string, HabitatPet['status']> = {
        thinking: 'thinking',
        working: 'working',
        waiting: 'waiting',
        idle: 'idle'
      };
      return updatePet(pets, event.petId, () => ({
        status: statusMap[event.status] ?? 'working'
      }));
    }

    default:
      return pets;
  }
}

export const createHabitatStore = () =>
  createStore<HabitatState>((set) => ({
    pets: {},
    agentSnapshots: {},
    selectedPetId: null,
    seedPets: (pets) =>
      set((state) => ({
        pets: Object.fromEntries(pets.map((pet) => [pet.id, pet])),
        selectedPetId: state.selectedPetId && pets.some((p) => p.id === state.selectedPetId)
          ? state.selectedPetId
          : pets[0]?.id ?? null
      })),
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
    markPetAsBlocked: (petId: string, message: string) =>
      set((state) => ({
        pets: updatePet(state.pets, petId, () => ({
          status: 'blocked',
          bubbleText: message
        }))
      })),
    applyEvent: (event: HabitatEvent) =>
      set((state) => ({
        pets: applyHabitatEvent(state.pets, event),
        agentSnapshots: reduceAgentSnapshots(state.agentSnapshots, event)
      }))
  }));

export const habitatStore = createHabitatStore();

export function useHabitatStore<T>(selector: (state: HabitatState) => T) {
  return useStore(habitatStore, selector);
}

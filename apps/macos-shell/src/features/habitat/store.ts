import type { HabitatEvent } from '@openclaw-habitat/bridge';
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { reduceAgentSnapshots } from './agent-snapshots';
import type { HabitatPet, HabitatState } from './types';
import { WORKING_EXTEND_MS } from './types';

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

function resolvePetId(pets: Record<string, HabitatPet>, event: HabitatEvent): string | undefined {
  if (event.petId && pets[event.petId]) return event.petId;
  const byAgent = Object.entries(pets).find(([, p]) => p.agentId === event.agentId);
  return byAgent?.[0];
}

function applyHabitatEvent(
  pets: Record<string, HabitatPet>,
  event: HabitatEvent
): Record<string, HabitatPet> {
  const petId = resolvePetId(pets, event);
  switch (event.kind) {
    case 'agent.completed':
      return updatePet(pets, petId, () => ({ status: 'done' }));

    case 'agent.error':
      return updatePet(pets, petId, () => ({
        status: 'blocked',
        bubbleText: event.message ?? 'An error occurred'
      }));

    case 'agent.status': {
      const statusMap: Record<string, HabitatPet['status']> = {
        thinking: 'thinking',
        working: 'working',
        waiting: 'waiting',
        idle: 'idle',
        done: 'done',
        blocked: 'blocked',
        collaborating: 'collaborating'
      };
      return updatePet(pets, petId, () => ({
        status: statusMap[event.status] ?? 'idle'
      }));
    }

    case 'chat.message':
      return updatePet(pets, petId, () => ({
        status: event.final ? 'done' : 'working',
        bubbleText: event.text
      }));

    default:
      return pets;
  }
}

export const createHabitatStore = () =>
  createStore<HabitatState>((set) => ({
    pets: {},
    agentSnapshots: {},
    localStatusByPetId: {},
    workingUntilByPetId: {},
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
        const nextLocal = { ...state.localStatusByPetId, [petId]: 'thinking' as const };
        const nextPets = pet
          ? { ...state.pets, [petId]: { ...pet, status: 'thinking' as const, bubbleText: content } }
          : state.pets;
        return { pets: nextPets, localStatusByPetId: nextLocal };
      }),
    markPetAsBlocked: (petId: string, message: string) =>
      set((state) => {
        const nextLocal = { ...state.localStatusByPetId, [petId]: 'blocked' as const };
        const nextPets = updatePet(state.pets, petId, () => ({
          status: 'blocked',
          bubbleText: message
        }));
        return { pets: nextPets, localStatusByPetId: nextLocal };
      }),
    applyEvent: (event: HabitatEvent) =>
      set((state) => {
        const nextPets = applyHabitatEvent(state.pets, event);
        const nextSnapshots = reduceAgentSnapshots(state.agentSnapshots, event);
        const nextLocal = { ...state.localStatusByPetId };
        if (event.petId && nextLocal[event.petId]) delete nextLocal[event.petId];
        const resolvedPetId = resolvePetId(state.pets, event);
        if (resolvedPetId && nextLocal[resolvedPetId]) delete nextLocal[resolvedPetId];
        const now = Date.now();
        const nextWorkingUntil = { ...state.workingUntilByPetId };
        if (event.kind === 'chat.message') {
          const extend = now + WORKING_EXTEND_MS;
          if (event.petId) nextWorkingUntil[event.petId] = extend;
          for (const [pid, pet] of Object.entries(nextPets)) {
            if (pet.agentId === event.agentId) nextWorkingUntil[pid] = extend;
          }
          return {
            pets: nextPets,
            agentSnapshots: nextSnapshots,
            localStatusByPetId: nextLocal,
            workingUntilByPetId: nextWorkingUntil
          };
        }
        return {
          pets: nextPets,
          agentSnapshots: nextSnapshots,
          localStatusByPetId: nextLocal,
          workingUntilByPetId: nextWorkingUntil
        };
      }),
    clearExpiredWorkingUntil: () =>
      set((state) => {
        const now = Date.now();
        const next = Object.fromEntries(
          Object.entries(state.workingUntilByPetId).filter(([, t]) => t > now)
        );
        if (Object.keys(next).length === Object.keys(state.workingUntilByPetId).length) return state;
        return { workingUntilByPetId: next };
      })
  }));

export const habitatStore = createHabitatStore();

export function useHabitatStore<T>(selector: (state: HabitatState) => T) {
  return useStore(habitatStore, selector);
}

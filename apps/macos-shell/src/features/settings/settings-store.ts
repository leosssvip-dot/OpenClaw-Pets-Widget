import type { GatewayProfile } from '@openclaw-habitat/bridge';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';

export interface PetAgentBinding {
  petId: string;
  gatewayId: string;
  agentId: string;
}

interface SettingsState {
  gatewayProfiles: Record<string, GatewayProfile>;
  bindings: Record<string, PetAgentBinding>;
  activeProfileId: string | null;
  saveGatewayProfile: (profile: GatewayProfile) => void;
  bindPetToAgent: (binding: PetAgentBinding) => void;
  selectGatewayProfile: (profileId: string) => void;
}

export const createSettingsStore = () =>
  createStore<SettingsState>()(
    persist(
      (set) => ({
        gatewayProfiles: {},
        bindings: {},
        activeProfileId: null,
        saveGatewayProfile: (profile) =>
          set((state) => ({
            gatewayProfiles: {
              ...state.gatewayProfiles,
              [profile.id]: profile
            },
            activeProfileId: profile.id
          })),
        bindPetToAgent: (binding) =>
          set((state) => ({
            bindings: {
              ...state.bindings,
              [binding.petId]: binding
            }
          })),
        selectGatewayProfile: (profileId) =>
          set({
            activeProfileId: profileId
          })
      }),
      {
        name: 'openclaw-habitat-settings',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          gatewayProfiles: state.gatewayProfiles,
          bindings: state.bindings,
          activeProfileId: state.activeProfileId
        })
      }
    )
  );

export const settingsStore = createSettingsStore();

export function useSettingsStore<T>(selector: (state: SettingsState) => T) {
  return useStore(settingsStore, selector);
}

import type { GatewayProfile } from '@openclaw-habitat/bridge';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import type { PetAppearanceConfig } from '../widget/pet-appearance';

const SETTINGS_STORAGE_KEY = 'openclaw-habitat-settings';

export interface PetAgentBinding {
  petId: string;
  gatewayId: string;
  agentId: string;
}

export interface PetWindowPlacement {
  x: number;
  y: number;
  displayId?: string;
}

interface SettingsState {
  gatewayProfiles: Record<string, GatewayProfile>;
  bindings: Record<string, PetAgentBinding>;
  appearances: Record<string, PetAppearanceConfig>;
  activeProfileId: string | null;
  displayMode: 'pinned' | 'group';
  pinnedAgentId: string | null;
  petWindowPlacement: PetWindowPlacement | null;
  saveGatewayProfile: (profile: GatewayProfile) => void;
  deleteGatewayProfile: (profileId: string) => void;
  bindPetToAgent: (binding: PetAgentBinding) => void;
  setPetAppearance: (petId: string, appearance: PetAppearanceConfig) => void;
  selectGatewayProfile: (profileId: string) => void;
  updateProfileToken: (profileId: string, token: string) => void;
  setDisplayMode: (mode: 'pinned' | 'group') => void;
  setPinnedAgentId: (agentId: string | null) => void;
  setPetWindowPlacement: (placement: PetWindowPlacement | null) => void;
}

function stripProfileTokens(profiles: Record<string, GatewayProfile>): Record<string, GatewayProfile> {
  const stripped: Record<string, GatewayProfile> = {};

  for (const [id, profile] of Object.entries(profiles)) {
    if (profile.transport === 'ssh') {
      stripped[id] = { ...profile, gatewayToken: '' };
    } else if (profile.transport === 'tailnet') {
      stripped[id] = { ...profile, token: '' };
    } else {
      stripped[id] = profile;
    }
  }

  return stripped;
}

export const createSettingsStore = () =>
  createStore<SettingsState>()(
    persist(
      (set) => ({
        gatewayProfiles: {},
        bindings: {},
        appearances: {},
        activeProfileId: null,
        displayMode: 'pinned',
        pinnedAgentId: null,
        petWindowPlacement: null,
        saveGatewayProfile: (profile) =>
          set((state) => ({
            gatewayProfiles: {
              ...state.gatewayProfiles,
              [profile.id]: profile
            },
            activeProfileId: profile.id
          })),
        deleteGatewayProfile: (profileId) =>
          set((state) => {
            const { [profileId]: _removedProfile, ...remainingProfiles } =
              state.gatewayProfiles;

            return {
              gatewayProfiles: remainingProfiles,
              activeProfileId:
                state.activeProfileId === profileId
                  ? Object.keys(remainingProfiles)[0] ?? null
                  : state.activeProfileId
            };
          }),
        bindPetToAgent: (binding) =>
          set((state) => ({
            bindings: {
              ...state.bindings,
              [binding.petId]: binding
            }
          })),
        setPetAppearance: (petId, appearance) =>
          set((state) => {
            const avatar = appearance.avatar?.trim();
            const rolePack = appearance.rolePack;

            if (!avatar && !rolePack) {
              const { [petId]: _removedAppearance, ...remainingAppearances } =
                state.appearances;

              return {
                appearances: remainingAppearances
              };
            }

            return {
              appearances: {
                ...state.appearances,
                [petId]: {
                  ...(rolePack ? { rolePack } : {}),
                  ...(avatar ? { avatar } : {})
                }
              }
            };
          }),
        selectGatewayProfile: (profileId) =>
          set({
            activeProfileId: profileId
          }),
        setDisplayMode: (displayMode) =>
          set({
            displayMode
          }),
        setPinnedAgentId: (pinnedAgentId) =>
          set({
            pinnedAgentId
          }),
        setPetWindowPlacement: (placement) =>
          set({
            petWindowPlacement: placement
          }),
        updateProfileToken: (profileId, token) =>
          set((state) => {
            const profile = state.gatewayProfiles[profileId];

            if (!profile) {
              return state;
            }

            if (profile.transport === 'ssh') {
              return {
                gatewayProfiles: {
                  ...state.gatewayProfiles,
                  [profileId]: { ...profile, gatewayToken: token }
                }
              };
            }

            if (profile.transport === 'tailnet') {
              return {
                gatewayProfiles: {
                  ...state.gatewayProfiles,
                  [profileId]: { ...profile, token }
                }
              };
            }

            return state;
          })
      }),
      {
        name: SETTINGS_STORAGE_KEY,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          gatewayProfiles: stripProfileTokens(state.gatewayProfiles),
          bindings: state.bindings,
          appearances: state.appearances,
          activeProfileId: state.activeProfileId,
          displayMode: state.displayMode,
          pinnedAgentId: state.pinnedAgentId,
          petWindowPlacement: state.petWindowPlacement
        })
      }
    )
  );

export const settingsStore = createSettingsStore();

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.storageArea !== window.localStorage || event.key !== SETTINGS_STORAGE_KEY) {
      return;
    }

    void (
      settingsStore as typeof settingsStore & {
        persist?: {
          rehydrate: () => Promise<void> | void;
        };
      }
    ).persist?.rehydrate();
  });
}

export function useSettingsStore<T>(selector: (state: SettingsState) => T) {
  return useStore(settingsStore, selector);
}

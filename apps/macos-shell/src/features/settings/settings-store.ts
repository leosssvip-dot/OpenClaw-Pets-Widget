import type { GatewayProfile } from '@openclaw-habitat/bridge';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import type { PetAppearanceConfig } from '../widget/pet-appearance';
import { getHabitatDesktopApi } from '../../runtime/habitat-api';

/**
 * 创建一个基于 Electron IPC 的持久化存储适配器。
 * 如果在非 Electron 环境（如单元测试）中，回退为 localStorage。
 */
function createElectronStorage(): ReturnType<typeof createJSONStorage> {
  const api = getHabitatDesktopApi();

  // 在测试环境或无 Electron API 时，回退为 localStorage
  if (!api?.readSettings) {
    return createJSONStorage(() => localStorage);
  }

  // 内存快照，减少异步读取延迟
  let cache: string | null = null;

  return {
    getItem: (name: string) => {
      // Zustand persist 在初始化时会同步调用 getItem。
      // 先返回内存缓存（由 preloadSettings 预填充）
      if (cache !== null) {
        try {
          const parsed = JSON.parse(cache);
          return parsed?.state ?? null;
        } catch {
          return null;
        }
      }
      // 否则 fallback 从 localStorage
      const raw = localStorage.getItem(name);
      return raw ? JSON.parse(raw)?.state ?? null : null;
    },
    setItem: (name: string, value: unknown) => {
      const payload = JSON.stringify({ state: value });
      // 写入内存快照
      cache = payload;
      // 写入 localStorage 作为即时备份
      localStorage.setItem(name, payload);
      // 异步写入磁盘文件
      void api.writeSettings(payload);
    },
    removeItem: (name: string) => {
      cache = null;
      localStorage.removeItem(name);
      void api.writeSettings('');
    }
  };
}

/**
 * 在 App 启动时，主动从磁盘读取设置并注入 store。
 * 应在 App.tsx useEffect 中调用。
 */
export async function preloadSettingsFromDisk() {
  const api = getHabitatDesktopApi();
  if (!api?.readSettings) return;

  const raw = await api.readSettings();
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    const state = parsed?.state;
    if (!state) return;

    // 直接将磁盘数据写入 localStorage，然后让 zustand persist rehydrate
    localStorage.setItem(SETTINGS_STORAGE_KEY, raw);

    // 触发 rehydrate
    const store = settingsStore as typeof settingsStore & {
      persist?: { rehydrate: () => Promise<void> | void };
    };
    await store.persist?.rehydrate();
  } catch {
    // 磁盘文件损坏，无视即可
  }
}

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
  pinnedAgentId: string | null;
  petWindowPlacement: PetWindowPlacement | null;
  saveGatewayProfile: (profile: GatewayProfile) => void;
  deleteGatewayProfile: (profileId: string) => void;
  bindPetToAgent: (binding: PetAgentBinding) => void;
  setPetAppearance: (petId: string, appearance: PetAppearanceConfig) => void;
  selectGatewayProfile: (profileId: string) => void;
  updateProfileToken: (profileId: string, token: string) => void;
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
    } else if (profile.transport === 'local') {
      stripped[id] = { ...profile, gatewayToken: undefined };
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

            if (profile.transport === 'local') {
              return {
                gatewayProfiles: {
                  ...state.gatewayProfiles,
                  [profileId]: { ...profile, gatewayToken: token }
                }
              };
            }

            return state;
          })
      }),
      {
        name: SETTINGS_STORAGE_KEY,
        storage: createElectronStorage(),
        partialize: (state) => ({
          gatewayProfiles: stripProfileTokens(state.gatewayProfiles),
          bindings: state.bindings,
          appearances: state.appearances,
          activeProfileId: state.activeProfileId,
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

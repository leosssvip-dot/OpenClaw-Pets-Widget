import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { AgentBindingSeed } from '@openclaw-habitat/bridge';
import { type ConnectionStatus } from './features/connection/ConnectionBadge';
import { chatStore } from './features/chat/store';
import { habitatStore, useHabitatStore } from './features/habitat/store';
import { getRuntimeDeps } from './runtime/runtime-deps';
import { getHabitatDesktopApi } from './runtime/habitat-api';
import type { ConnectionInput } from './features/settings/SshConnectionForm';
import { preloadSettingsFromDisk, settingsStore, useSettingsStore } from './features/settings/settings-store';
import {
  clearGatewaySessionAuth,
  setGatewaySessionAuth
} from './runtime/gateway-session-auth';
import { DesktopPet } from './features/widget/DesktopPet';
import type { PetSlot } from './features/widget/MultiPetShell';
import type { PetAppearanceConfig } from './features/widget/pet-appearance';
import { PetWindowSizeProvider } from './features/widget/PetWindowSizeContext';
import { WidgetPanel } from './features/widget/WidgetPanel';
import { createHabitatSubscriber } from './runtime/habitat-sync';

interface UiStateSnapshot {
  selectedPetId: string | null;
  pinnedAgentId: string | null;
  appearances: Record<string, PetAppearanceConfig>;
}

function serializeUiStateSnapshot(snapshot: UiStateSnapshot) {
  return JSON.stringify({
    selectedPetId: snapshot.selectedPetId,
    pinnedAgentId: snapshot.pinnedAgentId,
    appearances: Object.fromEntries(
      Object.entries(snapshot.appearances)
        .sort(([leftPetId], [rightPetId]) => leftPetId.localeCompare(rightPetId))
        .map(([petId, appearance]) => [
          petId,
          {
            ...(appearance.avatar ? { avatar: appearance.avatar } : {}),
            ...(appearance.rolePack ? { rolePack: appearance.rolePack } : {}),
          },
        ]),
    ),
  });
}

function isSameUiStateSnapshot(left: UiStateSnapshot | null, right: UiStateSnapshot) {
  if (!left) {
    return false;
  }

  return serializeUiStateSnapshot(left) === serializeUiStateSnapshot(right);
}

function toHabitatPets(agents: AgentBindingSeed[]) {
  return agents.map((agent) => ({
    id: agent.id,
    agentId: agent.agentId,
    gatewayId: agent.gatewayId,
    status: agent.status ?? 'idle',
    name: agent.label
  }));
}

function toGatewayProfile(input: ConnectionInput, profileId?: string) {
  const id = profileId ?? `gateway-${Date.now()}`;

  if (input.transport === 'local') {
    return {
      id,
      label: `localhost:${input.gatewayPort}`,
      transport: 'local' as const,
      gatewayPort: input.gatewayPort,
      gatewayToken: input.gatewayToken
    };
  }

  return {
    id,
    label: input.host,
    transport: 'ssh' as const,
    host: input.host,
    username: input.username,
    sshPort: input.sshPort,
    remoteGatewayPort: input.remoteGatewayPort,
    gatewayToken: input.gatewayToken
  };
}

function tokenSecretKey(profileId: string) {
  return `gateway-token:${profileId}`;
}

function passwordSecretKey(profileId: string) {
  return `gateway-password:${profileId}`;
}

async function storeProfileToken(profileId: string, token: string) {
  const api = getHabitatDesktopApi();

  if (api?.storeSecret) {
    await api.storeSecret(tokenSecretKey(profileId), token);
  }
}

async function storeProfilePassword(profileId: string, password?: string) {
  const api = getHabitatDesktopApi();

  if (!password) {
    return;
  }

  if (api?.storeSecret) {
    await api.storeSecret(passwordSecretKey(profileId), password);
  }
}

async function deleteProfileToken(profileId: string) {
  const api = getHabitatDesktopApi();

  if (api?.deleteSecret) {
    await api.deleteSecret(tokenSecretKey(profileId));
  }
}

async function deleteProfilePassword(profileId: string) {
  const api = getHabitatDesktopApi();

  if (api?.deleteSecret) {
    await api.deleteSecret(passwordSecretKey(profileId));
  }
}

export async function hydrateProfileSecrets() {
  const api = getHabitatDesktopApi();

  if (!api?.retrieveSecret) {
    return;
  }

  const profiles = settingsStore.getState().gatewayProfiles;

  for (const profile of Object.values(profiles)) {
    const token = await api.retrieveSecret(tokenSecretKey(profile.id));
    const password = await api.retrieveSecret(passwordSecretKey(profile.id));

    if (token) {
      settingsStore.getState().updateProfileToken(profile.id, token);
    }

    if (password) {
      setGatewaySessionAuth(profile.id, {
        password
      });
    }
  }
}

export async function hydrateAndReconnectActiveProfile(
  surface: 'pet' | 'panel',
  alreadyAttempted: boolean,
  hydrateTokens: () => Promise<void>,
  markReconnectAttempted: () => void,
  getActiveProfileId: () => string | null,
  getFirstProfileId: () => string | null,
  selectProfile: (profileId: string) => void,
  reconnectProfile: (profileId: string) => Promise<void>
) {
  if (surface !== 'panel' || alreadyAttempted) {
    return;
  }

  markReconnectAttempted();
  await hydrateTokens();
  let profileId = getActiveProfileId();

  // 没有 activeProfileId 但有已保存的 profile，选中第一个
  if (!profileId) {
    profileId = getFirstProfileId();
    if (profileId) {
      selectProfile(profileId);
    }
  }

  if (profileId) {
    await reconnectProfile(profileId);
  }
}

export function App() {
  const connectionManagerRef = useRef(getRuntimeDeps().connectionManager);
  const connectionManager = connectionManagerRef.current;
  const [surface, setSurface] = useState<'pet' | 'panel'>(() => {
    return new URLSearchParams(window.location.search).get('surface') === 'pet'
      ? 'pet'
      : 'panel';
  });
  const [syncedUiState, setSyncedUiState] = useState<UiStateSnapshot | null>(null);
  const [menuExtraHeight, setMenuExtraHeight] = useState<number | null>(0);
  const [, setWorkingDisplayTick] = useState(0);
  const reconnectAttemptedRef = useRef(false);
  const lastPublishedUiStateRef = useRef<string | null>(null);
  const connectionSnapshot = useSyncExternalStore(
    (listener) => connectionManager.subscribe(listener),
    () => connectionManager.getSnapshot()
  );
  const connectionStatus: ConnectionStatus = connectionSnapshot.status;
  const connectionError = connectionSnapshot.errorMessage;
  const petsById = useHabitatStore((state) => state.pets);
  const agentSnapshotsById = useHabitatStore((state) => state.agentSnapshots);
  const localStatusByPetId = useHabitatStore((state) => state.localStatusByPetId);
  const workingUntilByPetId = useHabitatStore((state) => state.workingUntilByPetId);
  // lastChatMessageAt removed: per-pet workingUntilByPetId handles working extension correctly
  const clearExpiredWorkingUntil = useHabitatStore((state) => state.clearExpiredWorkingUntil);
  const selectedPetId = useHabitatStore((state) => state.selectedPetId);
  const gatewayProfilesById = useSettingsStore((state) => state.gatewayProfiles);
  const activeProfileId = useSettingsStore((state) => state.activeProfileId);
  const pinnedAgentId = useSettingsStore((state) => state.pinnedAgentId);
  const bindingsByPetId = useSettingsStore((state) => state.bindings);
  const appearancesByPetId = useSettingsStore((state) => state.appearances);
  const effectiveSelectedPetId =
    surface === 'pet' ? syncedUiState?.selectedPetId ?? selectedPetId : selectedPetId;
  const effectivePinnedAgentId =
    surface === 'pet' ? syncedUiState?.pinnedAgentId ?? pinnedAgentId : pinnedAgentId;
  const effectiveAppearancesByPetId =
    surface === 'pet' ? syncedUiState?.appearances ?? appearancesByPetId : appearancesByPetId;
  const gatewayProfiles = Object.values(gatewayProfilesById);
  const now = Date.now();
  const agentRows = [
    ...Object.values(petsById).map((pet) => {
      const base = localStatusByPetId[pet.id] ?? pet.status;
      const status: PetSlot['status'] = workingUntilByPetId[pet.id] > now ? 'working' : base;
      return {
        petId: pet.id,
        petName: pet.name,
        agentId: bindingsByPetId[pet.id]?.agentId ?? pet.agentId,
        gatewayId: bindingsByPetId[pet.id]?.gatewayId ?? pet.gatewayId,
        status,
        isSelected: effectiveSelectedPetId === pet.id,
        appearance: effectiveAppearancesByPetId[pet.id]
      };
    }),
    ...Object.values(bindingsByPetId)
      .filter((binding) => !petsById[binding.petId])
      .map((binding) => {
        const base =
          localStatusByPetId[binding.petId] ??
          agentSnapshotsById[binding.agentId]?.runtimeStatus ??
          'disconnected';
        const status: PetSlot['status'] = workingUntilByPetId[binding.petId] > now ? 'working' : (base as PetSlot['status']);
        return {
          petId: binding.petId,
          petName: undefined,
          agentId: binding.agentId,
          gatewayId: binding.gatewayId,
          status,
          isSelected: false,
          appearance: effectiveAppearancesByPetId[binding.petId]
        };
      })
  ];
  const visiblePetRow =
    (effectivePinnedAgentId
      ? agentRows.find((row) => row.agentId === effectivePinnedAgentId)
      : null) ??
    (effectiveSelectedPetId ? agentRows.find((row) => row.petId === effectiveSelectedPetId) : null) ??
    agentRows[0] ??
    null;
  const petDisplayName =
    visiblePetRow?.petName ??
    visiblePetRow?.agentId ??
    'OpenClaw';
  const petDisplayStatus = visiblePetRow?.status ?? 'idle';
  const selectedPetAppearance: PetAppearanceConfig | undefined =
    visiblePetRow?.appearance;
  const currentCompanionPet = visiblePetRow ? petsById[visiblePetRow.petId] ?? null : null;

  useEffect(() => {
    document.body.dataset.surface = surface;

    return () => {
      delete document.body.dataset.surface;
    };
  }, [surface]);

  useEffect(() => {
    const deadlines = Object.values(workingUntilByPetId).filter((t) => t > Date.now());
    if (deadlines.length === 0) return;
    const next = Math.min(...deadlines);
    const delay = Math.max(0, next - Date.now() + 50);
    const t = window.setTimeout(() => clearExpiredWorkingUntil(), delay);
    return () => window.clearTimeout(t);
  }, [workingUntilByPetId, clearExpiredWorkingUntil]);

  // Resolve surface from IPC (one-time)
  useEffect(() => {
    const api = getHabitatDesktopApi();
    let isActive = true;
    void api
      ?.getRuntimeInfo()
      .then((info) => {
        if (isActive && info.surface) {
          setSurface(info.surface);
        }
      });
    return () => { isActive = false; };
  }, []);

  // Auto-reconnect on panel mount (runs once)
  useEffect(() => {
    // Only the panel window manages connections; URL param is authoritative
    const urlSurface = new URLSearchParams(window.location.search).get('surface');
    if (urlSurface === 'pet') return;
    if (reconnectAttemptedRef.current) return;
    reconnectAttemptedRef.current = true;

    void (async () => {
      try {
        await preloadSettingsFromDisk();
        await hydrateProfileSecrets();

        let profileId = settingsStore.getState().activeProfileId;

        if (!profileId) {
          const profiles = Object.keys(settingsStore.getState().gatewayProfiles);
          profileId = profiles.length > 0 ? profiles[0] : null;
          if (profileId) {
            settingsStore.getState().selectGatewayProfile(profileId);
          }
        }

        if (profileId) {
          console.log('[bridge] auto-reconnect: connecting to', profileId);
          await connectionManager.connect(profileId);
        }
      } catch (err) {
        console.error('[bridge] auto-reconnect failed:', err);
      }
    })();
    // No cleanup — the connection should persist across re-renders
  }, [connectionManager]);

  // Pet window: receive state updates from the panel window via IPC
  useEffect(() => {
    console.log('[bridge] App subscriber effect: surface=', surface);
    if (surface !== 'pet') return;

    const subscriber = createHabitatSubscriber({
      onSeedPets: (pets) => {
        console.log('[bridge] pet window seedPets count=', pets.length);
        habitatStore.getState().seedPets(pets);
      },
      onEvent: (event) => {
        console.log('[bridge] pet window event:', event.kind, 'petId=', event.petId);
        habitatStore.getState().applyEvent(event);
      },
      onUiState: (state) => {
        const nextUiState = {
          selectedPetId: state.selectedPetId,
          pinnedAgentId: state.pinnedAgentId,
          appearances: state.appearances,
        };

        setSyncedUiState((currentState) => {
          if (isSameUiStateSnapshot(currentState, nextUiState)) {
            return currentState;
          }

          return {
            selectedPetId: nextUiState.selectedPetId,
            pinnedAgentId: nextUiState.pinnedAgentId,
            appearances: nextUiState.appearances,
          };
        });
      }
    });

    return () => subscriber.dispose();
  }, [surface]);

  useEffect(() => {
    if (surface !== 'pet') {
      setSyncedUiState(null);
    }
  }, [surface]);

  useEffect(() => {
    if (surface === 'pet') return;
    const nextUiState = {
      type: 'uiState',
      selectedPetId,
      pinnedAgentId,
      appearances: appearancesByPetId,
    } as const;
    const nextUiStateKey = serializeUiStateSnapshot(nextUiState);

    if (lastPublishedUiStateRef.current === nextUiStateKey) {
      return;
    }

    lastPublishedUiStateRef.current = nextUiStateKey;
    getHabitatDesktopApi()?.sendHabitatSync?.(nextUiState);
  }, [surface, selectedPetId, pinnedAgentId, appearancesByPetId]);

  const handlePetSendMessage = async (
    petId: string,
    agentId: string,
    text: string,
    images?: Array<{ url: string; alt?: string }>,
  ) => {
    habitatStore.getState().markPetAsThinking(petId, text);
    try {
      await connectionManager.sendMessage({ petId, agentId, content: text, images });
    } catch (error) {
      chatStore.getState().setTyping(false);
      habitatStore.getState().markPetAsBlocked(
        petId,
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  const handlePetCreateTask = async (petId: string, agentId: string, prompt: string) => {
    habitatStore.getState().markPetAsThinking(petId, prompt);
    try {
      await connectionManager.createTask({ petId, agentId, prompt });
    } catch (error) {
      habitatStore.getState().markPetAsBlocked(
        petId,
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  // 桌宠窗口根据内容自适应：右键菜单打开时的额外高度 + 内容边距
  const contentPadding = 12;
  useEffect(() => {
    if (surface !== 'pet') return;
    const api = getHabitatDesktopApi();
    if (!api?.setPetWindowSize) return;
    const singleW = 196;
    const singleH = 220;
    
    const width = singleW + contentPadding;
    const height = singleH + (menuExtraHeight || 0) + contentPadding;
    void api.setPetWindowSize({ width, height });
  }, [surface, menuExtraHeight]);

  if (surface === 'pet') {
    const petWindowSizeValue = { setMenuExtraHeight };
    
    return (
      <PetWindowSizeProvider value={petWindowSizeValue}>
        <DesktopPet
        petName={petDisplayName}
        petId={visiblePetRow?.petId}
        connectionStatus={surface === 'pet' && Object.keys(petsById).length > 0 ? 'connected' : connectionStatus}
        appearance={selectedPetAppearance}
        petStatus={petDisplayStatus}
        onSendMessage={(text) => {
          if (visiblePetRow) {
            void handlePetSendMessage(visiblePetRow.petId, visiblePetRow.agentId, text);
          }
        }}
        onCreateTask={(prompt) => {
          if (visiblePetRow) {
            void handlePetCreateTask(visiblePetRow.petId, visiblePetRow.agentId, prompt);
          }
        }}
        onSwitchCharacter={(rolePackId) => {
          if (visiblePetRow) {
            settingsStore.getState().setPetAppearance(visiblePetRow.petId, { rolePack: rolePackId as import('./features/widget/pet-appearance').PetRolePackId });
          }
        }}
      />
      </PetWindowSizeProvider>
    );
  }

  return (
    <WidgetPanel
      connectionStatus={connectionStatus}
      connectionError={connectionError}
      activeProfileId={activeProfileId}
      pinnedAgentId={pinnedAgentId}
      gatewayProfiles={gatewayProfiles}
      agentRows={agentRows}
      currentCompanion={visiblePetRow}
      currentCompanionPet={currentCompanionPet}
      onReconnect={() => {
        if (activeProfileId) {
          void connectionManager.reconnect();
        }
      }}
      onSaveProfile={async (input, profileId) => {
        const profile = toGatewayProfile(input, profileId);
        settingsStore.getState().saveGatewayProfile(profile);
        settingsStore.getState().selectGatewayProfile(profile.id);

        if (input.transport === 'ssh') {
          if (input.password !== undefined || !profileId) {
            setGatewaySessionAuth(profile.id, {
              password: input.password
            });
          }
          await storeProfileToken(profile.id, input.gatewayToken);
          await storeProfilePassword(profile.id, input.password);
        } else if (input.transport === 'local') {
          if (input.gatewayToken) {
            await storeProfileToken(profile.id, input.gatewayToken);
          }
        }

        await connectionManager.connect(profile.id);
      }}
      onConnectProfile={(profileId) => {
        settingsStore.getState().selectGatewayProfile(profileId);
        void connectionManager.connect(profileId);
      }}
      onDeleteProfile={(profileId) => {
        clearGatewaySessionAuth(profileId);
        settingsStore.getState().deleteGatewayProfile(profileId);
        void deleteProfileToken(profileId);
        void deleteProfilePassword(profileId);
      }}
      onPinnedAgentChange={(agentId) => {
        settingsStore.getState().setPinnedAgentId(agentId);
      }}
      onSelectPet={(petId) => {
        habitatStore.getState().selectPet(petId);
      }}
      onUpdateAppearance={(petId, appearance) => {
        settingsStore.getState().setPetAppearance(petId, appearance);
      }}
      onSubmitQuickPrompt={async (value, images) => {
        if (visiblePetRow) {
          await handlePetSendMessage(
            visiblePetRow.petId,
            visiblePetRow.agentId,
            value,
            images,
          );
        }
      }}
    />
  );
}

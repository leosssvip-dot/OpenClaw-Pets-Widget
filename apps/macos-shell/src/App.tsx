import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { AgentBindingSeed } from '@openclaw-habitat/bridge';
import { type ConnectionStatus } from './features/connection/ConnectionBadge';
import { habitatStore, useHabitatStore } from './features/habitat/store';
import { getRuntimeDeps } from './runtime/runtime-deps';
import { getHabitatDesktopApi } from './runtime/habitat-api';
import type { SshConnectionInput } from './features/settings/SshConnectionForm';
import { preloadSettingsFromDisk, settingsStore, useSettingsStore } from './features/settings/settings-store';
import {
  clearGatewaySessionAuth,
  setGatewaySessionAuth
} from './runtime/gateway-session-auth';
import { DesktopPet } from './features/widget/DesktopPet';
import type { PetAppearanceConfig } from './features/widget/pet-appearance';
import { PetWindowSizeProvider } from './features/widget/PetWindowSizeContext';
import { WidgetPanel } from './features/widget/WidgetPanel';

function toHabitatPets(agents: AgentBindingSeed[]) {
  return agents.map((agent) => ({
    id: agent.id,
    agentId: agent.agentId,
    gatewayId: agent.gatewayId,
    status: agent.status ?? 'idle',
    name: agent.label
  }));
}

function toGatewayProfile(input: SshConnectionInput, profileId?: string) {
  return {
    id: profileId ?? `gateway-${Date.now()}`,
    label: input.host,
    transport: 'ssh' as const,
    host: input.host,
    username: input.username,
    sshPort: input.sshPort,
    identityFile: input.identityFile,
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
  reconnectProfile: (profileId: string) => Promise<void>
) {
  if (surface !== 'panel' || alreadyAttempted) {
    return;
  }

  markReconnectAttempted();
  await hydrateTokens();
  const profileId = getActiveProfileId();

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
  const [menuExtraHeight, setMenuExtraHeight] = useState<number | null>(0);
  const reconnectAttemptedRef = useRef(false);
  const connectionSnapshot = useSyncExternalStore(
    (listener) => connectionManager.subscribe(listener),
    () => connectionManager.getSnapshot()
  );
  const connectionStatus: ConnectionStatus = connectionSnapshot.status;
  const connectionError = connectionSnapshot.errorMessage;
  const petsById = useHabitatStore((state) => state.pets);
  const agentSnapshotsById = useHabitatStore((state) => state.agentSnapshots);
  const selectedPetId = useHabitatStore((state) => state.selectedPetId);
  const gatewayProfilesById = useSettingsStore((state) => state.gatewayProfiles);
  const activeProfileId = useSettingsStore((state) => state.activeProfileId);
  const pinnedAgentId = useSettingsStore((state) => state.pinnedAgentId);
  const bindingsByPetId = useSettingsStore((state) => state.bindings);
  const appearancesByPetId = useSettingsStore((state) => state.appearances);
  const gatewayProfiles = Object.values(gatewayProfilesById);
  const agentRows = [
    ...Object.values(petsById).map((pet) => ({
      petId: pet.id,
      petName: pet.name,
      agentId: bindingsByPetId[pet.id]?.agentId ?? pet.agentId,
      gatewayId: bindingsByPetId[pet.id]?.gatewayId ?? pet.gatewayId,
      status: pet.status,
      isSelected: selectedPetId === pet.id,
      appearance: appearancesByPetId[pet.id]
    })),
    ...Object.values(bindingsByPetId)
      .filter((binding) => !petsById[binding.petId])
      .map((binding) => ({
        petId: binding.petId,
        petName: undefined,
        agentId: binding.agentId,
        gatewayId: binding.gatewayId,
        status: agentSnapshotsById[binding.agentId]?.runtimeStatus ?? 'disconnected',
        isSelected: false,
        appearance: appearancesByPetId[binding.petId]
      }))
  ];
  const visiblePetRow =
    (pinnedAgentId
      ? agentRows.find((row) => row.agentId === pinnedAgentId)
      : null) ??
    (selectedPetId ? agentRows.find((row) => row.petId === selectedPetId) : null) ??
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
    const api = getHabitatDesktopApi();
    let isActive = true;

    void api
      ?.getRuntimeInfo()
      .then((info) => {
        if (isActive && info.surface) {
          setSurface(info.surface);
        }
      });

    void hydrateAndReconnectActiveProfile(
      surface,
      reconnectAttemptedRef.current,
      async () => {
        // 先从磁盘恢复设置（含 gateway profiles），再恢复 tokens
        await preloadSettingsFromDisk();
        await hydrateProfileSecrets();
      },
      () => {
        reconnectAttemptedRef.current = true;
      },
      () => (isActive ? settingsStore.getState().activeProfileId : null),
      async (profileId) => {
        if (isActive) {
          await connectionManager.connect(profileId);
        }
      }
    );

    return () => {
      isActive = false;
      void connectionManager.disconnect();
    };
  }, [connectionManager, surface]);

  const handlePetSendMessage = async (petId: string, agentId: string, text: string) => {
    habitatStore.getState().markPetAsThinking(petId, text);
    try {
      await connectionManager.sendMessage({ petId, agentId, content: text });
    } catch (error) {
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
        connectionStatus={connectionStatus}
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
        if (input.password !== undefined || !profileId) {
          setGatewaySessionAuth(profile.id, {
            password: input.password
          });
        }
        settingsStore.getState().saveGatewayProfile(profile);
        settingsStore.getState().selectGatewayProfile(profile.id);
        await storeProfileToken(profile.id, profile.gatewayToken);
        await storeProfilePassword(profile.id, input.password);
        await connectionManager.connect(profile.id);
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
      onSubmitQuickPrompt={async (value) => {
        if (visiblePetRow) {
          await handlePetSendMessage(
            visiblePetRow.petId,
            visiblePetRow.agentId,
            value
          );
        }
      }}
    />
  );
}

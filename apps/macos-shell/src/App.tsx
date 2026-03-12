import { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { AgentBindingSeed, HabitatEvent } from '@openclaw-habitat/bridge';
import { useQuickComposer } from './features/composer/useQuickComposer';
import { type ConnectionStatus } from './features/connection/ConnectionBadge';
import { habitatStore, useHabitatStore } from './features/habitat/store';
import { getRuntimeDeps } from './runtime/runtime-deps';
import { getHabitatDesktopApi } from './runtime/habitat-api';
import type { SshConnectionInput } from './features/settings/SshConnectionForm';
import { settingsStore, useSettingsStore } from './features/settings/settings-store';
import {
  clearGatewaySessionAuth,
  setGatewaySessionAuth
} from './runtime/gateway-session-auth';
import { DesktopPet } from './features/widget/DesktopPet';
import { MultiPetShell, type PetSlot } from './features/widget/MultiPetShell';
import type { PetAppearanceConfig } from './features/widget/pet-appearance';
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
  const [surface, setSurface] = useState<'pet' | 'panel'>(() => {
    return new URLSearchParams(window.location.search).get('surface') === 'pet'
      ? 'pet'
      : 'panel';
  });
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('offline');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const bridgeUnsubscribeRef = useRef<(() => void) | null>(null);
  const reconnectAttemptedRef = useRef(false);
  const petsById = useHabitatStore((state) => state.pets);
  const agentSnapshotsById = useHabitatStore((state) => state.agentSnapshots);
  const selectedPetId = useHabitatStore((state) => state.selectedPetId);
  const gatewayProfilesById = useSettingsStore((state) => state.gatewayProfiles);
  const activeProfileId = useSettingsStore((state) => state.activeProfileId);
  const displayMode = useSettingsStore((state) => state.displayMode);
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
    (displayMode === 'pinned' && pinnedAgentId
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
  const submitQuickPrompt = useQuickComposer(visiblePetRow?.petId ?? '');
  const applyBridgeEvent = useEffectEvent((event: HabitatEvent) => {
    habitatStore.getState().applyEvent(event);
  });
  const connectToProfile = useEffectEvent(async (profileId: string) => {
    const bridge = getRuntimeDeps().bridge;

    setConnectionStatus((status) =>
      status === 'connected' ? 'reconnecting' : 'connecting'
    );
    setConnectionError(null);

    try {
      bridgeUnsubscribeRef.current?.();
      bridgeUnsubscribeRef.current = null;
      await bridge.disconnect();
      await bridge.connect(profileId);
      bridgeUnsubscribeRef.current = bridge.subscribe((event) => {
        applyBridgeEvent(event);
      });

      const agents = await bridge.listAgents();
      habitatStore.getState().seedPets(toHabitatPets(agents));

      for (const agent of agents) {
        settingsStore.getState().bindPetToAgent({
          petId: agent.id,
          gatewayId: agent.gatewayId,
          agentId: agent.agentId
        });
      }

      setConnectionStatus('connected');
      setConnectionError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setConnectionError(message);
      setConnectionStatus(
        message.includes('AUTH_EXPIRED') ? 'auth-expired' : 'offline'
      );
    }
  });

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
      hydrateProfileSecrets,
      () => {
        reconnectAttemptedRef.current = true;
      },
      () => (isActive ? settingsStore.getState().activeProfileId : null),
      async (profileId) => {
        if (isActive) {
          await connectToProfile(profileId);
        }
      }
    );

    return () => {
      isActive = false;
      bridgeUnsubscribeRef.current?.();
      void getRuntimeDeps().bridge.disconnect();
    };
  }, [connectToProfile, surface]);

  const handlePetSendMessage = async (petId: string, text: string) => {
    const bridge = getRuntimeDeps().bridge;
    habitatStore.getState().markPetAsThinking(petId, text);
    try {
      await bridge.sendMessage({ petId, content: text });
    } catch (error) {
      habitatStore.getState().markPetAsBlocked(
        petId,
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  const handlePetCreateTask = async (petId: string, prompt: string) => {
    const bridge = getRuntimeDeps().bridge;
    habitatStore.getState().markPetAsThinking(petId, prompt);
    try {
      await bridge.createTask({ petId, prompt });
    } catch (error) {
      habitatStore.getState().markPetAsBlocked(
        petId,
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  // Build multi-pet slots from all agent rows
  const petSlots: PetSlot[] = agentRows.map((row) => ({
    petId: row.petId,
    petName: row.petName ?? row.agentId ?? 'OpenClaw',
    agentId: row.agentId,
    status: row.status ?? 'idle',
    appearance: row.appearance,
  }));

  if (surface === 'pet') {
    // Multi-pet mode when display mode is 'group', single pet when 'pinned'
    if (displayMode === 'group' && petSlots.length > 1) {
      return (
        <MultiPetShell
          pets={petSlots}
          connectionStatus={connectionStatus}
          activePetId={selectedPetId}
          onSendMessage={handlePetSendMessage}
          onCreateTask={handlePetCreateTask}
          onSelectPet={(id) => habitatStore.getState().selectPet(id)}
        />
      );
    }

    return (
      <DesktopPet
        petName={petDisplayName}
        petId={visiblePetRow?.petId}
        connectionStatus={connectionStatus}
        appearance={selectedPetAppearance}
        petStatus={petDisplayStatus}
        onSendMessage={(text) => {
          if (visiblePetRow) {
            void handlePetSendMessage(visiblePetRow.petId, text);
          }
        }}
        onCreateTask={(prompt) => {
          if (visiblePetRow) {
            void handlePetCreateTask(visiblePetRow.petId, prompt);
          }
        }}
      />
    );
  }

  return (
    <WidgetPanel
      connectionStatus={connectionStatus}
      connectionError={connectionError}
      activeProfileId={activeProfileId}
      displayMode={displayMode}
      pinnedAgentId={pinnedAgentId}
      gatewayProfiles={gatewayProfiles}
      agentRows={agentRows}
      currentCompanion={visiblePetRow}
      currentCompanionPet={currentCompanionPet}
      onReconnect={() => {
        if (activeProfileId) {
          void connectToProfile(activeProfileId);
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
        await connectToProfile(profile.id);
      }}
      onDeleteProfile={(profileId) => {
        clearGatewaySessionAuth(profileId);
        settingsStore.getState().deleteGatewayProfile(profileId);
        void deleteProfileToken(profileId);
        void deleteProfilePassword(profileId);
      }}
      onDisplayModeChange={(mode) => {
        settingsStore.getState().setDisplayMode(mode);
      }}
      onPinnedAgentChange={(agentId) => {
        settingsStore.getState().setPinnedAgentId(agentId);
      }}
      onUpdateAppearance={(petId, appearance) => {
        settingsStore.getState().setPetAppearance(petId, appearance);
      }}
      onSubmitQuickPrompt={submitQuickPrompt}
    />
  );
}

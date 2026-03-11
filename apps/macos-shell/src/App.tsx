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

async function storeProfileToken(profileId: string, token: string) {
  const api = getHabitatDesktopApi();

  if (api?.storeSecret) {
    await api.storeSecret(tokenSecretKey(profileId), token);
  }
}

async function deleteProfileToken(profileId: string) {
  const api = getHabitatDesktopApi();

  if (api?.deleteSecret) {
    await api.deleteSecret(tokenSecretKey(profileId));
  }
}

async function hydrateProfileTokens() {
  const api = getHabitatDesktopApi();

  if (!api?.retrieveSecret) {
    return;
  }

  const profiles = settingsStore.getState().gatewayProfiles;

  for (const profile of Object.values(profiles)) {
    const token = await api.retrieveSecret(tokenSecretKey(profile.id));

    if (token) {
      settingsStore.getState().updateProfileToken(profile.id, token);
    }
  }
}

let initialReconnectAttempted = false;

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
  const petsById = useHabitatStore((state) => state.pets);
  const petCount = useHabitatStore((state) => Object.keys(state.pets).length);
  const selectedPetId = useHabitatStore((state) => state.selectedPetId);
  const selectedPet = selectedPetId ? petsById[selectedPetId] : null;
  const submitQuickPrompt = useQuickComposer(selectedPet?.id ?? '');
  const gatewayProfilesById = useSettingsStore((state) => state.gatewayProfiles);
  const activeProfileId = useSettingsStore((state) => state.activeProfileId);
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
        status: 'disconnected',
        isSelected: false,
        appearance: appearancesByPetId[binding.petId]
      }))
  ];
  const selectedPetAppearance: PetAppearanceConfig | undefined = selectedPet
    ? appearancesByPetId[selectedPet.id]
    : undefined;
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
      initialReconnectAttempted,
      hydrateProfileTokens,
      () => {
        initialReconnectAttempted = true;
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

  if (surface === 'pet') {
    return (
      <DesktopPet
        petName={selectedPet?.name ?? 'OpenClaw'}
        connectionStatus={connectionStatus}
        appearance={selectedPetAppearance}
        petStatus={selectedPet?.status ?? 'idle'}
      />
    );
  }

  return (
    <WidgetPanel
      connectionStatus={connectionStatus}
      connectionError={connectionError}
      activeProfileId={activeProfileId}
      gatewayProfiles={gatewayProfiles}
      agentRows={agentRows}
      petCount={petCount}
      selectedPet={selectedPet}
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
        await connectToProfile(profile.id);
      }}
      onDeleteProfile={(profileId) => {
        clearGatewaySessionAuth(profileId);
        settingsStore.getState().deleteGatewayProfile(profileId);
        void deleteProfileToken(profileId);
      }}
      onUpdateAppearance={(petId, appearance) => {
        settingsStore.getState().setPetAppearance(petId, appearance);
      }}
      onSubmitQuickPrompt={submitQuickPrompt}
    />
  );
}

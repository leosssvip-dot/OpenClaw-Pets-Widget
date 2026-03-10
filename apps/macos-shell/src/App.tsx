import { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { AgentBindingSeed, HabitatEvent } from '@openclaw-habitat/bridge';
import { useQuickComposer } from './features/composer/useQuickComposer';
import { type ConnectionStatus } from './features/connection/ConnectionBadge';
import { habitatStore, useHabitatStore } from './features/habitat/store';
import { getRuntimeDeps } from './runtime/runtime-deps';
import { getHabitatDesktopApi } from './runtime/habitat-api';
import type { SshConnectionInput } from './features/settings/SshConnectionForm';
import { settingsStore, useSettingsStore } from './features/settings/settings-store';
import { DesktopPet } from './features/widget/DesktopPet';
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

function toGatewayProfile(input: SshConnectionInput) {
  return {
    id: `gateway-${Date.now()}`,
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

export function App() {
  const [surface, setSurface] = useState<'pet' | 'panel'>(() => {
    return new URLSearchParams(window.location.search).get('surface') === 'pet'
      ? 'pet'
      : 'panel';
  });
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('offline');
  const bridgeUnsubscribeRef = useRef<(() => void) | null>(null);
  const petsById = useHabitatStore((state) => state.pets);
  const petCount = useHabitatStore((state) => Object.keys(state.pets).length);
  const selectedPetId = useHabitatStore((state) => state.selectedPetId);
  const selectedPet = selectedPetId ? petsById[selectedPetId] : null;
  const submitQuickPrompt = useQuickComposer(selectedPet?.id ?? '');
  const gatewayProfilesById = useSettingsStore((state) => state.gatewayProfiles);
  const activeProfileId = useSettingsStore((state) => state.activeProfileId);
  const bindingsByPetId = useSettingsStore((state) => state.bindings);
  const gatewayProfiles = Object.values(gatewayProfilesById);
  const bindings = Object.values(bindingsByPetId);
  const applyBridgeEvent = useEffectEvent((event: HabitatEvent) => {
    habitatStore.getState().applyEvent(event);
  });
  const connectToProfile = useEffectEvent(async (profileId: string) => {
    const bridge = getRuntimeDeps().bridge;

    setConnectionStatus((status) =>
      status === 'connected' ? 'reconnecting' : 'connecting'
    );

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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setConnectionStatus(
        message.includes('AUTH_EXPIRED') ? 'auth-expired' : 'offline'
      );
    }
  });

  useEffect(() => {
    void getHabitatDesktopApi()
      ?.getRuntimeInfo()
      .then((info) => {
        if (info.surface) {
          setSurface(info.surface);
        }
      });

    return () => {
      bridgeUnsubscribeRef.current?.();
      void getRuntimeDeps().bridge.disconnect();
    };
  }, []);

  if (surface === 'pet') {
    return (
      <DesktopPet
        petName={selectedPet?.name ?? 'OpenClaw'}
        connectionStatus={connectionStatus}
      />
    );
  }

  return (
    <WidgetPanel
      connectionStatus={connectionStatus}
      activeProfileId={activeProfileId}
      gatewayProfiles={gatewayProfiles}
      bindings={bindings}
      petCount={petCount}
      selectedPet={selectedPet}
      onReconnect={() => {
        if (activeProfileId) {
          void connectToProfile(activeProfileId);
        }
      }}
      onConnect={async (input) => {
        const profile = toGatewayProfile(input);
        settingsStore.getState().saveGatewayProfile(profile);
        settingsStore.getState().selectGatewayProfile(profile.id);
        await connectToProfile(profile.id);
      }}
      onSubmitQuickPrompt={submitQuickPrompt}
    />
  );
}

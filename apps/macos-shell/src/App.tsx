import { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { AgentBindingSeed, HabitatEvent } from '@openclaw-habitat/bridge';
import { QuickComposer } from './features/composer/QuickComposer';
import { useQuickComposer } from './features/composer/useQuickComposer';
import {
  ConnectionBadge,
  type ConnectionStatus
} from './features/connection/ConnectionBadge';
import { ReconnectBanner } from './features/connection/ReconnectBanner';
import { PetCanvas } from './features/habitat/PetCanvas';
import { habitatStore, useHabitatStore } from './features/habitat/store';
import { ResultCard } from './features/results/ResultCard';
import { getRuntimeDeps } from './runtime/runtime-deps';
import { AgentBindings } from './features/settings/AgentBindings';
import { GatewayProfiles } from './features/settings/GatewayProfiles';
import { settingsStore, useSettingsStore } from './features/settings/settings-store';

function toHabitatPets(agents: AgentBindingSeed[]) {
  return agents.map((agent) => ({
    id: agent.id,
    agentId: agent.agentId,
    gatewayId: agent.gatewayId,
    status: agent.status ?? 'idle',
    name: agent.label
  }));
}

export function App() {
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
    return () => {
      bridgeUnsubscribeRef.current?.();
      void getRuntimeDeps().bridge.disconnect();
    };
  }, []);

  return (
    <main className="app-shell">
      <header className="app-shell__header">
        <div>
          <h1>Agent Habitat</h1>
          <p>Desktop companions for your OpenClaw agents.</p>
        </div>
        <ConnectionBadge status={connectionStatus} />
      </header>
      <ReconnectBanner
        status={connectionStatus}
        onReconnect={() => {
          if (activeProfileId) {
            void connectToProfile(activeProfileId);
          }
        }}
      />
      <div className="app-shell__dashboard">
        <GatewayProfiles
          profiles={gatewayProfiles}
          activeProfileId={activeProfileId}
          onConnect={async ({ label, baseUrl }) => {
            const profileId = `gateway-${Date.now()}`;
            settingsStore.getState().saveGatewayProfile({
              id: profileId,
              label,
              transport: 'tailnet',
              baseUrl,
              token: import.meta.env.VITE_OPENCLAW_GATEWAY_TOKEN ?? 'dev-token'
            });
            settingsStore.getState().selectGatewayProfile(profileId);
            await connectToProfile(profileId);
          }}
        />
        <AgentBindings bindings={bindings} />
      </div>
      {petCount === 0 ? (
        <p>No pets connected</p>
      ) : (
        <div className="app-shell__workspace">
          <PetCanvas />
          {selectedPet ? (
            <aside className="app-shell__sidepanel">
              <QuickComposer
                petName={selectedPet.name ?? selectedPet.agentId}
                onSubmit={submitQuickPrompt}
              />
              {selectedPet.bubbleText ? (
                <ResultCard
                  title={selectedPet.name ?? selectedPet.agentId}
                  body={selectedPet.bubbleText}
                  status={selectedPet.status === 'done' ? 'Done' : 'Working'}
                />
              ) : null}
            </aside>
          ) : null}
        </div>
      )}
    </main>
  );
}

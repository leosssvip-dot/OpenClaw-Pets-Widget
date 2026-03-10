import { useState } from 'react';
import { QuickComposer } from './features/composer/QuickComposer';
import { useQuickComposer } from './features/composer/useQuickComposer';
import {
  ConnectionBadge,
  type ConnectionStatus
} from './features/connection/ConnectionBadge';
import { ReconnectBanner } from './features/connection/ReconnectBanner';
import { PetCanvas } from './features/habitat/PetCanvas';
import { useHabitatStore } from './features/habitat/store';
import { ResultCard } from './features/results/ResultCard';
import { AgentBindings } from './features/settings/AgentBindings';
import { GatewayProfiles } from './features/settings/GatewayProfiles';
import { settingsStore, useSettingsStore } from './features/settings/settings-store';

export function App() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('offline');
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
        onReconnect={() => setConnectionStatus('reconnecting')}
      />
      <div className="app-shell__dashboard">
        <GatewayProfiles
          profiles={gatewayProfiles}
          activeProfileId={activeProfileId}
          onConnect={({ label, baseUrl }) => {
            const profileId = `gateway-${Date.now()}`;
            settingsStore.getState().saveGatewayProfile({
              id: profileId,
              label,
              transport: 'tailnet',
              baseUrl,
              token: 'dev-token'
            });
            settingsStore.getState().selectGatewayProfile(profileId);
            setConnectionStatus('connected');
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

import type { GatewayProfile } from '@openclaw-habitat/bridge';
import { QuickComposer } from '../composer/QuickComposer';
import type { ConnectionStatus } from '../connection/ConnectionBadge';
import { ConnectionBadge } from '../connection/ConnectionBadge';
import { ReconnectBanner } from '../connection/ReconnectBanner';
import { PetCanvas } from '../habitat/PetCanvas';
import type { HabitatPet } from '../habitat/types';
import { ResultCard } from '../results/ResultCard';
import { AgentBindings } from '../settings/AgentBindings';
import { GatewayProfiles } from '../settings/GatewayProfiles';
import type { PetAgentBinding } from '../settings/settings-store';

export function WidgetPanel({
  connectionStatus,
  activeProfileId,
  gatewayProfiles,
  bindings,
  petCount,
  selectedPet,
  onReconnect,
  onConnect,
  onSubmitQuickPrompt
}: {
  connectionStatus: ConnectionStatus;
  activeProfileId: string | null;
  gatewayProfiles: GatewayProfile[];
  bindings: PetAgentBinding[];
  petCount: number;
  selectedPet: HabitatPet | null;
  onReconnect: () => void;
  onConnect: (input: { label: string; baseUrl: string }) => Promise<void>;
  onSubmitQuickPrompt: (value: string) => Promise<void>;
}) {
  return (
    <main className="app-shell app-shell--panel">
      <header className="app-shell__header">
        <div>
          <h1>Agent Habitat</h1>
          <p>Desktop companions for your OpenClaw agents.</p>
        </div>
        <ConnectionBadge status={connectionStatus} />
      </header>
      <ReconnectBanner status={connectionStatus} onReconnect={onReconnect} />
      <div className="app-shell__dashboard">
        <GatewayProfiles
          profiles={gatewayProfiles}
          activeProfileId={activeProfileId}
          onConnect={onConnect}
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
                onSubmit={onSubmitQuickPrompt}
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

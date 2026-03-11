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
import type { SshConnectionInput } from '../settings/SshConnectionForm';
import type { PetAppearanceConfig } from './pet-appearance';
import { getHabitatDesktopApi } from '../../runtime/habitat-api';

export function WidgetPanel({
  connectionStatus,
  connectionError,
  activeProfileId,
  gatewayProfiles,
  agentRows,
  petCount,
  selectedPet,
  onReconnect,
  onSaveProfile,
  onDeleteProfile,
  onUpdateAppearance,
  onSubmitQuickPrompt
}: {
  connectionStatus: ConnectionStatus;
  connectionError: string | null;
  activeProfileId: string | null;
  gatewayProfiles: GatewayProfile[];
  agentRows: Array<{
    petId: string;
    petName?: string;
    agentId: string;
    gatewayId: string;
    status: string;
    isSelected: boolean;
    appearance?: PetAppearanceConfig;
  }>;
  petCount: number;
  selectedPet: HabitatPet | null;
  onReconnect: () => void;
  onSaveProfile: (input: SshConnectionInput, profileId?: string) => Promise<void>;
  onDeleteProfile: (profileId: string) => void;
  onUpdateAppearance: (petId: string, appearance: PetAppearanceConfig) => void;
  onSubmitQuickPrompt: (value: string) => Promise<void>;
}) {
  return (
    <main className="app-shell app-shell--panel">
      <header className="app-shell__header">
        <div>
          <h1>Agent Habitat</h1>
          <p>Desktop companions for your OpenClaw agents.</p>
        </div>
        <div className="app-shell__header-actions">
          <ConnectionBadge status={connectionStatus} />
          <button
            className="app-shell__hide-btn"
            title="Hide panel"
            onClick={() => void getHabitatDesktopApi()?.togglePanel()}
          >
            &minus;
          </button>
        </div>
      </header>
      <ReconnectBanner
        status={connectionStatus}
        errorMessage={connectionError}
        hasActiveProfile={activeProfileId !== null}
        onReconnect={onReconnect}
      />
      <div className="app-shell__dashboard">
        <GatewayProfiles
          profiles={gatewayProfiles}
          activeProfileId={activeProfileId}
          isConnecting={connectionStatus === 'connecting' || connectionStatus === 'reconnecting'}
          onSaveProfile={onSaveProfile}
          onDeleteProfile={onDeleteProfile}
        />
        <AgentBindings rows={agentRows} onUpdateAppearance={onUpdateAppearance} />
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

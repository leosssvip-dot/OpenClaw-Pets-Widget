import { useState } from 'react';
import type { GatewayProfile } from '@openclaw-habitat/bridge';
import { QuickComposer } from '../composer/QuickComposer';
import type { ConnectionStatus } from '../connection/ConnectionBadge';
import { ConnectionBadge } from '../connection/ConnectionBadge';
import { ReconnectBanner } from '../connection/ReconnectBanner';
import type { HabitatPet } from '../habitat/types';
import { ResultCard } from '../results/ResultCard';
import { AgentBindings } from '../settings/AgentBindings';
import { GatewayProfiles } from '../settings/GatewayProfiles';
import type { SshConnectionInput } from '../settings/SshConnectionForm';
import {
  PET_ROLE_PACKS,
  resolvePetAppearance,
  type PetAppearanceConfig,
  type PetRolePackId
} from './pet-appearance';
import { getHabitatDesktopApi } from '../../runtime/habitat-api';

function statusLabel(status: string) {
  return status.replace(/-/g, ' ');
}

export function WidgetPanel({
  connectionStatus,
  connectionError,
  activeProfileId,
  displayMode,
  pinnedAgentId,
  gatewayProfiles,
  agentRows,
  currentCompanion,
  currentCompanionPet,
  onReconnect,
  onSaveProfile,
  onDeleteProfile,
  onDisplayModeChange,
  onPinnedAgentChange,
  onUpdateAppearance,
  onSubmitQuickPrompt
}: {
  connectionStatus: ConnectionStatus;
  connectionError: string | null;
  activeProfileId: string | null;
  displayMode: 'pinned' | 'group';
  pinnedAgentId: string | null;
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
  currentCompanion: {
    petId: string;
    petName?: string;
    agentId: string;
    gatewayId: string;
    status: string;
    appearance?: PetAppearanceConfig;
  } | null;
  currentCompanionPet: HabitatPet | null;
  onReconnect: () => void;
  onSaveProfile: (input: SshConnectionInput, profileId?: string) => Promise<void>;
  onDeleteProfile: (profileId: string) => void;
  onDisplayModeChange: (mode: 'pinned' | 'group') => void;
  onPinnedAgentChange: (agentId: string | null) => void;
  onUpdateAppearance: (petId: string, appearance: PetAppearanceConfig) => void;
  onSubmitQuickPrompt: (value: string) => Promise<void>;
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAgentPickerOpen, setIsAgentPickerOpen] = useState(false);
  const [isCharacterPickerOpen, setIsCharacterPickerOpen] = useState(false);
  const resolvedAppearance = resolvePetAppearance(currentCompanion?.appearance);
  const currentRolePack =
    PET_ROLE_PACKS.find((pack) => pack.id === resolvedAppearance.rolePack) ?? PET_ROLE_PACKS[0];
  const currentName = currentCompanion?.petName ?? currentCompanion?.agentId ?? 'OpenClaw';

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

      <section className="app-shell__hero">
        <div className="companion-stage">
          <div className="section-heading">
            <h2>Current companion</h2>
          </div>
          <div className="companion-stage__card">
            <div
              className={`companion-stage__preview companion-stage__preview--${resolvedAppearance.rolePack}`}
              aria-hidden="true"
            >
              <span>{currentRolePack.label.slice(0, 1)}</span>
            </div>
            <div className="companion-stage__copy">
              <strong>{currentName}</strong>
              <span>{currentRolePack.label}</span>
              <p>
                {currentCompanion
                  ? `${statusLabel(currentCompanion.status)} on ${currentCompanion.gatewayId}`
                  : 'Connect a gateway to wake up your first companion.'}
              </p>
            </div>
          </div>
        </div>

        <div className="app-shell__main-controls">
          {currentCompanion ? (
            <QuickComposer petName={currentName} onSubmit={onSubmitQuickPrompt} />
          ) : (
            <div className="app-shell__empty-state">
              <strong>No companion connected</strong>
              <p>Open settings and connect a gateway to bring a character on stage.</p>
            </div>
          )}

          <div className="app-shell__quick-actions">
            <button
              type="button"
              className="app-shell__action-chip"
              onClick={() => {
                setIsAgentPickerOpen((open) => !open);
                setIsCharacterPickerOpen(false);
              }}
            >
              Switch agent
            </button>
            <button
              type="button"
              className="app-shell__action-chip"
              disabled={!currentCompanion}
              onClick={() => {
                setIsCharacterPickerOpen((open) => !open);
                setIsAgentPickerOpen(false);
              }}
            >
              Switch character
            </button>
            <button
              type="button"
              className="app-shell__action-chip app-shell__action-chip--primary"
              onClick={() => setIsSettingsOpen((open) => !open)}
            >
              More settings
            </button>
          </div>

          {isAgentPickerOpen ? (
            <div className="app-shell__picker">
              <label>
                <span>Active agent</span>
                <select
                  aria-label="Active agent"
                  value={currentCompanion?.agentId ?? ''}
                  onChange={(event) => {
                    onDisplayModeChange('pinned');
                    onPinnedAgentChange(event.currentTarget.value || null);
                    setIsAgentPickerOpen(false);
                  }}
                >
                  {agentRows.map((row) => (
                    <option key={row.petId} value={row.agentId}>
                      {row.petName ?? row.agentId}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}

          {isCharacterPickerOpen && currentCompanion ? (
            <div className="app-shell__picker">
              <label>
                <span>Character</span>
                <select
                  aria-label="Current character"
                  value={resolvedAppearance.rolePack}
                  onChange={(event) => {
                    onUpdateAppearance(currentCompanion.petId, {
                      rolePack: event.currentTarget.value as PetRolePackId
                    });
                    setIsCharacterPickerOpen(false);
                  }}
                >
                  {PET_ROLE_PACKS.map((pack) => (
                    <option key={pack.id} value={pack.id}>
                      {pack.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}

          {currentCompanionPet?.bubbleText ? (
            <ResultCard
              title={currentName}
              body={currentCompanionPet.bubbleText}
              status={currentCompanionPet.status === 'done' ? 'Done' : 'Working'}
            />
          ) : null}
        </div>
      </section>

      {isSettingsOpen ? (
        <section className="app-shell__settings-drawer">
          <AgentBindings
            rows={agentRows}
            displayMode={displayMode}
            pinnedAgentId={pinnedAgentId}
            onDisplayModeChange={onDisplayModeChange}
            onPinnedAgentChange={onPinnedAgentChange}
            onUpdateAppearance={onUpdateAppearance}
          />
          <section className="app-shell__settings-section">
            <div className="section-heading">
              <h2>Connection</h2>
            </div>
            <GatewayProfiles
              profiles={gatewayProfiles}
              activeProfileId={activeProfileId}
              isConnecting={
                connectionStatus === 'connecting' || connectionStatus === 'reconnecting'
              }
              onSaveProfile={onSaveProfile}
              onDeleteProfile={onDeleteProfile}
            />
          </section>
        </section>
      ) : null}
    </main>
  );
}

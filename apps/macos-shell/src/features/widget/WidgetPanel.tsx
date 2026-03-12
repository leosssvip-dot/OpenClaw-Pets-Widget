import { useState } from 'react';
import type { GatewayProfile } from '@openclaw-habitat/bridge';
import { QuickComposer } from '../composer/QuickComposer';
import type { ConnectionStatus } from '../connection/ConnectionBadge';
import { ConnectionBadge } from '../connection/ConnectionBadge';
import { ReconnectBanner } from '../connection/ReconnectBanner';
import type { HabitatPet } from '../habitat/types';
import { ResultCard } from '../results/ResultCard';
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

function rolePackMeta(rolePack: PetRolePackId) {
  return PET_ROLE_PACKS.find((pack) => pack.id === rolePack) ?? PET_ROLE_PACKS[0];
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
  const [expandedSection, setExpandedSection] = useState<
    'display' | 'characters' | 'connection' | null
  >('display');
  const [isConnectionEditorOpen, setIsConnectionEditorOpen] = useState(false);
  const resolvedAppearance = resolvePetAppearance(currentCompanion?.appearance);
  const currentRolePack = rolePackMeta(resolvedAppearance.rolePack);
  const currentName = currentCompanion?.petName ?? currentCompanion?.agentId ?? 'OpenClaw';
  const activeGatewayLabel =
    gatewayProfiles.find((profile) => profile.id === activeProfileId)?.label ?? activeProfileId;
  const isSectionOpen = (section: 'display' | 'characters' | 'connection') =>
    expandedSection === section;
  const toggleSection = (section: 'display' | 'characters' | 'connection') => {
    setExpandedSection((current) => (current === section ? null : section));
  };

  return (
    <main className="app-shell app-shell--panel">
      <ReconnectBanner
        status={connectionStatus}
        errorMessage={connectionError}
        hasActiveProfile={activeProfileId !== null}
        onReconnect={onReconnect}
      />

      <section className="widget-layout">
        <div className="widget-layout__main">
          <section className="panel-frame panel-frame--unified">
            <div className="window-bar">
              <div className="dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className="window-bar__actions">
                <ConnectionBadge status={connectionStatus} />
                <button
                  type="button"
                  className="app-shell__hide-btn"
                  title="Hide panel"
                  onClick={() => void getHabitatDesktopApi()?.togglePanel()}
                >
                  &minus;
                </button>
              </div>
            </div>

            {currentCompanion ? (
              <QuickComposer
                petName={currentName}
                promptHint={currentRolePack.promptHint}
                placeholder={currentRolePack.quickPromptExample}
                submitLabel="Send Task"
                onSubmit={onSubmitQuickPrompt}
              />
            ) : (
              <div className="app-shell__empty-state">
                <strong>No companion connected</strong>
                <p>Open the connection section and link a gateway to bring a companion on stage.</p>
                <button
                  type="button"
                  className="app-shell__empty-state-action"
                  onClick={() => {
                    setExpandedSection('connection');
                    setIsConnectionEditorOpen(true);
                  }}
                >
                  Connect gateway
                </button>
              </div>
            )}

            {currentCompanionPet?.bubbleText ? (
              <ResultCard
                title={currentName}
                body={currentCompanionPet.bubbleText}
                status={currentCompanionPet.status === 'done' ? 'Done' : 'Working'}
              />
            ) : null}

            <section className="panel-settings" aria-label="Panel settings">
              <header className="settings-drawer__header">
              <div className="settings-drawer__masthead">
                <div className="settings-drawer__pet-hint" data-testid="settings-pet-hint" aria-hidden="true">
                  <span className="settings-drawer__pet-hint-mark" />
                </div>
                <div className="settings-drawer__heading-copy">
                  <h3 className="settings-drawer__title">Settings</h3>
                  <span className="settings-drawer__subtitle">
                    Display · Companions · Connection
                  </span>
                </div>
              </div>
              </header>
              <div className="settings-drawer__body">
              <section className="settings-section">
                <h4 className="settings-section__title">
                  <button
                    type="button"
                    className="settings-section__toggle"
                    aria-expanded={isSectionOpen('display')}
                    onClick={() => toggleSection('display')}
                  >
                    Display
                  </button>
                </h4>
                {isSectionOpen('display') ? <div className="settings-section__content">
                  <div className="settings-row">
                    <div className="settings-row__label">
                      <strong>Mode</strong>
                      <span>How companions appear</span>
                    </div>
                    <fieldset className="settings-row__control settings-display-mode" aria-label="Display mode">
                      <label>
                        <input
                          type="radio"
                          name="display-mode"
                          value="pinned"
                          checked={displayMode === 'pinned'}
                          onChange={() => onDisplayModeChange('pinned')}
                        />
                        Single agent
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="display-mode"
                          value="group"
                          checked={displayMode === 'group'}
                          onChange={() => onDisplayModeChange('group')}
                        />
                        Group
                      </label>
                    </fieldset>
                  </div>
                  <div className="settings-row">
                    <div className="settings-row__label">
                      <strong>Pinned</strong>
                      <span>Favorite on stage</span>
                    </div>
                    <div className="settings-row__control">
                      <select
                        aria-label="Pinned agent"
                        value={pinnedAgentId ?? agentRows[0]?.agentId ?? ''}
                        onChange={(event) => onPinnedAgentChange(event.currentTarget.value || null)}
                      >
                        {agentRows.length === 0 ? <option value="">No agents available</option> : null}
                        {agentRows.map((row) => (
                          <option key={row.agentId} value={row.agentId}>
                            {row.petName ?? row.agentId}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div> : null}
              </section>

              <section className="settings-section">
                <h4 className="settings-section__title">
                  <button
                    type="button"
                    className="settings-section__toggle"
                    aria-expanded={isSectionOpen('characters')}
                    onClick={() => toggleSection('characters')}
                  >
                    Characters
                  </button>
                </h4>
                {isSectionOpen('characters') ? <div className="settings-section__content">
                  <ul className="settings-character-list">
                    {agentRows.map((row) => {
                      const rowRolePack = resolvePetAppearance(row.appearance).rolePack;
                      const rowRoleMeta = rolePackMeta(rowRolePack);

                      return (
                        <li key={row.petId} className="settings-character-item">
                          <span className="settings-character-item__bookmark" aria-hidden="true" />
                          <div className="settings-character-item__info">
                            <strong>{row.petName ?? row.agentId}</strong>
                            <span>
                              {row.agentId} · {statusLabel(row.status)} · {rowRoleMeta.roleLabel}
                            </span>
                          </div>
                          <select
                            className="settings-character-item__select"
                            aria-label={`Character for ${row.petName ?? row.agentId}`}
                            value={rowRolePack}
                            onChange={(event) =>
                              onUpdateAppearance(row.petId, {
                                rolePack: event.currentTarget.value as PetRolePackId
                              })
                            }
                          >
                            {PET_ROLE_PACKS.map((pack) => (
                              <option key={pack.id} value={pack.id}>
                                {pack.label}
                              </option>
                            ))}
                          </select>
                        </li>
                      );
                    })}
                  </ul>
                </div> : null}
              </section>

              <section className="settings-section">
                <h4 className="settings-section__title">
                  <button
                    type="button"
                    className="settings-section__toggle"
                    aria-expanded={isSectionOpen('connection')}
                    onClick={() => toggleSection('connection')}
                  >
                    Connection
                  </button>
                </h4>
                {isSectionOpen('connection') ? <div className="settings-section__content">
                  <div className="settings-row">
                    <div className="settings-row__label">
                      <strong>Gateway</strong>
                      <span>
                        {activeProfileId
                          ? `${activeGatewayLabel} · ${statusLabel(connectionStatus)}`
                          : 'Not connected'}
                      </span>
                    </div>
                    <div className="settings-row__control">
                      <button
                        type="button"
                        className={activeProfileId ? 'settings-btn settings-btn--secondary' : 'settings-btn settings-btn--primary'}
                        onClick={() => {
                          if (activeProfileId) {
                            onReconnect();
                            return;
                          }
                          setExpandedSection('connection');
                          setIsConnectionEditorOpen(true);
                        }}
                      >
                        {activeProfileId ? 'Reconnect' : 'Add gateway'}
                      </button>
                    </div>
                  </div>
                  <div className="settings-row">
                    <div className="settings-row__label">
                      <strong>Details</strong>
                      <span>Gateways and SSH setup</span>
                    </div>
                    <button
                      type="button"
                      className="settings-btn settings-btn--ghost"
                      onClick={() => {
                        setExpandedSection('connection');
                        setIsConnectionEditorOpen((open) => !open);
                      }}
                    >
                      {isConnectionEditorOpen ? 'Hide' : 'Edit'}
                    </button>
                  </div>
                </div> : null}
                {isSectionOpen('connection') && (isConnectionEditorOpen || gatewayProfiles.length === 0) && (
                  <div className="settings-section__extra">
                    <GatewayProfiles
                      profiles={gatewayProfiles}
                      activeProfileId={activeProfileId}
                      isConnecting={
                        connectionStatus === 'connecting' || connectionStatus === 'reconnecting'
                      }
                      onSaveProfile={onSaveProfile}
                      onDeleteProfile={onDeleteProfile}
                    />
                  </div>
                )}
              </section>
              </div>
            </section>
          </section>
        </div>
      </section>
    </main>
  );
}

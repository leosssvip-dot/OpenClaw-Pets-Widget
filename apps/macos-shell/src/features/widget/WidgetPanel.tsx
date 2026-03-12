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
import { RolePackIllustration } from './RolePackIllustration';
import { getHabitatDesktopApi } from '../../runtime/habitat-api';

function statusLabel(status: string) {
  return status.replace(/-/g, ' ');
}

function rolePackMeta(rolePack: PetRolePackId) {
  return PET_ROLE_PACKS.find((pack) => pack.id === rolePack) ?? PET_ROLE_PACKS[0];
}

function panelDescription(
  rolePack: ReturnType<typeof rolePackMeta>,
  currentCompanion: {
    gatewayId: string;
    status: string;
  } | null
) {
  if (!currentCompanion) {
    return rolePack.panelDescription;
  }

  return `${rolePack.panelDescription} Currently ${statusLabel(currentCompanion.status)} on ${currentCompanion.gatewayId}.`;
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
  const [isConnectionEditorOpen, setIsConnectionEditorOpen] = useState(false);
  const resolvedAppearance = resolvePetAppearance(currentCompanion?.appearance);
  const currentRolePack = rolePackMeta(resolvedAppearance.rolePack);
  const currentName = currentCompanion?.petName ?? currentCompanion?.agentId ?? 'OpenClaw';
  const activeGatewayLabel =
    gatewayProfiles.find((profile) => profile.id === activeProfileId)?.label ?? activeProfileId;

  return (
    <main className="app-shell app-shell--panel">
      <ReconnectBanner
        status={connectionStatus}
        errorMessage={connectionError}
        hasActiveProfile={activeProfileId !== null}
        onReconnect={onReconnect}
      />

      <section className={`widget-layout${isSettingsOpen ? ' widget-layout--with-drawer' : ''}`}>
        <div className="widget-layout__main">
          <div className="screen-label">
            <h3>Main Panel</h3>
            <span>Fast entry</span>
          </div>
          <section className="panel-frame">
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

            <div className="pet-stage">
              <div className="stage-card">
                <div className={`panel-avatar panel-avatar--${resolvedAppearance.rolePack}`} aria-hidden="true">
                  <RolePackIllustration
                    rolePack={resolvedAppearance.rolePack}
                    className={`panel-avatar-art panel-avatar-art--${resolvedAppearance.rolePack}`}
                    svgClassName="panel-avatar-art__svg"
                  />
                </div>
                <div className="stage-meta">
                  <div className="eyebrow">
                    {currentRolePack.label} · {currentRolePack.roleLabel.toLowerCase()}
                  </div>
                  <h2>{currentRolePack.panelTitle}</h2>
                  <p>{panelDescription(currentRolePack, currentCompanion)}</p>
                  {currentCompanion ? (
                    <div className="stat-strip">
                      <div className="stat">
                        <strong>Agent</strong>
                        <span>{currentCompanion.agentId}</span>
                      </div>
                      <div className="stat">
                        <strong>Role</strong>
                        <span>{currentRolePack.roleLabel}</span>
                      </div>
                      <div className="stat">
                        <strong>Signal</strong>
                        <span>{currentRolePack.signalLabel}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
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
                <p>Open settings and connect a gateway to bring a character on stage.</p>
                <button
                  type="button"
                  className="app-shell__empty-state-action"
                  onClick={() => {
                    setIsSettingsOpen(true);
                    setIsConnectionEditorOpen(true);
                  }}
                >
                  Connect gateway
                </button>
              </div>
            )}

            <div className="action-strip">
              <div className="action">
                <button
                  type="button"
                  className="app-shell__action-chip"
                  onClick={() => setIsAgentPickerOpen((open) => !open)}
                >
                  Switch agent
                </button>
                <span>Compact live roster with runtime state.</span>
              </div>
              <div className="action">
                <button
                  type="button"
                  className="app-shell__action-chip"
                  disabled={!currentCompanion}
                  onClick={() => {
                    const picker = document.querySelector('.panel-secondary');
                    if (picker instanceof HTMLElement) {
                      picker.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                  }}
                >
                  Switch character
                </button>
                <span>Swap between Code, Plan, Ops, and Focus modes.</span>
              </div>
              <div className="action">
                <button
                  type="button"
                  className="app-shell__action-chip app-shell__action-chip--primary"
                  onClick={() => setIsSettingsOpen((open) => !open)}
                >
                  More settings
                </button>
                <span>Reveal display, characters, and connection.</span>
              </div>
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

            {currentCompanionPet?.bubbleText ? (
              <ResultCard
                title={currentName}
                body={currentCompanionPet.bubbleText}
                status={currentCompanionPet.status === 'done' ? 'Done' : 'Working'}
              />
            ) : null}
          </section>

          {currentCompanion ? (
            <section className="panel-secondary">
              <div className="screen-label">
                <h3>Character Picker</h3>
                <span>Quick swap</span>
              </div>
              <div className="panel-frame panel-frame--compact">
                <div className="mini-characters">
                  {PET_ROLE_PACKS.map((pack) => (
                    <button
                      key={pack.id}
                      type="button"
                      className={`mini-character${resolvedAppearance.rolePack === pack.id ? ' mini-character--active' : ''}`}
                      onClick={() => {
                        if (!currentCompanion) {
                          return;
                        }

                        onUpdateAppearance(currentCompanion.petId, {
                          rolePack: pack.id as PetRolePackId
                        });
                      }}
                    >
                      <div className={`mini-icon mini-icon--${pack.id}`} aria-hidden="true">
                        {pack.roleLabel}
                      </div>
                      <div>
                        <strong>{pack.label}</strong>
                        <span>{pack.signalLabel}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          ) : null}
        </div>

        {isSettingsOpen ? (
          <div className="widget-layout__drawer">
            <div className="screen-label">
              <h3>Settings Drawer</h3>
              <span>Low-friction maintenance</span>
            </div>
            <section className="drawer">
              <div className="window-bar">
                <div className="dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="eyebrow">More Settings</div>
              </div>

              <section className="drawer-group">
                <h5>Display</h5>
                <div className="drawer-row">
                  <div className="drawer-copy">
                    <strong>Mode</strong>
                    <span>Switch between a single resident companion or a shared stage.</span>
                  </div>
                  <div className="chip active">
                    {displayMode === 'pinned' ? 'Single Agent' : 'Group'}
                  </div>
                </div>
                <div className="drawer-row">
                  <div className="drawer-copy">
                    <strong>Pinned companion</strong>
                    <span>Keep one favorite pet stable on the desktop.</span>
                  </div>
                  <div className="toggle">{pinnedAgentId ?? currentCompanion?.agentId ?? 'Auto'}</div>
                </div>
                <div className="drawer-advanced">
                  <fieldset className="agent-bindings__display-mode">
                    <legend>Display mode</legend>
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
                  <label className="agent-bindings__pinned-agent">
                    <span>Pinned agent</span>
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
                  </label>
                </div>
              </section>

              <section className="drawer-group">
                <h5>Characters</h5>
                <div className="drawer-row">
                  <div className="drawer-copy">
                    <strong>Role packs</strong>
                    <span>Each pack maps to a readable work role with a clear prop set and pose.</span>
                  </div>
                  <div className="toggle">{PET_ROLE_PACKS.length} installed</div>
                </div>
                <div className="mini-characters mini-characters--drawer">
                  {PET_ROLE_PACKS.map((pack) => (
                    <div key={pack.id} className="mini-character mini-character--static">
                      <div className={`mini-icon mini-icon--${pack.id}`} aria-hidden="true">
                        {pack.roleLabel}
                      </div>
                      <div>
                        <strong>{pack.label}</strong>
                        <span>{pack.roleLabel}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <ul className="drawer-character-list">
                  {agentRows.map((row) => {
                    const rowRolePack = resolvePetAppearance(row.appearance).rolePack;
                    const rowRoleMeta = rolePackMeta(rowRolePack);

                    return (
                      <li key={row.petId} className="drawer-character-item">
                        <div className="drawer-character-copy">
                          <strong>{row.petName ?? row.agentId}</strong>
                          <span>
                            {row.agentId} · {statusLabel(row.status)} · {rowRoleMeta.roleLabel}
                          </span>
                        </div>
                        <label className="drawer-character-field">
                          <span>Character</span>
                          <select
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
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className="drawer-group">
                <h5>Connection</h5>
                <div className="drawer-row">
                  <div className="drawer-copy">
                    <strong>Gateway</strong>
                    <span>
                      {activeProfileId
                        ? `${activeGatewayLabel} · ${statusLabel(connectionStatus)}`
                        : 'No gateway connected yet.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={activeProfileId ? 'chip' : 'chip active'}
                    onClick={() => {
                      if (activeProfileId) {
                        onReconnect();
                        return;
                      }

                      setIsConnectionEditorOpen(true);
                    }}
                  >
                    {activeProfileId ? 'Reconnect' : 'Add gateway'}
                  </button>
                </div>
                <div className="drawer-row">
                  <div className="drawer-copy">
                    <strong>Advanced edit</strong>
                    <span>Reveal SSH host, user, ports, and token only when needed.</span>
                  </div>
                  <button
                    type="button"
                    className="toggle"
                    onClick={() => setIsConnectionEditorOpen((open) => !open)}
                  >
                    {isConnectionEditorOpen ? 'Hide' : 'Edit'}
                  </button>
                </div>
                {isConnectionEditorOpen || gatewayProfiles.length === 0 ? (
                  <GatewayProfiles
                    profiles={gatewayProfiles}
                    activeProfileId={activeProfileId}
                    isConnecting={
                      connectionStatus === 'connecting' || connectionStatus === 'reconnecting'
                    }
                    onSaveProfile={onSaveProfile}
                    onDeleteProfile={onDeleteProfile}
                  />
                ) : null}
              </section>
            </section>
          </div>
        ) : null}
      </section>
    </main>
  );
}

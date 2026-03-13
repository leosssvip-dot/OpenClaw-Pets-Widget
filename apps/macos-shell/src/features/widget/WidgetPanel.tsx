import { useState } from 'react';
import type { GatewayProfile } from '@openclaw-habitat/bridge';
import { ChatPanel } from '../chat/ChatPanel';
import type { ConnectionStatus } from '../connection/ConnectionBadge';
import { ConnectionBadge } from '../connection/ConnectionBadge';
import { ReconnectBanner } from '../connection/ReconnectBanner';
import type { HabitatPet } from '../habitat/types';
import { SettingsPanel } from '../settings/SettingsPanel';
import type { SshConnectionInput } from '../settings/SshConnectionForm';
import {
  PET_ROLE_PACKS,
  resolvePetAppearance,
  type PetAppearanceConfig,
  type PetRolePackId
} from './pet-appearance';
import { getHabitatDesktopApi } from '../../runtime/habitat-api';

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
              <ChatPanel
                sessionKey={
                  activeProfileId && currentCompanion
                    ? `${activeProfileId}:${currentCompanion.agentId}`
                    : null
                }
                petName={currentName}
                placeholder={currentRolePack.quickPromptExample}
                disabled={
                  connectionStatus === 'connecting' || connectionStatus === 'reconnecting'
                }
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

                <SettingsPanel
                  connectionStatus={connectionStatus}
                  activeProfileId={activeProfileId}
                  displayMode={displayMode}
                  pinnedAgentId={pinnedAgentId}
                  gatewayProfiles={gatewayProfiles}
                  agentRows={agentRows}
                  onReconnect={onReconnect}
                  onSaveProfile={onSaveProfile}
                  onDeleteProfile={onDeleteProfile}
                  onDisplayModeChange={onDisplayModeChange}
                  onPinnedAgentChange={onPinnedAgentChange}
                  onUpdateAppearance={onUpdateAppearance}
                  onSubmitQuickPrompt={onSubmitQuickPrompt}
                  expandedSection={expandedSection}
                  onSetExpandedSection={setExpandedSection}
                  isConnectionEditorOpen={isConnectionEditorOpen}
                  onSetIsConnectionEditorOpen={setIsConnectionEditorOpen}
                />
          </section>
        </div>
      </section>
    </main>
  );
}

import { useState } from 'react';
import type { GatewayProfile } from '@openclaw-habitat/bridge';
import { ChatPanel } from '../chat/ChatPanel';
import type { ConnectionStatus } from '../connection/ConnectionBadge';
import { ConnectionBadge } from '../connection/ConnectionBadge';
import { ReconnectBanner } from '../connection/ReconnectBanner';
import type { HabitatPet } from '../habitat/types';
import { SettingsPanel } from '../settings/SettingsPanel';
import { GalleryPanel } from '../settings/GalleryPanel';
import type { ConnectionInput } from '../settings/SshConnectionForm';
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
  pinnedAgentId,
  gatewayProfiles,
  agentRows,
  currentCompanion,
  currentCompanionPet,
  onReconnect,
  onSaveProfile,
  onDeleteProfile,
  onPinnedAgentChange,
  onSelectPet,
  onUpdateAppearance,
  onSubmitQuickPrompt
}: {
  connectionStatus: ConnectionStatus;
  connectionError: string | null;
  activeProfileId: string | null;
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
  onSaveProfile: (input: ConnectionInput, profileId?: string) => Promise<void>;
  onDeleteProfile: (profileId: string) => void;
  onPinnedAgentChange: (agentId: string | null) => void;
  onSelectPet: (petId: string) => void;
  onUpdateAppearance: (petId: string, appearance: PetAppearanceConfig) => void;
  onSubmitQuickPrompt: (value: string, images?: Array<{ url: string; alt?: string }>) => Promise<void>;
}) {
  const resolvedAppearance = resolvePetAppearance(currentCompanion?.appearance);
  const currentRolePack = rolePackMeta(resolvedAppearance.rolePack);
  const currentName = currentCompanion?.petName ?? currentCompanion?.agentId ?? 'OpenClaw';

  const [activeTab, setActiveTab] = useState<'chat' | 'pets' | 'settings'>('chat');

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
            <div className="panel-header">
              <div className="window-bar">
                <div className="dots" aria-hidden="true">
                  <button 
                    type="button" 
                    className="dot dot--close" 
                    aria-label="Close" 
                    onClick={() => void getHabitatDesktopApi()?.togglePanel()} 
                  />
                  <button 
                    type="button" 
                    className="dot dot--minimize" 
                    aria-label="Minimize" 
                    onClick={() => void getHabitatDesktopApi()?.togglePanel()} 
                  />
                </div>
                <div className="window-bar__actions">
                  <ConnectionBadge status={connectionStatus} />
                </div>
              </div>

              <nav className="panel-tabs">
                <button 
                  className={`panel-tab ${activeTab === 'chat' ? 'panel-tab--active' : ''}`}
                  onClick={() => setActiveTab('chat')}
                >
                  💬 Chat
                </button>
                <button 
                  className={`panel-tab ${activeTab === 'pets' ? 'panel-tab--active' : ''}`}
                  onClick={() => setActiveTab('pets')}
                >
                  🐾 Gallery
                </button>
                <button 
                  className={`panel-tab ${activeTab === 'settings' ? 'panel-tab--active' : ''}`}
                  onClick={() => setActiveTab('settings')}
                >
                  ⚙️ Setup
                </button>
              </nav>
            </div>

            <div className="panel-content">
              {activeTab === 'chat' && (
                currentCompanion ? (
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
                    <div className="app-shell__empty-state-icon" aria-hidden="true">🦞</div>
                    <strong>No companion on stage</strong>
                    <p>Pick a companion from the Gallery, or connect a gateway first.</p>
                    <div className="app-shell__empty-state-actions">
                      <button
                        type="button"
                        className="app-shell__empty-state-action"
                        onClick={() => setActiveTab('pets')}
                      >
                        Browse Gallery
                      </button>
                      <button
                        type="button"
                        className="app-shell__empty-state-action app-shell__empty-state-action--secondary"
                        onClick={() => setActiveTab('settings')}
                      >
                        Connect gateway
                      </button>
                    </div>
                  </div>
                )
              )}

              {activeTab === 'pets' && (
                <GalleryPanel
                  agentRows={agentRows}
                  onUpdateAppearance={onUpdateAppearance}
                  onPinnedAgentChange={onPinnedAgentChange}
                  onCompanionSelect={(agentId, petId) => {
                    onPinnedAgentChange(agentId);
                    onSelectPet(petId);
                  }}
                  pinnedAgentId={pinnedAgentId}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsPanel
                  connectionStatus={connectionStatus}
                  activeProfileId={activeProfileId}
                  gatewayProfiles={gatewayProfiles}
                  onSaveProfile={onSaveProfile}
                  onDeleteProfile={onDeleteProfile}
                />
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

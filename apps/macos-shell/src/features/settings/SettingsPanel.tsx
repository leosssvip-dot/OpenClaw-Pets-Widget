import type { GatewayProfile } from '@openclaw-habitat/bridge';
import type { ConnectionStatus } from '../connection/ConnectionBadge';
import { ConnectionBadge } from '../connection/ConnectionBadge';
import { GatewayProfiles } from './GatewayProfiles';
import type { ConnectionInput } from './SshConnectionForm';

export interface SettingsPanelProps {
  connectionStatus: ConnectionStatus;
  activeProfileId: string | null;
  gatewayProfiles: GatewayProfile[];
  onSaveProfile: (input: ConnectionInput, profileId?: string) => Promise<void>;
  onDeleteProfile: (profileId: string) => void;
}

export function SettingsPanel({
  connectionStatus,
  activeProfileId,
  gatewayProfiles,
  onSaveProfile,
  onDeleteProfile
}: SettingsPanelProps) {
  return (
    <section className="panel-settings" aria-label="Panel settings">
      <header className="settings-drawer__header">
        <div className="settings-drawer__masthead">
          <div className="settings-drawer__heading-copy">
            <h3 className="settings-drawer__title">System Setup</h3>
            <span className="settings-drawer__subtitle">
              Gateway Connections
            </span>
          </div>
          <ConnectionBadge status={connectionStatus} />
        </div>
      </header>
      <div className="settings-drawer__body">
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
    </section>
  );
}

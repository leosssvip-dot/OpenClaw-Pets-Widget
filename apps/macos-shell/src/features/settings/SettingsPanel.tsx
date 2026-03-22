import type { GatewayProfile } from '@openclaw-habitat/bridge';
import type { ConnectionStatus } from '../connection/ConnectionBadge';
import { ConnectionBadge } from '../connection/ConnectionBadge';
import { GatewayProfiles } from './GatewayProfiles';
import type { ConnectionInput } from './SshConnectionForm';
import { useT } from '../../i18n';
import type { Locale } from '../../i18n';
import { useSettingsStore } from './settings-store';

export interface SettingsPanelProps {
  connectionStatus: ConnectionStatus;
  activeProfileId: string | null;
  gatewayProfiles: GatewayProfile[];
  onSaveProfile: (input: ConnectionInput, profileId?: string) => Promise<void>;
  onConnectProfile: (profileId: string) => void;
  onDeleteProfile: (profileId: string) => void;
}

export function SettingsPanel({
  connectionStatus,
  activeProfileId,
  gatewayProfiles,
  onSaveProfile,
  onConnectProfile,
  onDeleteProfile
}: SettingsPanelProps) {
  const t = useT();
  const language = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);

  return (
    <section className="panel-settings" aria-label="Panel settings">
      <header className="settings-drawer__header">
        <div className="settings-drawer__masthead">
          <div className="settings-drawer__heading-copy">
            <h3 className="settings-drawer__title">{t('settings.title')}</h3>
            <span className="settings-drawer__subtitle">
              {t('settings.subtitle')}
            </span>
          </div>
          <ConnectionBadge status={connectionStatus} />
        </div>
      </header>
      <div className="settings-drawer__body">
        <div className="settings-language-row">
          <span className="settings-language-row__label">🌐 {t('settings.language')}</span>
          <select
            className="settings-language-row__select"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Locale)}
          >
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
        </div>
        <GatewayProfiles
          profiles={gatewayProfiles}
          activeProfileId={activeProfileId}
          isConnecting={
            connectionStatus === 'connecting' || connectionStatus === 'reconnecting'
          }
          onSaveProfile={onSaveProfile}
          onConnectProfile={onConnectProfile}
          onDeleteProfile={onDeleteProfile}
        />
      </div>
    </section>
  );
}

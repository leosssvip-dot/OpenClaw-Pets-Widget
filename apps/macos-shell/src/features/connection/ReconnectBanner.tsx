import { useT } from '../../i18n';
import type { ConnectionStatus } from './ConnectionBadge';

export function ReconnectBanner({
  status,
  errorMessage,
  hasActiveProfile,
  onReconnect
}: {
  status: ConnectionStatus;
  errorMessage?: string | null;
  hasActiveProfile: boolean;
  onReconnect: () => void;
}) {
  const t = useT();

  if (status !== 'reconnecting' && status !== 'offline' && status !== 'auth-expired') {
    return null;
  }

  if (status === 'offline' && !errorMessage && !hasActiveProfile) {
    return null;
  }

  return (
    <div className="reconnect-banner">
      <span>
        {status === 'auth-expired'
          ? t('reconnect.authExpired')
          : errorMessage ?? t('reconnect.offline')}
      </span>
      <button type="button" onClick={onReconnect}>
        {t('reconnect.retry')}
      </button>
    </div>
  );
}

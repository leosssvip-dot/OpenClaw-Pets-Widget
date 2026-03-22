import { useT } from '../../i18n';

export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'offline'
  | 'auth-expired';

const labelKeys: Record<ConnectionStatus, string> = {
  connecting: 'status.connecting',
  connected: 'status.connected',
  reconnecting: 'status.reconnecting',
  offline: 'status.offline',
  'auth-expired': 'status.authExpired'
};

export function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  const t = useT();
  return (
    <span className={`connection-badge connection-badge--${status}`}>
      {t(labelKeys[status])}
    </span>
  );
}

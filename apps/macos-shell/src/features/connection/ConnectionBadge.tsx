export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'offline'
  | 'auth-expired';

const labels: Record<ConnectionStatus, string> = {
  connecting: 'Connecting',
  connected: 'Connected',
  reconnecting: 'Reconnecting',
  offline: 'Offline',
  'auth-expired': 'Auth expired'
};

export function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  return (
    <span className={`connection-badge connection-badge--${status}`}>
      {labels[status]}
    </span>
  );
}

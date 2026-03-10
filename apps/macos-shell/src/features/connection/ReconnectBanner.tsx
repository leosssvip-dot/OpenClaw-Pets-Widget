import type { ConnectionStatus } from './ConnectionBadge';

export function ReconnectBanner({
  status,
  onReconnect
}: {
  status: ConnectionStatus;
  onReconnect: () => void;
}) {
  if (status !== 'reconnecting' && status !== 'offline' && status !== 'auth-expired') {
    return null;
  }

  return (
    <div className="reconnect-banner">
      <span>
        {status === 'auth-expired'
          ? 'Gateway authentication expired. Reconnect with fresh credentials.'
          : 'Gateway link is unavailable. Retry to restore live agent updates.'}
      </span>
      <button type="button" onClick={onReconnect}>
        Retry
      </button>
    </div>
  );
}

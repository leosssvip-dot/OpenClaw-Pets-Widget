import { useState } from 'react';
import { useT } from '../../i18n';

export interface SshConnectionInput {
  host: string;
  username: string;
  sshPort: number;
  password?: string;
  remoteGatewayPort: number;
  gatewayToken?: string;
}

export type SshConnectionDraft = Omit<SshConnectionInput, 'password'>;

export interface LocalConnectionInput {
  gatewayPort: number;
  gatewayToken?: string;
}

export type ConnectionInput =
  | ({ transport: 'ssh' } & SshConnectionInput)
  | ({ transport: 'local' } & LocalConnectionInput);

export function SshConnectionForm({
  onSubmit,
  initialValues,
  submitLabel,
  disabled
}: {
  onSubmit: (input: SshConnectionInput) => Promise<void> | void;
  initialValues?: Partial<SshConnectionDraft>;
  submitLabel?: string;
  disabled?: boolean;
}) {
  const t = useT();
  const [host, setHost] = useState(initialValues?.host ?? '');
  const [username, setUsername] = useState(initialValues?.username ?? '');
  const [sshPort, setSshPort] = useState(String(initialValues?.sshPort ?? 22));
  const [password, setPassword] = useState('');
  const [remoteGatewayPort, setRemoteGatewayPort] = useState(
    String(initialValues?.remoteGatewayPort ?? 18789)
  );
  const [gatewayToken, setGatewayToken] = useState(initialValues?.gatewayToken ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveSubmitLabel = submitLabel ?? t('gateway.connect');
  const isValid = host.trim() !== '' && username.trim() !== '';
  const isBusy = disabled || submitting;

  return (
    <form
      className="gateway-profiles__form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!isValid || isBusy) return;
        setError(null);
        setSubmitting(true);
        try {
          await onSubmit({
            host,
            username,
            sshPort: Number(sshPort || '22'),
            password: password || undefined,
            remoteGatewayPort: Number(remoteGatewayPort || '18789'),
            gatewayToken: gatewayToken.trim() || undefined
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <label>
        {t('ssh.remoteHost')}
        <input
          aria-label={t('ssh.remoteHost')}
          value={host}
          onChange={(event) => setHost(event.target.value)}
          placeholder="gateway.example.com"
          required
          disabled={isBusy}
        />
      </label>
      <label>
        {t('ssh.sshUser')}
        <input
          aria-label={t('ssh.sshUser')}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="users"
          required
          disabled={isBusy}
        />
      </label>
      <label>
        {t('ssh.sshPort')}
        <input
          aria-label={t('ssh.sshPort')}
          type="number"
          min="1"
          value={sshPort}
          onChange={(event) => setSshPort(event.target.value)}
          disabled={isBusy}
        />
      </label>
      <label>
        {t('ssh.sshPassword')}
        <input
          aria-label={t('ssh.sshPassword')}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          disabled={isBusy}
        />
      </label>
      <label>
        {t('ssh.gatewayPort')}
        <input
          aria-label={t('ssh.gatewayPort')}
          type="number"
          min="1"
          value={remoteGatewayPort}
          onChange={(event) => setRemoteGatewayPort(event.target.value)}
          disabled={isBusy}
        />
      </label>
      <label>
        {t('ssh.gatewayToken')}
        <input
          aria-label={t('ssh.gatewayToken')}
          type="password"
          value={gatewayToken}
          onChange={(event) => setGatewayToken(event.target.value)}
          placeholder={t('ssh.tokenAutoDetect')}
          disabled={isBusy}
        />
      </label>
      <p className="gateway-profiles__hint">
        {t('ssh.hint')}
      </p>
      {error && (
        <p className="gateway-profiles__error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={isBusy || !isValid}>
        {submitting ? t('gateway.connecting') : effectiveSubmitLabel}
      </button>
    </form>
  );
}

export function LocalConnectionForm({
  onSubmit,
  initialValues,
  submitLabel,
  disabled
}: {
  onSubmit: (input: LocalConnectionInput) => Promise<void> | void;
  initialValues?: Partial<LocalConnectionInput>;
  submitLabel?: string;
  disabled?: boolean;
}) {
  const t = useT();
  const [gatewayPort, setGatewayPort] = useState(
    String(initialValues?.gatewayPort ?? 18789)
  );
  const [gatewayToken, setGatewayToken] = useState(initialValues?.gatewayToken ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveSubmitLabel = submitLabel ?? t('gateway.connect');
  const isBusy = disabled || submitting;

  return (
    <form
      className="gateway-profiles__form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (isBusy) return;
        setError(null);
        setSubmitting(true);
        try {
          await onSubmit({
            gatewayPort: Number(gatewayPort || '18789'),
            gatewayToken: gatewayToken.trim() || undefined
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <label>
        {t('ssh.gatewayPort')}
        <input
          aria-label={t('ssh.gatewayPort')}
          type="number"
          min="1"
          value={gatewayPort}
          onChange={(event) => setGatewayPort(event.target.value)}
          disabled={isBusy}
        />
      </label>
      <label>
        {t('ssh.gatewayToken')}
        <input
          aria-label={t('ssh.gatewayToken')}
          type="password"
          value={gatewayToken}
          onChange={(event) => setGatewayToken(event.target.value)}
          placeholder="Optional"
          disabled={isBusy}
        />
      </label>
      <p className="gateway-profiles__hint">
        {t('local.hint', { port: gatewayPort || '18789' })}
      </p>
      {error && (
        <p className="gateway-profiles__error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={isBusy}>
        {submitting ? t('gateway.connecting') : effectiveSubmitLabel}
      </button>
    </form>
  );
}

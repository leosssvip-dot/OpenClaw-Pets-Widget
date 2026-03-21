import { useState } from 'react';

export interface SshConnectionInput {
  host: string;
  username: string;
  sshPort: number;
  password?: string;
  remoteGatewayPort: number;
  gatewayToken: string;
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
  submitLabel = 'Connect',
  disabled
}: {
  onSubmit: (input: SshConnectionInput) => Promise<void> | void;
  initialValues?: Partial<SshConnectionDraft>;
  submitLabel?: string;
  disabled?: boolean;
}) {
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

  const isValid = host.trim() !== '' && username.trim() !== '' && gatewayToken.trim() !== '';
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
            gatewayToken
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <label>
        Remote Host
        <input
          aria-label="Remote Host"
          value={host}
          onChange={(event) => setHost(event.target.value)}
          placeholder="gateway.example.com"
          required
          disabled={isBusy}
        />
      </label>
      <label>
        SSH User
        <input
          aria-label="SSH User"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="users"
          required
          disabled={isBusy}
        />
      </label>
      <label>
        SSH Port
        <input
          aria-label="SSH Port"
          type="number"
          min="1"
          value={sshPort}
          onChange={(event) => setSshPort(event.target.value)}
          disabled={isBusy}
        />
      </label>
      <label>
        SSH Password
        <input
          aria-label="SSH Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          disabled={isBusy}
        />
      </label>
      <label>
        Gateway Port
        <input
          aria-label="Gateway Port"
          type="number"
          min="1"
          value={remoteGatewayPort}
          onChange={(event) => setRemoteGatewayPort(event.target.value)}
          disabled={isBusy}
        />
      </label>
      <label>
        Gateway Token
        <input
          aria-label="Gateway Token"
          type="password"
          value={gatewayToken}
          onChange={(event) => setGatewayToken(event.target.value)}
          required
          disabled={isBusy}
        />
      </label>
      <p className="gateway-profiles__hint">
        Uses your system SSH config and loaded keys.
        Password is securely cached for reconnects.
      </p>
      {error && (
        <p className="gateway-profiles__error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={isBusy || !isValid}>
        {submitting ? 'Connecting...' : submitLabel}
      </button>
    </form>
  );
}

export function LocalConnectionForm({
  onSubmit,
  initialValues,
  submitLabel = 'Connect',
  disabled
}: {
  onSubmit: (input: LocalConnectionInput) => Promise<void> | void;
  initialValues?: Partial<LocalConnectionInput>;
  submitLabel?: string;
  disabled?: boolean;
}) {
  const [gatewayPort, setGatewayPort] = useState(
    String(initialValues?.gatewayPort ?? 18789)
  );
  const [gatewayToken, setGatewayToken] = useState(initialValues?.gatewayToken ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        Gateway Port
        <input
          aria-label="Gateway Port"
          type="number"
          min="1"
          value={gatewayPort}
          onChange={(event) => setGatewayPort(event.target.value)}
          disabled={isBusy}
        />
      </label>
      <label>
        Gateway Token
        <input
          aria-label="Gateway Token"
          type="password"
          value={gatewayToken}
          onChange={(event) => setGatewayToken(event.target.value)}
          placeholder="Optional"
          disabled={isBusy}
        />
      </label>
      <p className="gateway-profiles__hint">
        Connects directly to an OpenClaw gateway running on this machine at ws://127.0.0.1:{gatewayPort || '18789'}.
      </p>
      {error && (
        <p className="gateway-profiles__error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={isBusy}>
        {submitting ? 'Connecting...' : submitLabel}
      </button>
    </form>
  );
}

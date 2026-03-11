import { useState } from 'react';

export interface SshConnectionInput {
  host: string;
  username: string;
  sshPort: number;
  identityFile?: string;
  password?: string;
  remoteGatewayPort: number;
  gatewayToken: string;
}

export type SshConnectionDraft = Omit<SshConnectionInput, 'password'>;

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
  const [identityFile, setIdentityFile] = useState(initialValues?.identityFile ?? '');
  const [password, setPassword] = useState('');
  const [remoteGatewayPort, setRemoteGatewayPort] = useState(
    String(initialValues?.remoteGatewayPort ?? 18789)
  );
  const [gatewayToken, setGatewayToken] = useState(initialValues?.gatewayToken ?? '');

  return (
    <form
      className="gateway-profiles__form"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit({
          host,
          username,
          sshPort: Number(sshPort || '22'),
          identityFile: identityFile.trim() || undefined,
          password: password || undefined,
          remoteGatewayPort: Number(remoteGatewayPort || '18789'),
          gatewayToken
        });
      }}
    >
      <label>
        Remote Host
        <input
          aria-label="Remote Host"
          value={host}
          onChange={(event) => setHost(event.target.value)}
          placeholder="studio.internal"
          required
        />
      </label>
      <label>
        SSH User
        <input
          aria-label="SSH User"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="chenyang"
          required
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
        />
      </label>
      <label>
        Identity File
        <input
          aria-label="Identity File"
          value={identityFile}
          onChange={(event) => setIdentityFile(event.target.value)}
          placeholder="Leave blank to use ~/.ssh/config or ssh-agent"
        />
      </label>
      <label>
        SSH Password
        <input
          aria-label="SSH Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Optional if your SSH key already works"
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
        />
      </label>
      <p className="gateway-profiles__hint">
        Leave Identity File blank to reuse your system SSH config and loaded keys.
        SSH Password is securely cached for reconnects.
      </p>
      <button type="submit" disabled={disabled}>
        {disabled ? 'Connecting...' : submitLabel}
      </button>
    </form>
  );
}

import { useState } from 'react';

export interface SshConnectionInput {
  host: string;
  username: string;
  sshPort: number;
  identityFile?: string;
  remoteGatewayPort: number;
  gatewayToken: string;
}

export function SshConnectionForm({
  onSubmit
}: {
  onSubmit: (input: SshConnectionInput) => Promise<void> | void;
}) {
  const [host, setHost] = useState('');
  const [username, setUsername] = useState('');
  const [sshPort, setSshPort] = useState('22');
  const [identityFile, setIdentityFile] = useState('');
  const [remoteGatewayPort, setRemoteGatewayPort] = useState('18789');
  const [gatewayToken, setGatewayToken] = useState('');

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
      </p>
      <button type="submit">Connect</button>
    </form>
  );
}

export interface SshTunnelCommandInput {
  host: string;
  username: string;
  sshPort: number;
  identityFile?: string;
  localPort: number;
  remotePort: number;
}

export function buildSshTunnelCommand(input: SshTunnelCommandInput) {
  const args = [
    'ssh',
    '-N',
    '-o',
    'ExitOnForwardFailure=yes',
    '-o',
    'StrictHostKeyChecking=accept-new',
    '-o',
    'ServerAliveInterval=15',
    '-p',
    String(input.sshPort),
    '-L',
    `127.0.0.1:${input.localPort}:127.0.0.1:${input.remotePort}`
  ];

  if (input.identityFile) {
    args.push('-i', input.identityFile);
  }

  args.push(`${input.username}@${input.host}`);

  return args;
}

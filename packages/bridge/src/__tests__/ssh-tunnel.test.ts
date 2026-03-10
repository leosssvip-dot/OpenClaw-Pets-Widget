import { describe, expect, it } from 'vitest';
import { buildSshTunnelCommand } from '../ssh-tunnel';

describe('buildSshTunnelCommand', () => {
  it('forwards a remote gateway to local loopback', () => {
    expect(
      buildSshTunnelCommand({
        host: 'studio.internal',
        username: 'chenyang',
        sshPort: 22,
        identityFile: '~/.ssh/id_ed25519',
        localPort: 18789,
        remotePort: 18789
      })
    ).toEqual([
      'ssh',
      '-N',
      '-p',
      '22',
      '-L',
      '18789:127.0.0.1:18789',
      '-i',
      '~/.ssh/id_ed25519',
      'chenyang@studio.internal'
    ]);
  });

  it('omits the identity flag when relying on system ssh config', () => {
    expect(
      buildSshTunnelCommand({
        host: 'studio.internal',
        username: 'chenyang',
        sshPort: 2222,
        localPort: 19001,
        remotePort: 18789
      })
    ).toEqual([
      'ssh',
      '-N',
      '-p',
      '2222',
      '-L',
      '19001:127.0.0.1:18789',
      'chenyang@studio.internal'
    ]);
  });
});

import { describe, expect, it } from 'vitest';
import { gatewayProfileSchema } from '../profile-schema';

describe('gatewayProfileSchema', () => {
  it('accepts an ssh profile', () => {
    expect(
      gatewayProfileSchema.parse({
        id: 'devbox',
        label: 'My Remote OpenClaw',
        transport: 'ssh',
        host: 'example.internal',
        username: 'me',
        sshPort: 22,
        remoteGatewayPort: 18789,
        gatewayToken: 'secret',
        identityFile: '~/.ssh/id_ed25519'
      })
    ).toMatchObject({
      transport: 'ssh',
      sshPort: 22,
      remoteGatewayPort: 18789,
      gatewayToken: 'secret'
    });
  });
});

import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { buildExpectScript, SshTunnelRuntime } from '../ssh-runtime';

describe('buildExpectScript', () => {
  it('escapes Tcl special characters in the password', () => {
    const script = buildExpectScript('p$a[ss]w"ord', ['ssh', '-N', 'user@host']);

    expect(script).toContain('send -- "p\\$a\\[ss\\]w\\"ord\\r"');
  });

  it('quotes each SSH argument for the spawn line', () => {
    const script = buildExpectScript('hunter2', [
      'ssh',
      '-N',
      '-o',
      'BatchMode=no',
      'user@host'
    ]);

    expect(script).toContain('spawn "ssh" "-N" "-o" "BatchMode=no" "user@host"');
  });
});

describe('SshTunnelRuntime', () => {
  it('uses expect for password-based SSH tunnels', async () => {
    class FakeChildProcess extends EventEmitter {
      stderr = new EventEmitter();

      kill = vi.fn();
    }

    const child = new FakeChildProcess();
    const spawnProcess = vi.fn(() => child as any);
    const runtime = new SshTunnelRuntime(
      spawnProcess as any,
      async () => 51336,
      async () => undefined
    );

    await runtime.prepareConnection(
      {
        id: 'profile-1',
        label: 'Studio',
        transport: 'ssh',
        host: '10.0.0.52',
        username: 'chenyang',
        sshPort: 22,
        remoteGatewayPort: 18789,
        gatewayToken: 'secret-token'
      },
      {
        password: 'hunter2'
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const call = (spawnProcess.mock.calls as any[])[0] as [string, string[]];
    const script = call[1][1];
    expect(call[0]).toBe('expect');
    expect(script).toContain('PubkeyAuthentication=no');
    expect(script).toContain('send -- "hunter2\\r"');
  });

  it('includes stderr context when the tunnel never starts listening', async () => {
    class FakeChildProcess extends EventEmitter {
      stderr = new EventEmitter();

      kill = vi.fn();
    }

    const child = new FakeChildProcess();
    const spawnProcess = vi.fn(() => child as any);
    const runtime = new SshTunnelRuntime(
      spawnProcess as any,
      async () => 54070,
      async () => {
        child.stderr.emit('data', 'SSH authentication failed (wrong password?)\n');
        throw new Error('SSH tunnel did not open local port 54070');
      }
    );

    await expect(
      runtime.prepareConnection(
        {
          id: 'profile-3',
          label: 'Studio',
          transport: 'ssh',
          host: '10.0.0.52',
          username: 'chenyang',
          sshPort: 22,
          remoteGatewayPort: 18789,
          gatewayToken: 'secret-token'
        },
        {
          password: 'hunter2'
        }
      )
    ).rejects.toThrow(/SSH authentication failed/);
  });

  it('disables interactive SSH prompts when no session password is available', async () => {
    class FakeChildProcess extends EventEmitter {
      stderr = new EventEmitter();

      kill = vi.fn();
    }

    const child = new FakeChildProcess();
    const spawnProcess = vi.fn(() => child as any);
    const runtime = new SshTunnelRuntime(
      spawnProcess as any,
      async () => 51455,
      async () => undefined
    );

    await runtime.prepareConnection({
      id: 'profile-2',
      label: 'Studio',
      transport: 'ssh',
      host: '10.0.0.52',
      username: 'chenyang',
      sshPort: 22,
      remoteGatewayPort: 18789,
      gatewayToken: 'secret-token'
    });

    expect(spawnProcess).toHaveBeenCalledWith(
      'ssh',
      expect.arrayContaining(['-o', 'BatchMode=yes']),
      expect.objectContaining({
        stdio: ['ignore', 'ignore', 'pipe']
      })
    );
  });

  it('appends a hint when Permission denied occurs without a password', async () => {
    class FakeChildProcess extends EventEmitter {
      stderr = new EventEmitter();

      kill = vi.fn();
    }

    const child = new FakeChildProcess();
    const spawnProcess = vi.fn(() => child as any);
    const runtime = new SshTunnelRuntime(
      spawnProcess as any,
      async () => 54071,
      async () => {
        child.stderr.emit('data', 'Permission denied (publickey).\n');
        throw new Error('SSH tunnel did not open local port 54071');
      }
    );

    await expect(
      runtime.prepareConnection({
        id: 'profile-4',
        label: 'Studio',
        transport: 'ssh',
        host: '10.0.0.52',
        username: 'chenyang',
        sshPort: 22,
        remoteGatewayPort: 18789,
        gatewayToken: 'secret-token'
      })
    ).rejects.toThrow(/re-enter your password/);
  });
});

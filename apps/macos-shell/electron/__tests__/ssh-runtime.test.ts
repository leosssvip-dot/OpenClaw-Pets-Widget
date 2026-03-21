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
      host: '192.0.2.10',
      username: 'testuser',
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
        host: '192.0.2.10',
        username: 'testuser',
        sshPort: 22,
        remoteGatewayPort: 18789,
        gatewayToken: 'secret-token'
      })
    ).rejects.toThrow(/re-enter your password/);
  });

  it('reports a runtime error when the tunnel exits after becoming ready', async () => {
    class FakeChildProcess extends EventEmitter {
      stderr = new EventEmitter();

      kill = vi.fn();
    }

    const child = new FakeChildProcess();
    const onUnexpectedTunnelExit = vi.fn();
    const runtime = new SshTunnelRuntime(
      vi.fn(() => child as any) as any,
      async () => 54072,
      async () => undefined,
      onUnexpectedTunnelExit
    );

    await runtime.prepareConnection({
      id: 'profile-5',
      label: 'Studio',
      transport: 'ssh',
      host: '192.0.2.10',
      username: 'testuser',
      sshPort: 22,
      remoteGatewayPort: 18789,
      gatewayToken: 'secret-token'
    });

    child.stderr.emit('data', 'ssh: connect to host 192.0.2.10 port 22: Connection reset\n');
    child.emit('exit', 255, null);

    expect(onUnexpectedTunnelExit).toHaveBeenCalledWith({
      profileId: 'profile-5',
      errorMessage: 'ssh: connect to host 192.0.2.10 port 22: Connection reset'
    });
  });
});

import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';
import { Client as SshClient } from 'ssh2';
import {
  buildSshTunnelCommand,
  type GatewayProfile,
  type PreparedGatewayConnection
} from '@openclaw-habitat/bridge';
import type { GatewaySessionAuth } from '../src/runtime/gateway-session-auth';

type SshGatewayProfile = Extract<GatewayProfile, { transport: 'ssh' }>;

interface ActiveTunnel {
  /** Cleanup function — kills the child process or closes the ssh2 client */
  teardown: () => void;
  localPort: number;
  profileId: string;
  intentionalShutdown: boolean;
  ready: boolean;
}

function buildLoopbackUrl(port: number) {
  return `ws://127.0.0.1:${port}`;
}

async function findOpenPort() {
  return new Promise<number>((resolve, reject) => {
    const server = net.createServer();

    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();

      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Failed to reserve local SSH port'));
        return;
      }

      const { port } = address;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(port);
      });
    });
  });
}

async function waitForPort(port: number, timeoutMs = 8_000) {
  const startedAt = Date.now();

  for (;;) {
    const isReady = await new Promise<boolean>((resolve) => {
      const socket = net.connect({ host: '127.0.0.1', port });

      socket.once('connect', () => {
        socket.end();
        resolve(true);
      });
      socket.once('error', () => {
        socket.destroy();
        resolve(false);
      });
    });

    if (isReady) {
      return;
    }

    if (Date.now() - startedAt > timeoutMs) {
      throw new Error(`SSH tunnel did not open local port ${port}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

// ---------------------------------------------------------------------------
// ssh2-based tunnel (pure JS, cross-platform, used for password auth)
// ---------------------------------------------------------------------------

function createSsh2Tunnel(options: {
  host: string;
  port: number;
  username: string;
  password: string;
  localPort: number;
  remotePort: number;
  keepAliveInterval?: number;
}): { client: SshClient; server: net.Server; ready: Promise<void> } {
  const client = new SshClient();
  const activeSockets = new Set<net.Socket>();

  const server = net.createServer((sock) => {
    activeSockets.add(sock);
    sock.once('close', () => activeSockets.delete(sock));

    client.forwardOut(
      '127.0.0.1',
      options.localPort,
      '127.0.0.1',
      options.remotePort,
      (err, stream) => {
        if (err) {
          sock.destroy();
          return;
        }

        sock.pipe(stream).pipe(sock);
        stream.once('close', () => sock.destroy());
        sock.once('close', () => stream.destroy());
      }
    );
  });

  const ready = new Promise<void>((resolve, reject) => {
    client.once('error', (err) => {
      server.close();
      reject(err);
    });

    client.once('ready', () => {
      server.listen(options.localPort, '127.0.0.1', () => {
        resolve();
      });

      server.once('error', (err) => {
        client.end();
        reject(err);
      });
    });

    client.connect({
      host: options.host,
      port: options.port,
      username: options.username,
      password: options.password,
      keepaliveInterval: options.keepAliveInterval ?? 15_000,
      readyTimeout: 30_000
    });
  });

  return { client, server, ready };
}

// ---------------------------------------------------------------------------
// Backward-compatible expect helpers (kept for macOS/Linux if ever needed)
// ---------------------------------------------------------------------------

/**
 * Escape a string for use inside a Tcl double-quoted string.
 * Tcl special chars inside "": $ [ ] \ "
 */
function tclEscape(str: string) {
  return str.replace(/[\\\$\[\]"]/g, '\\$&');
}

export function buildExpectScript(password: string, sshArgs: string[]) {
  const escapedPassword = tclEscape(password);
  const quotedArgs = sshArgs.map((a) => `"${tclEscape(a)}"`).join(' ');

  return `log_user 0
set timeout 30
spawn ${quotedArgs}
expect {
  -re {[Pp]assword} {
    send -- "${escapedPassword}\\r"
  }
  -re {ermission denied} {
    puts stderr "Permission denied"
    exit 1
  }
  timeout {
    puts stderr "SSH password prompt timed out"
    exit 1
  }
  eof {
    puts stderr "SSH connection closed before authentication"
    exit 1
  }
}
set timeout 5
expect {
  -re {ermission denied} {
    puts stderr "SSH authentication failed (wrong password?)"
    exit 1
  }
  eof {
    lassign [wait] pid spawnid os_error value
    if {$value != 0} {
      puts stderr "SSH exited with code $value"
    }
    exit $value
  }
  timeout {}
}
set timeout -1
expect eof
lassign [wait] pid spawnid os_error value
exit $value
`;
}

// ---------------------------------------------------------------------------
// SshTunnelRuntime
// ---------------------------------------------------------------------------

export class SshTunnelRuntime {
  private activeTunnel: ActiveTunnel | null = null;

  constructor(
    private readonly spawnProcess: typeof spawn = spawn,
    private readonly reservePort: () => Promise<number> = findOpenPort,
    private readonly waitForLocalPort: (port: number) => Promise<void> = waitForPort,
    private readonly onUnexpectedTunnelExit: (
      payload: { profileId: string; errorMessage: string }
    ) => void = () => undefined
  ) {}

  async prepareConnection(
    profile: SshGatewayProfile,
    sessionAuth?: GatewaySessionAuth
  ): Promise<PreparedGatewayConnection> {
    if (this.activeTunnel?.profileId === profile.id) {
      return {
        url: buildLoopbackUrl(this.activeTunnel.localPort),
        authToken: profile.gatewayToken
      };
    }

    await this.disconnect();

    const localPort = await this.reservePort();
    const usePassword = Boolean(sessionAuth?.password) && !profile.identityFile;

    if (usePassword) {
      return this.connectViaSsh2(profile, sessionAuth!.password!, localPort);
    }

    return this.connectViaNativeSsh(profile, localPort);
  }

  /**
   * Pure-JS SSH tunnel via ssh2 — works on Windows, macOS, and Linux.
   * Used when password authentication is required.
   */
  private async connectViaSsh2(
    profile: SshGatewayProfile,
    password: string,
    localPort: number
  ): Promise<PreparedGatewayConnection> {
    const { client, server, ready } = createSsh2Tunnel({
      host: profile.host,
      port: profile.sshPort,
      username: profile.username,
      password,
      localPort,
      remotePort: profile.remoteGatewayPort
    });

    const tunnel: ActiveTunnel = {
      teardown: () => {
        server.close();
        client.end();
      },
      localPort,
      profileId: profile.id,
      intentionalShutdown: false,
      ready: false
    };

    client.once('close', () => {
      if (this.activeTunnel === tunnel) {
        this.activeTunnel = null;
      }
      if (tunnel.ready && !tunnel.intentionalShutdown) {
        this.onUnexpectedTunnelExit({
          profileId: tunnel.profileId,
          errorMessage: 'SSH tunnel connection closed unexpectedly'
        });
      }
    });

    try {
      await ready;
    } catch (error) {
      server.close();
      client.end();
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(
        msg.includes('Authentication')
          ? 'SSH authentication failed (wrong password?)'
          : msg
      );
    }

    tunnel.ready = true;
    this.activeTunnel = tunnel;

    return {
      url: buildLoopbackUrl(localPort),
      authToken: profile.gatewayToken
    };
  }

  /**
   * Native SSH command tunnel — used for key-based auth (no password needed).
   * Falls back to this on all platforms when an identity file is configured
   * or no password is provided.
   */
  private async connectViaNativeSsh(
    profile: SshGatewayProfile,
    localPort: number
  ): Promise<PreparedGatewayConnection> {
    const sshArgs = buildSshTunnelCommand({
      host: profile.host,
      username: profile.username,
      sshPort: profile.sshPort,
      identityFile: profile.identityFile,
      localPort,
      remotePort: profile.remoteGatewayPort
    });

    const [command, ...args] = sshArgs;
    const child = this.spawnProcess(command, ['-o', 'BatchMode=yes', ...args], {
      stdio: ['ignore', 'ignore', 'pipe']
    });

    let stderrOutput = '';
    const tunnel: ActiveTunnel = {
      teardown: () => {
        child.kill('SIGTERM');
      },
      localPort,
      profileId: profile.id,
      intentionalShutdown: false,
      ready: false
    };

    child.stderr?.on('data', (chunk) => {
      stderrOutput += String(chunk);
    });
    child.on('exit', (code, signal) => {
      if (this.activeTunnel === tunnel) {
        this.activeTunnel = null;
      }
      if (tunnel.ready && !tunnel.intentionalShutdown) {
        this.onUnexpectedTunnelExit({
          profileId: tunnel.profileId,
          errorMessage:
            stderrOutput.trim() ||
            `SSH tunnel exited after it became ready (${code ?? signal ?? 'unknown'})`
        });
      }
    });

    try {
      await Promise.race([
        this.waitForLocalPort(localPort),
        once(child, 'exit').then(([code, signal]) => {
          throw new Error(
            stderrOutput.trim() ||
              `SSH tunnel exited before it became ready (${code ?? signal ?? 'unknown'})`
          );
        })
      ]);
    } catch (error) {
      child.kill('SIGTERM');
      const raw = stderrOutput.trim() || (error instanceof Error ? error.message : String(error));
      const hint = raw.includes('Permission denied')
        ? '\n(No SSH password was provided — edit the gateway profile and re-enter your password)'
        : '';
      throw new Error(raw + hint);
    }

    tunnel.ready = true;
    this.activeTunnel = tunnel;

    return {
      url: buildLoopbackUrl(localPort),
      authToken: profile.gatewayToken
    };
  }

  async disconnect() {
    const tunnel = this.activeTunnel;

    if (!tunnel) {
      return;
    }

    tunnel.intentionalShutdown = true;
    this.activeTunnel = null;
    tunnel.teardown();

    // Give the process/client a moment to clean up
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

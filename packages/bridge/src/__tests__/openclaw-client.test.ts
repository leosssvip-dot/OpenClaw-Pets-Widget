import { describe, expect, it } from 'vitest';
import { OpenClawClient } from '../openclaw-client';
import type { GatewayProfile } from '../profile-schema';

class FakeSocket {
  sent: string[] = [];
  private listeners = new Map<string, Set<(event: any) => void>>();

  addEventListener(type: string, listener: (event: any) => void) {
    const entries = this.listeners.get(type) ?? new Set();
    entries.add(listener);
    this.listeners.set(type, entries);
  }

  removeEventListener(type: string, listener: (event: any) => void) {
    this.listeners.get(type)?.delete(listener);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.emit('close', {});
  }

  emit(type: string, event: any = {}) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

function createProfile(): GatewayProfile {
  return {
    id: 'profile-1',
    label: 'Studio',
    transport: 'tailnet',
    baseUrl: 'ws://127.0.0.1:18789',
    token: 'secret-token'
  };
}

describe('OpenClawClient', () => {
  it('completes challenge-response handshake', async () => {
    const socket = new FakeSocket();
    const client = new OpenClawClient(
      (profileId) => (profileId === 'profile-1' ? createProfile() : undefined),
      () => socket as unknown as WebSocket,
      async () => undefined,
      async () => undefined,
      {
        openTimeoutMs: 100,
        handshakeTimeoutMs: 100
      }
    );

    const connectPromise = client.connect('profile-1');

    await new Promise((resolve) => setTimeout(resolve, 0));
    socket.emit('open');

    await new Promise((resolve) => setTimeout(resolve, 0));
    socket.emit('message', {
      data: JSON.stringify({
        type: 'event',
        event: 'connect.challenge',
        payload: { nonce: 'abc123' }
      })
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(socket.sent).toHaveLength(1);
    const sentFrame = JSON.parse(socket.sent[0]);
    expect(sentFrame.type).toBe('req');
    expect(sentFrame.method).toBe('connect');
    expect(sentFrame.params.client).toEqual({
      id: 'gateway-client',
      version: '1.0.0',
      platform: 'macos',
      mode: 'ui'
    });
    expect(sentFrame.params.auth).toEqual({ token: 'secret-token' });
    expect(sentFrame.params.device).toBeUndefined();

    // Server responds with res frame
    socket.emit('message', {
      data: JSON.stringify({
        type: 'res',
        id: sentFrame.id,
        ok: true,
        payload: { protocolVersion: 3 }
      })
    });

    await connectPromise;
  });

  it('rejects when handshake response has ok=false', async () => {
    const socket = new FakeSocket();
    const client = new OpenClawClient(
      (profileId) => (profileId === 'profile-1' ? createProfile() : undefined),
      () => socket as unknown as WebSocket,
      async () => undefined,
      async () => undefined,
      {
        openTimeoutMs: 100,
        handshakeTimeoutMs: 100
      }
    );

    const connectPromise = client.connect('profile-1');

    await new Promise((resolve) => setTimeout(resolve, 0));
    socket.emit('open');

    await new Promise((resolve) => setTimeout(resolve, 0));
    socket.emit('message', {
      data: JSON.stringify({
        type: 'event',
        event: 'connect.challenge',
        payload: { nonce: 'abc123' }
      })
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    const sentFrame = JSON.parse(socket.sent[0]);

    socket.emit('message', {
      data: JSON.stringify({
        type: 'res',
        id: sentFrame.id,
        ok: false,
        error: { code: 'auth-expired' }
      })
    });

    await expect(connectPromise).rejects.toThrow(/AUTH_EXPIRED/);
  });

  it('times out when the gateway never completes the handshake', async () => {
    const socket = new FakeSocket();
    const client = new OpenClawClient(
      (profileId) => (profileId === 'profile-1' ? createProfile() : undefined),
      () => socket as unknown as WebSocket,
      async () => undefined,
      async () => undefined,
      {
        openTimeoutMs: 25,
        handshakeTimeoutMs: 25
      }
    );

    const connectPromise = client.connect('profile-1');

    await new Promise((resolve) => setTimeout(resolve, 0));
    socket.emit('open');

    await expect(connectPromise).rejects.toThrow(/timed out/i);
  });

  it('normalizes the real agents.list payload into habitat agent seeds', async () => {
    const socket = new FakeSocket();
    const client = new OpenClawClient(
      (profileId) => (profileId === 'profile-1' ? createProfile() : undefined),
      () => socket as unknown as WebSocket,
      async () => undefined,
      async () => undefined,
      {
        openTimeoutMs: 100,
        handshakeTimeoutMs: 100,
        requestTimeoutMs: 100
      }
    );

    const connectPromise = client.connect('profile-1');

    await new Promise((resolve) => setTimeout(resolve, 0));
    socket.emit('open');

    await new Promise((resolve) => setTimeout(resolve, 0));
    socket.emit('message', {
      data: JSON.stringify({
        type: 'event',
        event: 'connect.challenge',
        payload: { nonce: 'abc123' }
      })
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    const connectFrame = JSON.parse(socket.sent[0]);

    socket.emit('message', {
      data: JSON.stringify({
        type: 'res',
        id: connectFrame.id,
        ok: true,
        payload: { protocolVersion: 3 }
      })
    });

    await connectPromise;

    const listAgentsPromise = client.listAgents();

    await new Promise((resolve) => setTimeout(resolve, 0));
    const listAgentsFrame = JSON.parse(socket.sent[1]);

    socket.emit('message', {
      data: JSON.stringify({
        type: 'res',
        id: listAgentsFrame.id,
        ok: true,
        payload: {
          defaultId: 'main',
          agents: [
            { id: 'main', name: 'Main Assistant' },
            { id: 'ad-expert', name: '广告投放专家' },
            { id: 'melodywish', name: 'MelodyWish 社媒运营专家' }
          ]
        }
      })
    });

    await expect(listAgentsPromise).resolves.toEqual([
      {
        id: 'main',
        agentId: 'main',
        gatewayId: 'profile-1',
        label: 'Main Assistant'
      },
      {
        id: 'ad-expert',
        agentId: 'ad-expert',
        gatewayId: 'profile-1',
        label: '广告投放专家'
      },
      {
        id: 'melodywish',
        agentId: 'melodywish',
        gatewayId: 'profile-1',
        label: 'MelodyWish 社媒运营专家'
      }
    ]);
  });
});

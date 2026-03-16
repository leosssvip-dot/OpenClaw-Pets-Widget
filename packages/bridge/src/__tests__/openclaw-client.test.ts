import { describe, expect, it, vi } from 'vitest';
import { OpenClawClient } from '../openclaw-client';
import type { GatewayProfile } from '../profile-schema';

class FakeSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 3;

  sent: string[] = [];
  readyState = FakeSocket.CONNECTING;
  OPEN = FakeSocket.OPEN;
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
    this.readyState = FakeSocket.CLOSED;
    this.emit('close', {});
  }

  emit(type: string, event: any = {}) {
    if (type === 'open') {
      this.readyState = FakeSocket.OPEN;
    }
    if (type === 'close') {
      this.readyState = FakeSocket.CLOSED;
    }
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
      id: 'openclaw-control-ui',
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

  it('publishes connection state updates and clears state on socket close', async () => {
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
    const states = new Array<string>();
    client.subscribeConnection((state) => {
      states.push(`${state.status}:${state.profileId ?? 'none'}`);
    });

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

    socket.emit('close', { code: 1006, reason: '' });

    expect(client.getConnectionState()).toMatchObject({
      status: 'disconnected',
      profileId: 'profile-1'
    });
    expect(states).toEqual([
      'disconnected:none',
      'connecting:profile-1',
      'connected:profile-1',
      'disconnected:profile-1'
    ]);
  });

  it('rejects requests when the socket has already closed', async () => {
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

    socket.emit('close', { code: 1006, reason: '' });

    await expect(
      client.sendMessage({
        petId: 'pet-1',
        content: 'hello'
      })
    ).rejects.toThrow('Bridge client is not connected');
    expect(client.getConnectionState()).toMatchObject({
      status: 'disconnected',
      profileId: 'profile-1',
      errorMessage: 'Bridge client is not connected'
    });
  });

  it('sends chat messages through chat.send with a session key and idempotency key', async () => {
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
        payload: {
          protocolVersion: 3,
          sessionDefaults: {
            mainKey: 'main'
          }
        }
      })
    });
    await connectPromise;

    const sendPromise = client.sendMessage({
      petId: 'pet-1',
      agentId: 'main',
      content: 'hello'
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    const sendFrame = JSON.parse(socket.sent[1]);

    expect(sendFrame.method).toBe('chat.send');
    expect(sendFrame.params.sessionKey).toBe('agent:main:main');
    expect(sendFrame.params.message).toBe('hello');
    expect(typeof sendFrame.params.idempotencyKey).toBe('string');
    expect(sendFrame.params.idempotencyKey.length).toBeGreaterThan(0);

    socket.emit('message', {
      data: JSON.stringify({
        type: 'res',
        id: sendFrame.id,
        ok: true,
        payload: { runId: 'run-1', status: 'started' }
      })
    });

    await expect(sendPromise).resolves.toBeUndefined();
  });

  it('forwards chat reply events through subscribe()', async () => {
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

    const listener = vi.fn();
    client.subscribe(listener);

    socket.emit('message', {
      data: JSON.stringify({
        type: 'event',
        event: 'chat',
        payload: {
          sessionKey: 'agent:main:main',
          state: 'final',
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: '当前这轮会话在跑的是 gpt-5.4。' }]
          }
        }
      })
    });

    expect(listener).toHaveBeenCalledWith({
      kind: 'chat.message',
      agentId: 'main',
      gatewayId: 'profile-1',
      petId: 'main',
      sessionKey: 'agent:main:main',
      text: '当前这轮会话在跑的是 gpt-5.4。',
      final: true
    });
  });
});

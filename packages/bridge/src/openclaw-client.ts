import type {
  AgentBindingSeed,
  BridgeClient,
  BridgeConnectionState,
  CreateTaskInput,
  HabitatEvent,
  PreparedGatewayConnection,
  SendMessageInput
} from './contracts';
import type { DeviceIdentityProvider } from './device-identity';
import type { PetStatus } from '@openclaw-habitat/domain';
import { parseOpenClawEvent } from './openclaw-event-parser';
import type { GatewayProfile } from './profile-schema';

interface GatewayFrame {
  type?: string;
  id?: string;
  method?: string;
  event?: string;
  ok?: boolean;
  payload?: unknown;
  error?: unknown;
  agentId?: string;
  gatewayId?: string;
  petId?: string;
}

function resolveEventName(frame: GatewayFrame) {
  if (frame.type === 'event' && frame.event) {
    return frame.event;
  }

  return undefined;
}

interface OpenClawClientOptions {
  openTimeoutMs?: number;
  handshakeTimeoutMs?: number;
  requestTimeoutMs?: number;
}

function isSocketOpen(socket: WebSocket | null): socket is WebSocket {
  if (!socket) {
    return false;
  }

  if (typeof socket.readyState === 'number') {
    const openState = typeof socket.OPEN === 'number' ? socket.OPEN : 1;
    return socket.readyState === openState;
  }

  return true;
}

function toMessageText(data: unknown) {
  if (typeof data === 'string') {
    return data;
  }

  if (data instanceof ArrayBuffer) {
    return new TextDecoder().decode(data);
  }

  return String(data);
}

function normalizeGatewayUrl(baseUrl: string) {
  if (baseUrl.startsWith('ws://') || baseUrl.startsWith('wss://')) {
    return baseUrl;
  }

  if (baseUrl.startsWith('http://')) {
    return `ws://${baseUrl.slice('http://'.length)}`;
  }

  if (baseUrl.startsWith('https://')) {
    return `wss://${baseUrl.slice('https://'.length)}`;
  }

  return `ws://${baseUrl}`;
}

function resolveGatewayConnection(profile: GatewayProfile): PreparedGatewayConnection {
  if (profile.transport === 'tailnet') {
    return {
      url: normalizeGatewayUrl(profile.baseUrl),
      authToken: profile.token
    };
  }

  if (profile.transport === 'ssh') {
    return {
      url: `ws://127.0.0.1:${profile.remoteGatewayPort}`,
      authToken: profile.gatewayToken
    };
  }

  if (profile.transport === 'local') {
    return {
      url: `ws://127.0.0.1:${profile.gatewayPort ?? 18789}`,
      authToken: profile.gatewayToken
    };
  }

  return {
    url: 'ws://127.0.0.1:18789'
  };
}

function createTimeoutError(label: string, timeoutMs: number) {
  return new Error(`${label} timed out after ${timeoutMs}ms`);
}

type FrameInspectionResult =
  | {
      kind: 'match';
      frame: GatewayFrame;
    }
  | {
      kind: 'error';
      error: Error;
    }
  | null;

function waitForFrame(
  socket: WebSocket,
  inspect: (frame: GatewayFrame) => FrameInspectionResult,
  timeoutMs: number,
  timeoutLabel: string
) {
  return new Promise<GatewayFrame>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(createTimeoutError(timeoutLabel, timeoutMs));
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timeoutId);
      socket.removeEventListener('message', onMessage);
      socket.removeEventListener('error', onError);
      socket.removeEventListener('close', onClose);
    };

    const onMessage = (event: MessageEvent) => {
      let frame: GatewayFrame;

      try {
        frame = JSON.parse(toMessageText(event.data)) as GatewayFrame;
      } catch {
        return;
      }

      const result = inspect(frame);

      if (!result) {
        return;
      }

      cleanup();

      if (result.kind === 'error') {
        reject(result.error);
        return;
      }

      resolve(result.frame);
    };
    const onError = () => {
      cleanup();
      reject(new Error('Gateway socket error'));
    };
    const onClose = () => {
      cleanup();
      reject(new Error(`${timeoutLabel} failed because the gateway socket closed`));
    };

    socket.addEventListener('message', onMessage);
    socket.addEventListener('error', onError);
    socket.addEventListener('close', onClose);
  });
}

function waitForOpen(socket: WebSocket, timeoutMs: number) {
  return new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(createTimeoutError('Gateway socket open', timeoutMs));
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timeoutId);
      socket.removeEventListener('open', onOpen);
      socket.removeEventListener('error', onError);
      socket.removeEventListener('close', onClose);
    };

    const onOpen = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error('Failed to open gateway socket'));
    };
    const onClose = () => {
      cleanup();
      reject(new Error('Gateway socket closed before it opened'));
    };

    socket.addEventListener('open', onOpen);
    socket.addEventListener('error', onError);
    socket.addEventListener('close', onClose);
  });
}

let requestCounter = 0;

function nextRequestId(method: string) {
  return `${method}-${++requestCounter}`;
}

function sendRequest(socket: WebSocket, method: string, params?: Record<string, unknown>) {
  const id = nextRequestId(method);
  const frame = JSON.stringify({ type: 'req', id, method, params });
  // Truncate log to avoid dumping huge base64 payloads
  console.log('[bridge] → send', frame.length > 500 ? frame.slice(0, 500) + `... (${frame.length} bytes total)` : frame);
  socket.send(frame);
  return id;
}

function formatResponseError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: string }).message);
  }

  if (error && typeof error === 'object' && 'code' in error) {
    return String((error as { code: string }).code);
  }

  return String(error);
}

function createIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `bridge-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseAgentIdFromSessionKey(sessionKey: unknown) {
  if (typeof sessionKey !== 'string') {
    return null;
  }

  const parts = sessionKey.split(':');

  if (parts.length < 3 || parts[0] !== 'agent') {
    return null;
  }

  return parts[1] || null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPetStatus(value: unknown): value is PetStatus {
  return (
    value === 'idle' ||
    value === 'thinking' ||
    value === 'working' ||
    value === 'waiting' ||
    value === 'collaborating' ||
    value === 'done' ||
    value === 'blocked'
  );
}

function normalizeAgentBindingSeed(
  value: unknown,
  fallbackGatewayId: string
): AgentBindingSeed | null {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return null;
  }

  const agentId =
    typeof value.agentId === 'string'
      ? value.agentId
      : typeof value.id === 'string'
        ? value.id
        : null;
  const label =
    typeof value.label === 'string'
      ? value.label
      : typeof value.name === 'string'
        ? value.name
        : typeof value.id === 'string'
          ? value.id
          : null;

  if (!agentId || !label) {
    return null;
  }

  return {
    id: value.id,
    agentId,
    gatewayId:
      typeof value.gatewayId === 'string' ? value.gatewayId : fallbackGatewayId,
    label,
    status: isPetStatus(value.status) ? value.status : undefined
  };
}

function normalizeAgentBindingSeeds(
  payload: unknown,
  fallbackGatewayId: string
): AgentBindingSeed[] {
  const rawAgents = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.agents)
      ? payload.agents
      : [];

  return rawAgents
    .map((agent) => normalizeAgentBindingSeed(agent, fallbackGatewayId))
    .filter((agent): agent is AgentBindingSeed => agent !== null);
}

function waitForResponse(socket: WebSocket, requestId: string, timeoutMs: number, label: string) {
  return waitForFrame(
    socket,
    (frame) => {
      if (frame.type === 'res' && frame.id === requestId) {
        return { kind: 'match', frame };
      }

      return null;
    },
    timeoutMs,
    label
  );
}

export class OpenClawClient implements BridgeClient {
  private socket: WebSocket | null = null;
  private activeProfile: GatewayProfile | null = null;
  private sessionMainKey = 'main';
  private snapshotAgents: unknown[] | null = null;
  private readonly connectionListeners = new Set<(state: BridgeConnectionState) => void>();
  private connectionState: BridgeConnectionState = {
    status: 'disconnected',
    profileId: null,
    errorMessage: null
  };
  private socketLifecycleCleanup: (() => void) | null = null;

  constructor(
    private readonly resolveProfile: (profileId: string) => GatewayProfile | undefined,
    private readonly socketFactory: (url: string) => WebSocket = (url) =>
      new WebSocket(url),
    private readonly prepareConnection: (
      profile: GatewayProfile
    ) => Promise<PreparedGatewayConnection | null | undefined> = async () => undefined,
    private readonly teardownConnection: (
      profile: GatewayProfile | null
    ) => Promise<void> = async () => undefined,
    private readonly options: OpenClawClientOptions = {},
    private readonly deviceIdentityProvider?: DeviceIdentityProvider
  ) {}

  async connect(profileId: string): Promise<void> {
    const profile = this.resolveProfile(profileId);

    if (!profile) {
      throw new Error(`Unknown gateway profile: ${profileId}`);
    }

    await this.disconnect();

    this.activeProfile = profile;
    this.setConnectionState({
      status: 'connecting',
      profileId: profile.id,
      errorMessage: null
    });

    try {
      const connection =
        (await this.prepareConnection(profile)) ?? resolveGatewayConnection(profile);
      console.log('[bridge] connecting to', connection.url);
      const socket = this.socketFactory(connection.url);
      this.socket = socket;
      this.attachSocketLifecycle(socket);

      socket.addEventListener('message', (event) => {
        console.log('[bridge] ← raw', toMessageText(event.data));
      });

      await waitForOpen(socket, this.options.openTimeoutMs ?? 4_000);
      console.log('[bridge] socket opened, waiting for challenge');

      const challenge = await waitForFrame(
        socket,
        (frame) => {
          const eventName = resolveEventName(frame);

          if (eventName === 'connect.challenge') {
            return { kind: 'match', frame };
          }

          // Server may skip challenge and send res directly
          if (frame.type === 'res') {
            return { kind: 'match', frame };
          }

          return null;
        },
        this.options.handshakeTimeoutMs ?? 4_000,
        'Gateway challenge'
      );

      let hello: GatewayFrame;

      if (resolveEventName(challenge) === 'connect.challenge') {
        const nonce =
          challenge.payload &&
          typeof challenge.payload === 'object' &&
          'nonce' in challenge.payload
            ? String((challenge.payload as { nonce: string }).nonce)
            : undefined;
        console.log('[bridge] received challenge, nonce:', nonce);

        // Connect params used for both the request and device signing.
        const clientId = 'openclaw-control-ui';
        const clientMode = 'ui';
        const role = 'operator';
        const scopes = ['operator.admin', 'operator.approvals', 'operator.pairing'];

        // Sign challenge with device identity if available.
        let deviceFields: { id: string; publicKey: string; signature: string; signedAt: number; nonce: string } | undefined;
        if (this.deviceIdentityProvider) {
          try {
            deviceFields = await this.deviceIdentityProvider.sign({
              nonce,
              clientId,
              clientMode,
              role,
              scopes,
              token: connection.authToken
            });
            console.log('[bridge] device identity attached, id:', deviceFields.id);
          } catch (err) {
            console.warn('[bridge] device identity signing failed, continuing without:', err);
          }
        }

        const connectParams: Record<string, unknown> = {
          minProtocol: 3,
          maxProtocol: 3,
          scopes,
          client: {
            id: clientId,
            version: '1.0.0',
            platform: 'macos',
            mode: clientMode
          },
          auth: connection.authToken ? { token: connection.authToken } : undefined
        };

        if (deviceFields) {
          connectParams.device = deviceFields;
        }

        const requestId = sendRequest(socket, 'connect', connectParams);

        hello = await waitForResponse(
          socket,
          requestId,
          this.options.handshakeTimeoutMs ?? 4_000,
          'Gateway handshake'
        );
      } else {
        hello = challenge;
      }

      if (hello.ok === true) {
        this.updateSessionDefaults(hello.payload);
        // Extract agents from health snapshot for fallback (avoids scope-gated agents.list RPC)
        this.snapshotAgents = this.extractSnapshotAgents(hello.payload);
        this.setConnectionState({
          status: 'connected',
          profileId: profile.id,
          errorMessage: null
        });
        return;
      }

      if (hello.ok === false && hello.error) {
        const errorStr = formatResponseError(hello.error);

        if (errorStr.includes('auth') || errorStr.includes('expired')) {
          await this.disposeCurrentSocket(false);
          this.setConnectionState({
            status: 'auth-expired',
            profileId: profile.id,
            errorMessage: 'AUTH_EXPIRED'
          });
          throw new Error('AUTH_EXPIRED');
        }

        throw new Error(`Gateway handshake rejected: ${errorStr}`);
      }

      // Fallback: check legacy payload.type format
      if (hello.payload && typeof hello.payload === 'object' && 'type' in hello.payload) {
        const payloadType = String((hello.payload as { type: string }).type);

        if (payloadType === 'hello-ok') {
          return;
        }

        if (payloadType === 'auth-expired') {
          await this.disposeCurrentSocket(false);
          this.setConnectionState({
            status: 'auth-expired',
            profileId: profile.id,
            errorMessage: 'AUTH_EXPIRED'
          });
          throw new Error('AUTH_EXPIRED');
        }
      }

      throw new Error('Gateway handshake failed');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.disposeCurrentSocket(true);
      if (this.connectionState.status !== 'auth-expired') {
        this.setConnectionState({
          status: 'error',
          profileId: profile.id,
          errorMessage: message
        });
      }
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.disposeCurrentSocket(true);
    this.activeProfile = null;
    this.setConnectionState({
      status: 'disconnected',
      profileId: null,
      errorMessage: null
    });
  }

  async listAgents(): Promise<AgentBindingSeed[]> {
    const gatewayId = this.activeProfile?.id ?? 'unknown';

    // Try agents.list RPC first; fall back to snapshot from connect response
    // (gateway 2026.3.13+ clears scopes for token-only auth without device identity)
    try {
      const socket = this.requireSocket();
      const requestId = sendRequest(socket, 'agents.list');
      const result = await waitForResponse(
        socket,
        requestId,
        this.options.requestTimeoutMs ?? 4_000,
        'agents.list'
      );
      if (result.ok === false) {
        throw new Error(formatResponseError(result.error));
      }
      this.updateSessionDefaults(result.payload);
      return normalizeAgentBindingSeeds(result.payload, gatewayId);
    } catch (err) {
      if (this.snapshotAgents && this.snapshotAgents.length > 0) {
        console.log('[bridge] agents.list failed, using snapshot agents:', (err as Error).message);
        return normalizeAgentBindingSeeds({ agents: this.snapshotAgents }, gatewayId);
      }
      throw err;
    }
  }

  private extractSnapshotAgents(payload: unknown): unknown[] | null {
    if (!payload || typeof payload !== 'object') return null;
    const p = payload as Record<string, unknown>;
    // snapshot.health.agents
    const snapshot = p.snapshot as Record<string, unknown> | undefined;
    const health = snapshot?.health as Record<string, unknown> | undefined;
    const agents = health?.agents;
    if (Array.isArray(agents) && agents.length > 0) return agents;
    return null;
  }

  subscribe(listener: (event: HabitatEvent) => void): () => void {
    const socket = this.requireSocket();
    const onMessage = (event: MessageEvent) => {
      let frame: GatewayFrame;
      try {
        frame = JSON.parse(toMessageText(event.data)) as GatewayFrame;
      } catch {
        return;
      }
      const eventName = resolveEventName(frame);

      if (!eventName || (eventName !== 'chat' && eventName !== 'agent' && !eventName.startsWith('agent.'))) {
        return;
      }

      const payloadRecord =
        frame.payload && typeof frame.payload === 'object'
          ? (frame.payload as Record<string, unknown>)
          : null;
      const agentId =
        frame.agentId ??
        parseAgentIdFromSessionKey(payloadRecord?.sessionKey) ??
        'unknown';
      const petId = frame.petId ?? parseAgentIdFromSessionKey(payloadRecord?.sessionKey) ?? undefined;

      const sessionKey = typeof payloadRecord?.sessionKey === 'string' ? payloadRecord.sessionKey : undefined;
      const runId = typeof payloadRecord?.runId === 'string' ? payloadRecord.runId : undefined;

      listener(
        parseOpenClawEvent({
          type: eventName,
          agentId,
          gatewayId: frame.gatewayId ?? this.activeProfile?.id ?? 'unknown',
          petId,
          sessionKey,
          runId,
          payload: frame.payload
        })
      );
    };

    socket.addEventListener('message', onMessage);

    return () => {
      socket.removeEventListener('message', onMessage);
    };
  }

  subscribeConnection(listener: (state: BridgeConnectionState) => void): () => void {
    this.connectionListeners.add(listener);
    listener(this.connectionState);

    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  getConnectionState(): BridgeConnectionState {
    return this.connectionState;
  }

  async sendMessage(input: SendMessageInput): Promise<void> {
    const socket = this.requireSocket();
    const params: Record<string, unknown> = {
      sessionKey: this.resolveSessionKey(input.agentId ?? input.petId),
      message: input.content,
      idempotencyKey: input.idempotencyKey ?? createIdempotencyKey()
    };

    // Convert data-URI images into gateway attachments format
    if (input.images && input.images.length > 0) {
      const attachments = input.images
        .filter((img) => img.url.startsWith('data:'))
        .map((img) => {
          // Parse data URI: data:<mimeType>;base64,<data>
          const match = img.url.match(/^data:([^;]+);base64,(.+)$/s);
          if (!match) {
            console.warn('[bridge] attachment: failed to parse data URI, prefix:', img.url.slice(0, 50));
            return null;
          }
          const content = match[2].replace(/\s/g, ''); // strip any whitespace in base64
          console.log('[bridge] attachment: mimeType=%s base64Length=%d fileName=%s', match[1], content.length, img.alt ?? 'image');
          return {
            mimeType: match[1],
            fileName: img.alt ?? 'image',
            content
          };
        })
        .filter(Boolean);
      if (attachments.length > 0) {
        params.attachments = attachments;
        console.log('[bridge] sending %d attachment(s) with chat.send', attachments.length);
      }
    }

    const requestId = sendRequest(socket, 'chat.send', params);
    const res = await waitForResponse(socket, requestId, this.options.requestTimeoutMs ?? 4_000, 'chat.send');

    if (res.ok === false) {
      throw new Error(`sendMessage rejected: ${formatResponseError(res.error)}`);
    }
  }

  async createTask(input: CreateTaskInput): Promise<void> {
    const socket = this.requireSocket();
    const requestId = sendRequest(socket, 'chat.send', {
      sessionKey: this.resolveSessionKey(input.agentId ?? input.petId),
      message: input.prompt,
      idempotencyKey: createIdempotencyKey()
    });
    const res = await waitForResponse(socket, requestId, this.options.requestTimeoutMs ?? 4_000, 'chat.send');

    if (res.ok === false) {
      throw new Error(`createTask rejected: ${formatResponseError(res.error)}`);
    }
  }

  private requireSocket() {
    if (!isSocketOpen(this.socket)) {
      const profileId = this.activeProfile?.id ?? this.connectionState.profileId;
      this.socketLifecycleCleanup?.();
      this.socketLifecycleCleanup = null;
      this.socket = null;
      this.setConnectionState({
        status: 'disconnected',
        profileId,
        errorMessage: 'Bridge client is not connected'
      });
      throw new Error('Bridge client is not connected');
    }

    return this.socket;
  }

  private setConnectionState(state: BridgeConnectionState) {
    if (
      this.connectionState.status === state.status &&
      this.connectionState.profileId === state.profileId &&
      this.connectionState.errorMessage === state.errorMessage
    ) {
      return;
    }

    this.connectionState = state;
    for (const listener of this.connectionListeners) {
      listener(state);
    }
  }

  private attachSocketLifecycle(socket: WebSocket) {
    const onClose = (event: CloseEvent | Event) => {
      const code =
        typeof event === 'object' && event && 'code' in event ? String(event.code) : 'unknown';
      const reason =
        typeof event === 'object' && event && 'reason' in event && event.reason
          ? ` ${String(event.reason)}`
          : '';
      console.log('[bridge] socket closed', 'code' in event ? event.code : '', 'reason' in event ? event.reason : '');
      this.socketLifecycleCleanup?.();
      this.socketLifecycleCleanup = null;
      if (this.socket === socket) {
        this.socket = null;
      }
      this.setConnectionState({
        status: 'disconnected',
        profileId: this.activeProfile?.id ?? this.connectionState.profileId,
        errorMessage: `Gateway socket closed (${code})${reason}`.trim()
      });
    };
    const onError = () => {
      console.log('[bridge] socket error');
      this.socketLifecycleCleanup?.();
      this.socketLifecycleCleanup = null;
      if (this.socket === socket) {
        this.socket = null;
      }
      this.setConnectionState({
        status: 'error',
        profileId: this.activeProfile?.id ?? this.connectionState.profileId,
        errorMessage: 'Gateway socket error'
      });
    };

    socket.addEventListener('close', onClose);
    socket.addEventListener('error', onError);

    this.socketLifecycleCleanup = () => {
      socket.removeEventListener('close', onClose);
      socket.removeEventListener('error', onError);
    };
  }

  private async disposeCurrentSocket(teardownConnection: boolean) {
    const profile = this.activeProfile;
    const socket = this.socket;

    this.socketLifecycleCleanup?.();
    this.socketLifecycleCleanup = null;
    this.socket = null;
    socket?.close();

    if (teardownConnection) {
      await this.teardownConnection(profile);
    }
  }

  private updateSessionDefaults(payload: unknown) {
    if (
      payload &&
      typeof payload === 'object' &&
      'sessionDefaults' in payload &&
      payload.sessionDefaults &&
      typeof payload.sessionDefaults === 'object' &&
      'mainKey' in payload.sessionDefaults &&
      typeof payload.sessionDefaults.mainKey === 'string'
    ) {
      this.sessionMainKey = payload.sessionDefaults.mainKey;
      return;
    }

    if (
      payload &&
      typeof payload === 'object' &&
      'mainKey' in payload &&
      typeof payload.mainKey === 'string'
    ) {
      this.sessionMainKey = payload.mainKey;
    }
  }

  getSessionKey(agentId: string): string {
    return `agent:${agentId}:${this.sessionMainKey}`;
  }

  private resolveSessionKey(agentId: string) {
    return this.getSessionKey(agentId);
  }
}

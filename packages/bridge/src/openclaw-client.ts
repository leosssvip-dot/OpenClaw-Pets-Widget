import type {
  AgentBindingSeed,
  BridgeClient,
  CreateTaskInput,
  HabitatEvent,
  PreparedGatewayConnection,
  SendMessageInput
} from './contracts';
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
  console.log('[bridge] → send', frame);
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
    private readonly options: OpenClawClientOptions = {}
  ) {}

  async connect(profileId: string): Promise<void> {
    const profile = this.resolveProfile(profileId);

    if (!profile) {
      throw new Error(`Unknown gateway profile: ${profileId}`);
    }

    await this.disconnect();

    this.activeProfile = profile;

    try {
      const connection =
        (await this.prepareConnection(profile)) ?? resolveGatewayConnection(profile);
      console.log('[bridge] connecting to', connection.url);
      const socket = this.socketFactory(connection.url);
      this.socket = socket;

      socket.addEventListener('message', (event) => {
        console.log('[bridge] ← raw', toMessageText(event.data));
      });
      socket.addEventListener('close', (event) => {
        console.log('[bridge] socket closed', event.code, event.reason);
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

        const requestId = sendRequest(socket, 'connect', {
          minProtocol: 3,
          maxProtocol: 3,
          scopes: ['operator.read', 'operator.write'],
          client: {
            id: 'gateway-client',
            version: '1.0.0',
            platform: 'macos',
            mode: 'ui'
          },
          auth: connection.authToken ? { token: connection.authToken } : undefined
        });

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
        return;
      }

      if (hello.ok === false && hello.error) {
        const errorStr = formatResponseError(hello.error);

        if (errorStr.includes('auth') || errorStr.includes('expired')) {
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
          throw new Error('AUTH_EXPIRED');
        }
      }

      throw new Error('Gateway handshake failed');
    } catch (error) {
      await this.disconnect();
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    const profile = this.activeProfile;
    this.activeProfile = null;
    this.socket?.close();
    this.socket = null;
    await this.teardownConnection(profile);
  }

  async listAgents(): Promise<AgentBindingSeed[]> {
    const socket = this.requireSocket();
    const requestId = sendRequest(socket, 'agents.list');
    const result = await waitForResponse(
      socket,
      requestId,
      this.options.requestTimeoutMs ?? 4_000,
      'agents.list'
    );
    if (result.ok === false) {
      throw new Error(`agents.list rejected: ${formatResponseError(result.error)}`);
    }

    return normalizeAgentBindingSeeds(
      result.payload,
      this.activeProfile?.id ?? 'unknown'
    );
  }

  subscribe(listener: (event: HabitatEvent) => void): () => void {
    const socket = this.requireSocket();
    const onMessage = (event: MessageEvent) => {
      const frame = JSON.parse(toMessageText(event.data)) as GatewayFrame;
      const eventName = resolveEventName(frame);

      if (!eventName?.startsWith('agent.')) {
        return;
      }

      listener(
        parseOpenClawEvent({
          type: eventName,
          agentId: frame.agentId ?? 'unknown',
          gatewayId: frame.gatewayId ?? 'unknown',
          petId: frame.petId,
          payload: frame.payload
        })
      );
    };

    socket.addEventListener('message', onMessage);

    return () => {
      socket.removeEventListener('message', onMessage);
    };
  }

  async sendMessage(input: SendMessageInput): Promise<void> {
    const socket = this.requireSocket();
    const requestId = sendRequest(socket, 'agent.message.send', input as unknown as Record<string, unknown>);
    const res = await waitForResponse(socket, requestId, this.options.requestTimeoutMs ?? 4_000, 'agent.message.send');

    if (res.ok === false) {
      throw new Error(`sendMessage rejected: ${formatResponseError(res.error)}`);
    }
  }

  async createTask(input: CreateTaskInput): Promise<void> {
    const socket = this.requireSocket();
    const requestId = sendRequest(socket, 'agent.task.create', input as unknown as Record<string, unknown>);
    const res = await waitForResponse(socket, requestId, this.options.requestTimeoutMs ?? 4_000, 'agent.task.create');

    if (res.ok === false) {
      throw new Error(`createTask rejected: ${formatResponseError(res.error)}`);
    }
  }

  private requireSocket() {
    if (!this.socket) {
      throw new Error('Bridge client is not connected');
    }

    return this.socket;
  }
}

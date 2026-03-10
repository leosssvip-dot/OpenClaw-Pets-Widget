import type {
  AgentBindingSeed,
  BridgeClient,
  CreateTaskInput,
  HabitatEvent,
  SendMessageInput
} from './contracts';
import { parseOpenClawEvent } from './openclaw-event-parser';
import type { GatewayProfile } from './profile-schema';

interface GatewayMessage {
  type: string;
  payload?: unknown;
  agentId?: string;
  gatewayId?: string;
  petId?: string;
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

function resolveGatewayUrl(profile: GatewayProfile) {
  if (profile.transport === 'tailnet') {
    return normalizeGatewayUrl(profile.baseUrl);
  }

  return 'ws://127.0.0.1:18789';
}

function waitForMessage(
  socket: WebSocket,
  match: (message: GatewayMessage) => boolean
) {
  return new Promise<GatewayMessage>((resolve, reject) => {
    const onMessage = (event: MessageEvent) => {
      const message = JSON.parse(toMessageText(event.data)) as GatewayMessage;

      if (!match(message)) {
        return;
      }

      socket.removeEventListener('message', onMessage);
      socket.removeEventListener('error', onError);
      resolve(message);
    };
    const onError = () => {
      socket.removeEventListener('message', onMessage);
      socket.removeEventListener('error', onError);
      reject(new Error('Gateway socket error'));
    };

    socket.addEventListener('message', onMessage);
    socket.addEventListener('error', onError);
  });
}

function waitForOpen(socket: WebSocket) {
  return new Promise<void>((resolve, reject) => {
    const onOpen = () => {
      socket.removeEventListener('open', onOpen);
      socket.removeEventListener('error', onError);
      resolve();
    };
    const onError = () => {
      socket.removeEventListener('open', onOpen);
      socket.removeEventListener('error', onError);
      reject(new Error('Failed to open gateway socket'));
    };

    socket.addEventListener('open', onOpen);
    socket.addEventListener('error', onError);
  });
}

export class OpenClawClient implements BridgeClient {
  private socket: WebSocket | null = null;

  constructor(
    private readonly resolveProfile: (profileId: string) => GatewayProfile | undefined,
    private readonly socketFactory: (url: string) => WebSocket = (url) =>
      new WebSocket(url)
  ) {}

  async connect(profileId: string): Promise<void> {
    const profile = this.resolveProfile(profileId);

    if (!profile) {
      throw new Error(`Unknown gateway profile: ${profileId}`);
    }

    await this.disconnect();

    const socket = this.socketFactory(resolveGatewayUrl(profile));
    this.socket = socket;
    await waitForOpen(socket);

    const handshake = waitForMessage(socket, (message) => message.type === 'connect.result');
    socket.send(
      JSON.stringify({
        type: 'connect',
        params: {
          auth:
            profile.transport === 'tailnet'
              ? {
                  token: profile.token
                }
              : undefined
        }
      })
    );

    const hello = await handshake;

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
  }

  async disconnect(): Promise<void> {
    this.socket?.close();
    this.socket = null;
  }

  async listAgents(): Promise<AgentBindingSeed[]> {
    const socket = this.requireSocket();
    const response = waitForMessage(socket, (message) => message.type === 'agents.list.result');
    socket.send(JSON.stringify({ type: 'agents.list' }));
    const result = await response;
    return Array.isArray(result.payload) ? (result.payload as AgentBindingSeed[]) : [];
  }

  subscribe(listener: (event: HabitatEvent) => void): () => void {
    const socket = this.requireSocket();
    const onMessage = (event: MessageEvent) => {
      const message = JSON.parse(toMessageText(event.data)) as GatewayMessage;

      if (!message.type.startsWith('agent.')) {
        return;
      }

      listener(
        parseOpenClawEvent({
          type: message.type,
          agentId: message.agentId ?? 'unknown',
          gatewayId: message.gatewayId ?? 'unknown',
          petId: message.petId
        })
      );
    };

    socket.addEventListener('message', onMessage);

    return () => {
      socket.removeEventListener('message', onMessage);
    };
  }

  async sendMessage(input: SendMessageInput): Promise<void> {
    this.requireSocket().send(
      JSON.stringify({
        type: 'agent.message.send',
        payload: input
      })
    );
  }

  async createTask(input: CreateTaskInput): Promise<void> {
    this.requireSocket().send(
      JSON.stringify({
        type: 'agent.task.create',
        payload: input
      })
    );
  }

  private requireSocket() {
    if (!this.socket) {
      throw new Error('Bridge client is not connected');
    }

    return this.socket;
  }
}

import type { PetStatus } from '@openclaw-habitat/domain';

export interface AgentBindingSeed {
  id: string;
  agentId: string;
  gatewayId: string;
  label: string;
  status?: PetStatus;
}

export interface SendMessageInput {
  petId: string;
  agentId?: string;
  content: string;
  /** Optional image attachments as data-URIs or remote URLs. */
  images?: Array<{ url: string; alt?: string }>;
  /** Caller-provided idempotency key; gateway echoes it back as runId on all events. */
  idempotencyKey?: string;
}

export interface CreateTaskInput {
  petId: string;
  agentId?: string;
  prompt: string;
}

export interface PreparedGatewayConnection {
  url: string;
  authToken?: string;
}

export type BridgeConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'auth-expired'
  | 'error';

export interface BridgeConnectionState {
  status: BridgeConnectionStatus;
  profileId: string | null;
  errorMessage: string | null;
}

interface BaseHabitatEvent {
  agentId: string;
  gatewayId: string;
  petId?: string;
  /** The session key echoed back by the gateway (e.g. "agent:main:main"). */
  sessionKey?: string;
  /** The run identifier echoed back by the gateway (matches the idempotencyKey we sent). */
  runId?: string;
}

export type HabitatEvent =
  | (BaseHabitatEvent & { kind: 'agent.completed' })
  | (BaseHabitatEvent & { kind: 'agent.error'; message?: string })
  | (BaseHabitatEvent & { kind: 'agent.status'; status: string })
  | (BaseHabitatEvent & { kind: 'chat.message'; text: string; final: boolean })
  | (BaseHabitatEvent & { kind: 'agent.unknown' });

export interface BridgeClient {
  connect(profileId: string): Promise<void>;
  disconnect(): Promise<void>;
  listAgents(): Promise<AgentBindingSeed[]>;
  subscribe(listener: (event: HabitatEvent) => void): () => void;
  subscribeConnection(listener: (state: BridgeConnectionState) => void): () => void;
  getConnectionState(): BridgeConnectionState;
  sendMessage(input: SendMessageInput): Promise<void>;
  createTask(input: CreateTaskInput): Promise<void>;
  /** Return the session key the client would use for the given agentId. */
  getSessionKey(agentId: string): string;
}

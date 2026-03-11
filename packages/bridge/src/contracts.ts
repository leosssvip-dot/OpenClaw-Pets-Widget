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
  content: string;
}

export interface CreateTaskInput {
  petId: string;
  prompt: string;
}

export interface PreparedGatewayConnection {
  url: string;
  authToken?: string;
}

interface BaseHabitatEvent {
  agentId: string;
  gatewayId: string;
  petId?: string;
}

export type HabitatEvent =
  | (BaseHabitatEvent & { kind: 'agent.completed' })
  | (BaseHabitatEvent & { kind: 'agent.error'; message?: string })
  | (BaseHabitatEvent & { kind: 'agent.status'; status: string })
  | (BaseHabitatEvent & { kind: 'agent.unknown' });

export interface BridgeClient {
  connect(profileId: string): Promise<void>;
  disconnect(): Promise<void>;
  listAgents(): Promise<AgentBindingSeed[]>;
  subscribe(listener: (event: HabitatEvent) => void): () => void;
  sendMessage(input: SendMessageInput): Promise<void>;
  createTask(input: CreateTaskInput): Promise<void>;
}

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

export type HabitatEvent =
  | {
      kind: 'agent.completed';
      agentId: string;
      gatewayId: string;
      petId?: string;
    }
  | {
      kind: 'agent.unknown';
      agentId: string;
      gatewayId: string;
      petId?: string;
    };

export interface BridgeClient {
  connect(profileId: string): Promise<void>;
  disconnect(): Promise<void>;
  listAgents(): Promise<AgentBindingSeed[]>;
  subscribe(listener: (event: HabitatEvent) => void): () => void;
  sendMessage(input: SendMessageInput): Promise<void>;
  createTask(input: CreateTaskInput): Promise<void>;
}

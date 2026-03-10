import type { PetStatus } from './pet-status';

export interface GatewayAgentSnapshot {
  taskState: 'idle' | 'running' | 'completed';
  waitingOn: 'user' | 'channel' | null;
  hasError: boolean;
  collaboratorIds: string[];
  reasoningActive: boolean;
  justCompleted: boolean;
}

export interface PetBinding {
  id: string;
  agentId: string;
  gatewayId: string;
  status: PetStatus;
}

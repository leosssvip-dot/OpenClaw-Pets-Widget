import type { HabitatEvent } from './contracts';

export interface RawOpenClawEvent {
  type: string;
  agentId: string;
  gatewayId: string;
  petId?: string;
}

export function parseOpenClawEvent(
  input: RawOpenClawEvent
): HabitatEvent {
  if (input.type === 'agent.task.completed') {
    return {
      kind: 'agent.completed',
      agentId: input.agentId,
      gatewayId: input.gatewayId,
      petId: input.petId
    };
  }

  return {
    kind: 'agent.unknown',
    agentId: input.agentId,
    gatewayId: input.gatewayId,
    petId: input.petId
  };
}

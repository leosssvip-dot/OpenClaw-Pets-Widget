import type { HabitatEvent } from './contracts';

export interface RawOpenClawEvent {
  type: string;
  agentId: string;
  gatewayId: string;
  petId?: string;
  payload?: unknown;
}

export function parseOpenClawEvent(
  input: RawOpenClawEvent
): HabitatEvent {
  const base = {
    agentId: input.agentId,
    gatewayId: input.gatewayId,
    petId: input.petId
  };

  if (input.type === 'agent.task.completed') {
    return { ...base, kind: 'agent.completed' };
  }

  if (input.type === 'agent.error') {
    const message =
      input.payload && typeof input.payload === 'object' && 'message' in input.payload
        ? String((input.payload as { message: string }).message)
        : undefined;
    return { ...base, kind: 'agent.error', message };
  }

  if (input.type === 'agent.status') {
    const status =
      input.payload && typeof input.payload === 'object' && 'status' in input.payload
        ? String((input.payload as { status: string }).status)
        : 'unknown';
    return { ...base, kind: 'agent.status', status };
  }

  return { ...base, kind: 'agent.unknown' };
}

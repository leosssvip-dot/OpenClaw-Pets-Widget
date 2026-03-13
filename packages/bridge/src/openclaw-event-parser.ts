import type { HabitatEvent } from './contracts';

export interface RawOpenClawEvent {
  type: string;
  agentId: string;
  gatewayId: string;
  petId?: string;
  payload?: unknown;
}

function extractChatText(payload: unknown) {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('message' in payload) ||
    !payload.message ||
    typeof payload.message !== 'object'
  ) {
    return null;
  }

  const message = payload.message as {
    role?: string;
    content?: Array<{ type?: string; text?: string }>;
  };

  if (message.role !== 'assistant' || !Array.isArray(message.content)) {
    return null;
  }

  return message.content
    .filter((item) => item?.type === 'text' && typeof item.text === 'string')
    .map((item) => item.text)
    .join('');
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

  if (input.type === 'chat') {
    const text = extractChatText(input.payload);

    if (!text) {
      return { ...base, kind: 'agent.unknown' };
    }

    const final =
      input.payload && typeof input.payload === 'object' && 'state' in input.payload
        ? String((input.payload as { state: string }).state) === 'final'
        : false;

    return {
      ...base,
      kind: 'chat.message',
      text,
      final
    };
  }

  return { ...base, kind: 'agent.unknown' };
}

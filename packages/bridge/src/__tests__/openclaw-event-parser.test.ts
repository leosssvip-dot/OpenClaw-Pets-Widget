import { describe, expect, it } from 'vitest';
import { parseOpenClawEvent } from '../openclaw-event-parser';

describe('parseOpenClawEvent', () => {
  it('normalizes a task completion event', () => {
    expect(
      parseOpenClawEvent({
        type: 'agent.task.completed',
        agentId: 'researcher',
        gatewayId: 'remote-1'
      }).kind
    ).toBe('agent.completed');
  });

  it('normalizes an error event with message', () => {
    const event = parseOpenClawEvent({
      type: 'agent.error',
      agentId: 'researcher',
      gatewayId: 'remote-1',
      payload: { message: 'Task failed' }
    });
    expect(event.kind).toBe('agent.error');
    expect(event.kind === 'agent.error' && event.message).toBe('Task failed');
  });

  it('normalizes a status event', () => {
    const event = parseOpenClawEvent({
      type: 'agent.status',
      agentId: 'researcher',
      gatewayId: 'remote-1',
      payload: { status: 'thinking' }
    });
    expect(event.kind).toBe('agent.status');
    expect(event.kind === 'agent.status' && event.status).toBe('thinking');
  });

  it('returns agent.unknown for unrecognized events', () => {
    expect(
      parseOpenClawEvent({
        type: 'agent.something.else',
        agentId: 'researcher',
        gatewayId: 'remote-1'
      }).kind
    ).toBe('agent.unknown');
  });

  it('normalizes assistant chat delta events', () => {
    const event = parseOpenClawEvent({
      type: 'chat',
      agentId: 'researcher',
      gatewayId: 'remote-1',
      petId: 'pet-1',
      payload: {
        state: 'delta',
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: '当前这轮' }]
        }
      }
    });

    expect(event).toEqual({
      kind: 'chat.message',
      agentId: 'researcher',
      gatewayId: 'remote-1',
      petId: 'pet-1',
      text: '当前这轮',
      final: false
    });
  });
});

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
});

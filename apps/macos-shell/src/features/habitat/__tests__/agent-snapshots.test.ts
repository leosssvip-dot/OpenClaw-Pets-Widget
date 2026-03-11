import { describe, expect, it } from 'vitest';
import { reduceAgentSnapshots } from '../agent-snapshots';

describe('reduceAgentSnapshots', () => {
  it('derives focused activity and recent events from habitat events', () => {
    const state = reduceAgentSnapshots(
      {},
      {
        kind: 'agent.status',
        agentId: 'main',
        gatewayId: 'remote-1',
        status: 'working'
      },
      {
        now: 100
      }
    );

    expect(state.main).toMatchObject({
      agentId: 'main',
      gatewayId: 'remote-1',
      runtimeStatus: 'working',
      recentEvent: 'task-started',
      lastActiveAt: 100
    });
    expect(state.main.priorityScore).toBeGreaterThan(0);
  });

  it('tracks completions and errors as recent events', () => {
    const completed = reduceAgentSnapshots(
      {},
      {
        kind: 'agent.completed',
        agentId: 'main',
        gatewayId: 'remote-1'
      },
      {
        now: 200
      }
    );
    const errored = reduceAgentSnapshots(
      completed,
      {
        kind: 'agent.error',
        agentId: 'main',
        gatewayId: 'remote-1',
        message: 'Task failed'
      },
      {
        now: 300
      }
    );

    expect(completed.main).toMatchObject({
      runtimeStatus: 'done',
      recentEvent: 'task-completed',
      lastActiveAt: 200
    });
    expect(errored.main).toMatchObject({
      runtimeStatus: 'blocked',
      recentEvent: 'error',
      lastActiveAt: 300
    });
  });
});

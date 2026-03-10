import { describe, expect, it } from 'vitest';
import { mapAgentSnapshotToPetStatus } from '../pet-status';

describe('mapAgentSnapshotToPetStatus', () => {
  it('maps a running task to working', () => {
    expect(
      mapAgentSnapshotToPetStatus({
        taskState: 'running',
        waitingOn: null,
        hasError: false,
        collaboratorIds: [],
        reasoningActive: false,
        justCompleted: false
      })
    ).toBe('working');
  });

  it('maps a collaborator fan-out to collaborating', () => {
    expect(
      mapAgentSnapshotToPetStatus({
        taskState: 'running',
        waitingOn: null,
        hasError: false,
        collaboratorIds: ['agent-b'],
        reasoningActive: false,
        justCompleted: false
      })
    ).toBe('collaborating');
  });
});

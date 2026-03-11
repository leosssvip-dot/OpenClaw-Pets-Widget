import type { HabitatEvent } from '@openclaw-habitat/bridge';
import type { PetStatus } from '@openclaw-habitat/domain';

export interface AgentSnapshot {
  agentId: string;
  gatewayId: string;
  displayName?: string;
  runtimeStatus: PetStatus;
  recentEvent: 'task-started' | 'task-completed' | 'error' | null;
  lastActiveAt: number;
  priorityScore: number;
}

function toRuntimeStatus(status: string): PetStatus {
  switch (status) {
    case 'thinking':
    case 'working':
    case 'waiting':
    case 'idle':
    case 'done':
    case 'blocked':
      return status;
    default:
      return 'working';
  }
}

function scoreSnapshot(snapshot: AgentSnapshot) {
  const statusScore: Record<PetStatus, number> = {
    blocked: 100,
    working: 90,
    thinking: 80,
    waiting: 60,
    idle: 40,
    done: 20
  };
  const recentEventScore: Record<NonNullable<AgentSnapshot['recentEvent']>, number> = {
    error: 30,
    'task-started': 20,
    'task-completed': 10
  };

  return (
    statusScore[snapshot.runtimeStatus] +
    (snapshot.recentEvent ? recentEventScore[snapshot.recentEvent] : 0)
  );
}

export function reduceAgentSnapshots(
  snapshots: Record<string, AgentSnapshot>,
  event: HabitatEvent,
  options?: { now?: number }
): Record<string, AgentSnapshot> {
  const previous = snapshots[event.agentId];
  const nextSnapshot: AgentSnapshot = {
    agentId: event.agentId,
    gatewayId: event.gatewayId,
    displayName: previous?.displayName,
    runtimeStatus: previous?.runtimeStatus ?? 'idle',
    recentEvent: previous?.recentEvent ?? null,
    lastActiveAt: options?.now ?? Date.now(),
    priorityScore: previous?.priorityScore ?? 0
  };

  switch (event.kind) {
    case 'agent.status':
      nextSnapshot.runtimeStatus = toRuntimeStatus(event.status);
      nextSnapshot.recentEvent = event.status === 'working' ? 'task-started' : null;
      break;
    case 'agent.completed':
      nextSnapshot.runtimeStatus = 'done';
      nextSnapshot.recentEvent = 'task-completed';
      break;
    case 'agent.error':
      nextSnapshot.runtimeStatus = 'blocked';
      nextSnapshot.recentEvent = 'error';
      break;
    default:
      return snapshots;
  }

  nextSnapshot.priorityScore = scoreSnapshot(nextSnapshot);

  return {
    ...snapshots,
    [event.agentId]: nextSnapshot
  };
}

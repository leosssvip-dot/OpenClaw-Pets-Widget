import type { GatewayAgentSnapshot } from './models';

export type PetStatus =
  | 'idle'
  | 'thinking'
  | 'working'
  | 'waiting'
  | 'collaborating'
  | 'done'
  | 'blocked';

export function mapAgentSnapshotToPetStatus(
  input: GatewayAgentSnapshot
): PetStatus {
  if (input.hasError) {
    return 'blocked';
  }

  if (input.collaboratorIds.length > 0) {
    return 'collaborating';
  }

  if (input.justCompleted || input.taskState === 'completed') {
    return 'done';
  }

  if (input.waitingOn) {
    return 'waiting';
  }

  if (input.taskState === 'running') {
    return 'working';
  }

  if (input.reasoningActive) {
    return 'thinking';
  }

  return 'idle';
}

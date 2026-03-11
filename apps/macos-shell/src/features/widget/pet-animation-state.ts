import type { ConnectionStatus } from '../connection/ConnectionBadge';

export type PetAnimationActivity =
  | 'idle'
  | 'thinking'
  | 'working'
  | 'waiting'
  | 'done'
  | 'blocked';

export type PetAnimationMood =
  | 'calm'
  | 'focused'
  | 'curious'
  | 'proud'
  | 'concerned';

export interface PetAnimationStateInput {
  petStatus?:
    | 'idle'
    | 'thinking'
    | 'working'
    | 'waiting'
    | 'collaborating'
    | 'done'
    | 'blocked'
    | 'disconnected';
  connectionStatus: ConnectionStatus;
}

export interface ResolvedPetAnimationState {
  activity: PetAnimationActivity;
  mood: PetAnimationMood;
}

function isDisconnected(connectionStatus: ConnectionStatus) {
  return connectionStatus === 'offline' || connectionStatus === 'auth-expired';
}

export function resolvePetAnimationState(
  input: PetAnimationStateInput
): ResolvedPetAnimationState {
  if (isDisconnected(input.connectionStatus) || input.petStatus === 'disconnected') {
    return {
      activity: 'blocked',
      mood: 'concerned'
    };
  }

  switch (input.petStatus) {
    case 'collaborating':
    case 'working':
      return {
        activity: 'working',
        mood: 'focused'
      };
    case 'thinking':
      return {
        activity: 'thinking',
        mood: 'curious'
      };
    case 'waiting':
      return {
        activity: 'waiting',
        mood: 'calm'
      };
    case 'done':
      return {
        activity: 'done',
        mood: 'proud'
      };
    case 'blocked':
      return {
        activity: 'blocked',
        mood: 'concerned'
      };
    case 'idle':
    default:
      return {
        activity: 'idle',
        mood: 'calm'
      };
  }
}

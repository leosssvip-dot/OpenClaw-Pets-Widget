/**
 * Pet ↔ Agent binding model.
 *
 * Each binding maps a pet instance to a specific agent and character.
 * Multiple bindings can coexist — one per agent.
 */

import type { PetStatus } from './pet-status';

export interface PetCharacterBinding {
  /** Unique pet instance id */
  petId: string;
  /** The remote agent this pet is bound to */
  agentId: string;
  /** Gateway through which the agent is reachable */
  gatewayId: string;
  /** Character visual identity */
  characterId: string;
  /** Optional Rive asset path override (null = use built-in SVG) */
  riveAsset: string | null;
  /** Display name shown under the pet */
  displayName: string;
}

export interface AgentWorkState {
  agentId: string;
  status: PetStatus;
  taskName?: string;
  progress?: number;
  lastActivity?: string;
}

/**
 * Resolves the default character for an agent role hint.
 * This lets the system auto-assign a fitting pet when a new agent connects.
 */
export function suggestCharacterForRole(
  roleHint?: string,
): string {
  if (!roleHint) return 'monk';

  const hint = roleHint.toLowerCase();
  if (hint.includes('code') || hint.includes('dev')) return 'lobster';
  if (hint.includes('plan') || hint.includes('pm')) return 'cat';
  if (hint.includes('ops') || hint.includes('infra')) return 'robot';
  if (hint.includes('focus') || hint.includes('exec')) return 'monk';

  return 'monk';
}

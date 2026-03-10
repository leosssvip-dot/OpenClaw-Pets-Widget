import type { HabitatEvent } from '@openclaw-habitat/bridge';
import type { PetStatus } from '@openclaw-habitat/domain';

export interface HabitatPet {
  id: string;
  agentId: string;
  gatewayId: string;
  status: PetStatus;
  name?: string;
  bubbleText?: string;
}

export interface HabitatState {
  pets: Record<string, HabitatPet>;
  seedPets: (pets: HabitatPet[]) => void;
  applyEvent: (event: HabitatEvent) => void;
}

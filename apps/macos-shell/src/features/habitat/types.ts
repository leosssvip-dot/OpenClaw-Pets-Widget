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
  selectedPetId: string | null;
  seedPets: (pets: HabitatPet[]) => void;
  selectPet: (petId: string) => void;
  markPetAsThinking: (petId: string, content: string) => void;
  applyEvent: (event: HabitatEvent) => void;
}

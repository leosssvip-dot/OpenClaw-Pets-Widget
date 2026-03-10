import type { HabitatPet } from './types';
import { PetBubble } from './PetBubble';
import { useHabitatStore } from './store';

export function PetSprite({ pet }: { pet: HabitatPet }) {
  const selectedPetId = useHabitatStore((state) => state.selectedPetId);
  const selectPet = useHabitatStore((state) => state.selectPet);
  const isSelected = selectedPetId === pet.id;

  return (
    <button
      type="button"
      className={`pet-sprite pet-sprite--${pet.status}${isSelected ? ' pet-sprite--selected' : ''}`}
      onClick={() => selectPet(pet.id)}
    >
      <div className="pet-sprite__avatar" aria-hidden="true">
        {pet.name?.slice(0, 1) ?? pet.agentId.slice(0, 1).toUpperCase()}
      </div>
      <div className="pet-sprite__meta">
        <strong>{pet.name ?? pet.agentId}</strong>
        <span>{pet.status}</span>
      </div>
      {pet.bubbleText ? <PetBubble text={pet.bubbleText} /> : null}
    </button>
  );
}

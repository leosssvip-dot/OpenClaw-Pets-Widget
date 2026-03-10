import type { HabitatPet } from './types';
import { PetBubble } from './PetBubble';

export function PetSprite({ pet }: { pet: HabitatPet }) {
  return (
    <article className={`pet-sprite pet-sprite--${pet.status}`}>
      <div className="pet-sprite__avatar" aria-hidden="true">
        {pet.name?.slice(0, 1) ?? pet.agentId.slice(0, 1).toUpperCase()}
      </div>
      <div className="pet-sprite__meta">
        <strong>{pet.name ?? pet.agentId}</strong>
        <span>{pet.status}</span>
      </div>
      {pet.bubbleText ? <PetBubble text={pet.bubbleText} /> : null}
    </article>
  );
}

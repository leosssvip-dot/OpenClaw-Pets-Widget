import { useHabitatStore } from './store';
import { PetSprite } from './PetSprite';

export function PetCanvas() {
  const petsById = useHabitatStore((state) => state.pets);
  const pets = Object.values(petsById);

  return (
    <section className="pet-canvas" aria-label="Pet habitat">
      {pets.map((pet) => (
        <PetSprite key={pet.id} pet={pet} />
      ))}
    </section>
  );
}

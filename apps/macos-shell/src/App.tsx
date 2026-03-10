import { QuickComposer } from './features/composer/QuickComposer';
import { useQuickComposer } from './features/composer/useQuickComposer';
import { PetCanvas } from './features/habitat/PetCanvas';
import { useHabitatStore } from './features/habitat/store';
import { ResultCard } from './features/results/ResultCard';

export function App() {
  const petsById = useHabitatStore((state) => state.pets);
  const petCount = useHabitatStore((state) => Object.keys(state.pets).length);
  const selectedPetId = useHabitatStore((state) => state.selectedPetId);
  const selectedPet = selectedPetId ? petsById[selectedPetId] : null;
  const submitQuickPrompt = useQuickComposer(selectedPet?.id ?? '');

  return (
    <main className="app-shell">
      <header className="app-shell__header">
        <h1>Agent Habitat</h1>
        <p>Desktop companions for your OpenClaw agents.</p>
      </header>
      {petCount === 0 ? (
        <p>No pets connected</p>
      ) : (
        <div className="app-shell__workspace">
          <PetCanvas />
          {selectedPet ? (
            <aside className="app-shell__sidepanel">
              <QuickComposer
                petName={selectedPet.name ?? selectedPet.agentId}
                onSubmit={submitQuickPrompt}
              />
              {selectedPet.bubbleText ? (
                <ResultCard
                  title={selectedPet.name ?? selectedPet.agentId}
                  body={selectedPet.bubbleText}
                  status={selectedPet.status === 'done' ? 'Done' : 'Working'}
                />
              ) : null}
            </aside>
          ) : null}
        </div>
      )}
    </main>
  );
}

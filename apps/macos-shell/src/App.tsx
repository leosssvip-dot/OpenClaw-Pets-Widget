import { PetCanvas } from './features/habitat/PetCanvas';
import { useHabitatStore } from './features/habitat/store';

export function App() {
  const petCount = useHabitatStore((state) => Object.keys(state.pets).length);

  return (
    <main className="app-shell">
      <header className="app-shell__header">
        <h1>Agent Habitat</h1>
        <p>Desktop companions for your OpenClaw agents.</p>
      </header>
      {petCount === 0 ? <p>No pets connected</p> : <PetCanvas />}
    </main>
  );
}

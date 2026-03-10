import type { PetAgentBinding } from './settings-store';

export function AgentBindings({
  bindings
}: {
  bindings: PetAgentBinding[];
}) {
  return (
    <section className="agent-bindings">
      <div className="section-heading">
        <h2>Bindings</h2>
      </div>
      {bindings.length === 0 ? (
        <p>No agent bindings yet.</p>
      ) : (
        <ul className="agent-bindings__list">
          {bindings.map((binding) => (
            <li key={binding.petId} className="agent-bindings__item">
              <strong>{binding.petId}</strong>
              <span>{binding.agentId}</span>
              <span>{binding.gatewayId}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

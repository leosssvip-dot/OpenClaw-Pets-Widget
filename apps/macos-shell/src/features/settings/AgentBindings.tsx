import type { PetAppearanceConfig } from '../widget/pet-appearance';
import { PET_AVATAR_FORMAT_HELP as petAvatarFormatHelp } from '../widget/pet-appearance';

export function AgentBindings({
  rows,
  onUpdateAppearance
}: {
  rows: Array<{
    petId: string;
    petName?: string;
    agentId: string;
    gatewayId: string;
    status: string;
    isSelected: boolean;
    appearance?: PetAppearanceConfig;
  }>;
  onUpdateAppearance: (petId: string, appearance: PetAppearanceConfig) => void;
}) {
  return (
    <section className="agent-bindings">
      <div className="section-heading">
        <h2>Agents</h2>
      </div>
      <p className="agent-bindings__hint">{petAvatarFormatHelp}</p>
      {rows.length === 0 ? (
        <p>No agent bindings yet.</p>
      ) : (
        <ul className="agent-bindings__list">
          {rows.map((row) => (
            <li key={row.petId} className="agent-bindings__item">
              <div className="agent-bindings__header">
                <strong>{row.petName ?? row.agentId}</strong>
                {row.isSelected ? (
                  <span className="agent-bindings__selected">Selected</span>
                ) : null}
              </div>
              <span>Agent: {row.agentId}</span>
              <span>Gateway: {row.gatewayId}</span>
              <span>Status: {row.status}</span>
              <label className="agent-bindings__appearance">
                <span>Avatar URL</span>
                <input
                  aria-label={`Avatar URL for ${row.petName ?? row.agentId}`}
                  placeholder="https://...png or file:///Users/.../lobster.svg"
                  value={row.appearance?.avatar ?? ''}
                  onChange={(event) =>
                    onUpdateAppearance(row.petId, {
                      avatar: event.currentTarget.value
                    })
                  }
                />
              </label>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

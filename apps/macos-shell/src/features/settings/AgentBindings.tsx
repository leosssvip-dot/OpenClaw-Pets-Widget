import {
  DEFAULT_PET_ROLE_PACK,
  PET_ROLE_PACKS,
  normalizePetRolePack,
  type PetAppearanceConfig,
  type PetRolePackId
} from '../widget/pet-appearance';

function statusLabel(status: string) {
  return status.replace(/-/g, ' ');
}

export function AgentBindings({
  rows,
  displayMode,
  pinnedAgentId,
  onDisplayModeChange,
  onPinnedAgentChange,
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
  displayMode: 'pinned' | 'group';
  pinnedAgentId: string | null;
  onDisplayModeChange: (mode: 'pinned' | 'group') => void;
  onPinnedAgentChange: (agentId: string | null) => void;
  onUpdateAppearance: (petId: string, appearance: PetAppearanceConfig) => void;
}) {
  const resolvedPinnedAgentId = pinnedAgentId ?? rows[0]?.agentId ?? '';

  return (
    <section className="agent-bindings">
      <section className="agent-bindings__group">
        <div className="section-heading">
          <h2>Display</h2>
        </div>
        <fieldset className="agent-bindings__display-mode">
          <legend>Display mode</legend>
          <label>
            <input
              type="radio"
              name="display-mode"
              value="pinned"
              checked={displayMode === 'pinned'}
              onChange={() => onDisplayModeChange('pinned')}
            />
            Single agent
          </label>
          <label>
            <input
              type="radio"
              name="display-mode"
              value="group"
              checked={displayMode === 'group'}
              onChange={() => onDisplayModeChange('group')}
            />
            Group
          </label>
        </fieldset>
        <label className="agent-bindings__pinned-agent">
          <span>Pinned agent</span>
          <select
            aria-label="Pinned agent"
            value={resolvedPinnedAgentId}
            onChange={(event) => onPinnedAgentChange(event.currentTarget.value || null)}
          >
            {rows.length === 0 ? <option value="">No agents available</option> : null}
            {rows.map((row) => (
              <option key={row.agentId} value={row.agentId}>
                {row.petName ?? row.agentId}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="agent-bindings__group">
        <div className="section-heading">
          <h2>Characters</h2>
        </div>
        <p className="agent-bindings__hint">
          Pick an animated role pack for each agent. Every pack responds to the same
          status signals in its own way.
        </p>
        {rows.length === 0 ? (
          <p>No agent bindings yet.</p>
        ) : (
          <ul className="agent-bindings__list">
            {rows.map((row) => {
              const rolePack = normalizePetRolePack(
                row.appearance?.rolePack ?? DEFAULT_PET_ROLE_PACK
              );
              const rolePackMeta =
                PET_ROLE_PACKS.find((pack) => pack.id === rolePack) ?? PET_ROLE_PACKS[0];
              const label = row.petName ?? row.agentId;

              return (
                <li key={row.petId} className="agent-bindings__item">
                  <div className="agent-bindings__header">
                    <div>
                      <strong>{label}</strong>
                      <div className="agent-bindings__meta">
                        <span>Agent: {row.agentId}</span>
                        <span>Gateway: {row.gatewayId}</span>
                      </div>
                    </div>
                    <div className="agent-bindings__status-stack">
                      {row.isSelected ? (
                        <span className="agent-bindings__selected">Selected</span>
                      ) : null}
                      <span className="agent-bindings__status">
                        Status: {statusLabel(row.status)}
                      </span>
                    </div>
                  </div>
                  <div className="agent-bindings__character-card">
                    <span
                      className={`agent-bindings__character-preview agent-bindings__character-preview--${rolePack}`}
                      aria-hidden="true"
                    />
                    <div className="agent-bindings__character-copy">
                      <strong>{rolePackMeta.label}</strong>
                      <span>{rolePackMeta.tagline}</span>
                    </div>
                    <label className="agent-bindings__character-field">
                      <span>Character</span>
                      <select
                        aria-label={`Character for ${label}`}
                        value={rolePack}
                        onChange={(event) =>
                          onUpdateAppearance(row.petId, {
                            rolePack: event.currentTarget.value as PetRolePackId
                          })
                        }
                      >
                        {PET_ROLE_PACKS.map((pack) => (
                          <option key={pack.id} value={pack.id}>
                            {pack.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </section>
  );
}

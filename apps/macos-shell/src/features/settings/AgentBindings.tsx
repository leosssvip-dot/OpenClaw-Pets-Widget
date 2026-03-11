import type { PetAppearanceConfig } from '../widget/pet-appearance';
import { PET_AVATAR_FORMAT_HELP as petAvatarFormatHelp } from '../widget/pet-appearance';

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
      <div className="section-heading">
        <h2>Agents</h2>
      </div>
      <fieldset className="agent-bindings__display-mode">
        <legend>Display Mode</legend>
        <label>
          <input
            type="radio"
            name="display-mode"
            value="pinned"
            checked={displayMode === 'pinned'}
            onChange={() => onDisplayModeChange('pinned')}
          />
          Pinned Agent
        </label>
        <label>
          <input
            type="radio"
            name="display-mode"
            value="group"
            checked={displayMode === 'group'}
            onChange={() => onDisplayModeChange('group')}
          />
          Group Stage
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

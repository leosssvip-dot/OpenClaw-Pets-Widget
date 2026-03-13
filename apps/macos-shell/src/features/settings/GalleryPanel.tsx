import { GROUP_SELECTION_MAX } from './settings-store';
import {
  PET_ROLE_PACKS,
  resolvePetAppearance,
  type PetAppearanceConfig,
  type PetRolePackId
} from '../widget/pet-appearance';
import { DesktopPetIllustration } from '../widget/DesktopPetIllustration';

function statusLabel(status: string) {
  return status.replace(/-/g, ' ');
}

function rolePackMeta(rolePack: PetRolePackId) {
  return PET_ROLE_PACKS.find((pack) => pack.id === rolePack) ?? PET_ROLE_PACKS[0];
}

export interface GalleryPanelProps {
  agentRows: Array<{
    petId: string;
    petName?: string;
    agentId: string;
    gatewayId: string;
    status: string;
    isSelected: boolean;
    appearance?: PetAppearanceConfig;
  }>;
  displayMode: 'pinned' | 'group';
  onDisplayModeChange: (mode: 'pinned' | 'group') => void;
  onUpdateAppearance: (petId: string, appearance: PetAppearanceConfig) => void;
  onPinnedAgentChange: (agentId: string | null) => void;
  /** 点击卡片时切换为该桌宠（Single 模式）或切换 Group 多选（Group 模式） */
  onCompanionSelect?: (agentId: string, petId: string) => void;
  /** Group 模式下已选中的 agentId 列表 */
  groupSelectedAgentIds: string[];
  /** Group 模式下切换某 agent 是否入选 */
  onToggleGroupAgent?: (agentId: string) => void;
  pinnedAgentId: string | null;
}

export function GalleryPanel({
  agentRows,
  displayMode,
  onDisplayModeChange,
  onUpdateAppearance,
  onPinnedAgentChange,
  onCompanionSelect,
  groupSelectedAgentIds,
  onToggleGroupAgent,
  pinnedAgentId
}: GalleryPanelProps) {
  const groupCount = groupSelectedAgentIds.length;
  const isGroupMode = displayMode === 'group';

  return (
    <section className="gallery-panel" aria-label="Companions Gallery">
      <header className="settings-drawer__header" style={{ paddingBottom: '12px' }}>
        <div className="settings-drawer__masthead">
          <div className="settings-drawer__pet-hint" data-testid="settings-pet-hint" aria-hidden="true">
            <span className="settings-drawer__pet-hint-mark" />
          </div>
          <div className="settings-drawer__heading-copy">
            <h3 className="settings-drawer__title">Companions</h3>
            <span className="settings-drawer__subtitle">
              {isGroupMode
                ? `多选，最多 ${GROUP_SELECTION_MAX} 个（${groupCount}/${GROUP_SELECTION_MAX}）`
                : 'Your lovely desktop pets'}
            </span>
          </div>
        </div>
        {isGroupMode && (
          <p className="gallery-panel__group-tip" role="status">
            多选模式，最多可选 {GROUP_SELECTION_MAX} 个。点击卡片添加或移出展示区。
          </p>
        )}
        <fieldset className="gallery-panel__display-mode" aria-label="Display mode">
          <label>
            <input
              type="radio"
              name="gallery-display-mode"
              value="pinned"
              checked={displayMode === 'pinned'}
              onChange={() => onDisplayModeChange('pinned')}
            />
            Single
          </label>
          <label>
            <input
              type="radio"
              name="gallery-display-mode"
              value="group"
              checked={displayMode === 'group'}
              onChange={() => onDisplayModeChange('group')}
            />
            Group
          </label>
        </fieldset>
      </header>
      
      {agentRows.length === 0 ? (
        <div className="app-shell__empty-state" style={{ marginTop: '20px' }}>
          <strong>No companions available</strong>
          <p>Please connect to a gateway first to load your available companions.</p>
        </div>
      ) : (
        <div className="gallery-grid">
          {agentRows.map((row) => {
            const rowRolePack = resolvePetAppearance(row.appearance).rolePack;
            const rowRoleMeta = rolePackMeta(rowRolePack);
            const isFavorite = pinnedAgentId === row.agentId;
            const isInGroup = groupSelectedAgentIds.includes(row.agentId);
            const canAddToGroup = groupCount < GROUP_SELECTION_MAX || isInGroup;
            const isActive =
              (displayMode === 'pinned' && isFavorite) ||
              (displayMode === 'group' && row.isSelected);

            const handleCardClick = () => {
              if (isGroupMode) {
                if (canAddToGroup) onToggleGroupAgent?.(row.agentId);
              } else {
                onCompanionSelect?.(row.agentId, row.petId);
              }
            };

            return (
              <div
                key={row.petId}
                className={`gallery-card ${isActive ? 'gallery-card--active' : ''} ${isGroupMode && isInGroup ? 'gallery-card--in-group' : ''}`}
                role="button"
                tabIndex={0}
                aria-pressed={isGroupMode ? isInGroup : isActive}
                aria-label={isGroupMode ? `${row.petName ?? row.agentId}, ${isInGroup ? 'in group' : 'add to group'}` : `Select ${row.petName ?? row.agentId}`}
                onClick={handleCardClick}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick();
                  }
                }}
              >
                <div className={`gallery-card__avatar gallery-card__avatar--${rowRolePack}`}>
                  {/* Provide the desktop-pet context so that styles.css can apply animation states */}
                  <div
                    className={`desktop-pet desktop-pet--role-${rowRolePack} desktop-pet--activity-${
                      row.status === 'offline' ? 'disconnected' : row.status === 'error' ? 'blocked' : row.status
                    }`}
                    style={{
                      transform: 'scale(0.8)',
                      transformOrigin: 'center center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%'
                    }}
                  >
                    <div className={`desktop-pet__role-art-motion desktop-pet__role-art-motion--${rowRolePack}`}>
                      <DesktopPetIllustration rolePack={rowRolePack} />
                    </div>
                  </div>
                </div>
                
                <div className="gallery-card__content">
                  <div className="gallery-card__head">
                    <h4 className="gallery-card__name">{row.petName ?? row.agentId}</h4>
                    {/* 小圆点表示 agent 运行状态：idle=绿、working=橙、offline=灰、error=红，与是否选中无关 */}
                    <span
                      className={`status-dot status-dot--${row.status}`}
                      title={`Status: ${statusLabel(row.status)}`}
                    />
                  </div>
                  <p className="gallery-card__role">{rowRoleMeta.roleLabel}</p>
                  
                  <div className="gallery-card__actions" onClick={(e) => e.stopPropagation()}>
                    <select
                      className="settings-character-item__select"
                      aria-label={`Character for ${row.petName ?? row.agentId}`}
                      value={rowRolePack}
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

                    <button
                      type="button"
                      className={`gallery-card__pin-btn ${isFavorite ? 'gallery-card__pin-btn--active' : ''}`}
                      onClick={() => onPinnedAgentChange(isFavorite ? null : row.agentId)}
                      title={isFavorite ? "Unpin companion" : "Pin companion to stage"}
                    >
                      {isFavorite ? '★' : '☆'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

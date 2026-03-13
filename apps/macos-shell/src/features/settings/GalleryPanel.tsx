
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
  onUpdateAppearance: (petId: string, appearance: PetAppearanceConfig) => void;
  onPinnedAgentChange: (agentId: string | null) => void;
  /** 点击卡片时切换为该桌宠 */
  onCompanionSelect?: (agentId: string, petId: string) => void;
  pinnedAgentId: string | null;
}

export function GalleryPanel({
  agentRows,
  onUpdateAppearance,
  onPinnedAgentChange,
  onCompanionSelect,
  pinnedAgentId
}: GalleryPanelProps) {

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
              Your lovely desktop pets
            </span>
          </div>
        </div>
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
            const isActive = isFavorite;

            const handleCardClick = () => {
              onCompanionSelect?.(row.agentId, row.petId);
            };

            return (
              <div
                key={row.petId}
                className={`gallery-card ${isActive ? 'gallery-card--active' : ''}`}
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                aria-label={`Select ${row.petName ?? row.agentId}`}
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

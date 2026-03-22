import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConnectionStatus } from '../connection/ConnectionBadge';
import { getHabitatDesktopApi } from '../../runtime/habitat-api';
import { useWidgetStore, widgetStore } from './widget-store';
import { resolvePetAppearance, PET_ROLE_PACKS, type PetAppearanceConfig } from './pet-appearance';
import { resolvePetAnimationState } from './pet-animation-state';
import { PetRenderer } from './PetRenderer';
import { MeritParticles } from './MeritParticles';
import { PetBubble } from './PetBubble';
import { usePetDrag } from './use-pet-drag';
import { useT } from '../../i18n';

const MERIT_INTERVAL: Record<string, number> = {
  idle: 1780,
  thinking: 420,
  working: 420,
  waiting: 2100,
  blocked: 2100,
};

function rolePackMetricCopy(rolePack: (typeof PET_ROLE_PACKS)[number]['id']) {
  return PET_ROLE_PACKS.find((pack) => pack.id === rolePack) ?? PET_ROLE_PACKS[0];
}

export function DesktopPet({
  petName,
  petId,
  connectionStatus,
  appearance,
  petStatus,
  onSendMessage,
  onCreateTask,
  onSwitchCharacter,
}: {
  petName: string;
  petId?: string;
  connectionStatus: ConnectionStatus;
  appearance?: PetAppearanceConfig;
  petStatus?:
    | 'idle'
    | 'thinking'
    | 'working'
    | 'waiting'
    | 'collaborating'
    | 'done'
    | 'blocked'
    | 'disconnected';
  onSendMessage?: (text: string) => void;
  onCreateTask?: (prompt: string) => void;
  onSwitchCharacter?: (rolePackId: string) => void;
}) {
  void onCreateTask;

  const t = useT();
  const isPanelOpen = useWidgetStore((state) => state.isPanelOpen);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isGreeting, setIsGreeting] = useState(false);
  const [bubbleMode, setBubbleMode] = useState<'input' | 'status' | null>(null);
  const [clickSignal, setClickSignal] = useState(0);
  const contextMenuOpenRef = useRef(false);
  const petRef = useRef<HTMLButtonElement | null>(null);
  const greetingTimeoutRef = useRef<number | null>(null);
  const { isDragging, isPressed, wasDrag, handlers: dragHandlers } = usePetDrag();

  const resolvedAppearance = resolvePetAppearance(appearance);
  const rolePackMeta = rolePackMetricCopy(resolvedAppearance.rolePack);
  const animationState = resolvePetAnimationState({
    petStatus,
    connectionStatus,
  });
  const isDisconnected = connectionStatus === 'offline' || connectionStatus === 'auth-expired';
  const stageClassName = `desktop-pet__stage${resolvedAppearance.rolePack === 'monk' ? ' desktop-pet__stage--roomy' : ''}`;

  const supportsRoleMetric = !resolvedAppearance.avatar;
  const showMerit = supportsRoleMetric && !isDisconnected;
  const meritInterval = MERIT_INTERVAL[animationState.activity] ?? 2100;
  const meritInitialDelay =
    animationState.activity === 'idle'
      ? 1060
      : animationState.activity === 'working'
        ? 300
        : 0;

  useEffect(() => {
    return () => {
      if (greetingTimeoutRef.current !== null) {
        window.clearTimeout(greetingTimeoutRef.current);
      }
    };
  }, []);

  function triggerGreeting() {
    if (greetingTimeoutRef.current !== null) {
      window.clearTimeout(greetingTimeoutRef.current);
    }

    setIsGreeting(true);
    greetingTimeoutRef.current = window.setTimeout(() => {
      setIsGreeting(false);
      greetingTimeoutRef.current = null;
    }, 900);
  }

  async function togglePanel() {
    const result = await getHabitatDesktopApi()?.togglePanel();

    if (result) {
      widgetStore.getState().setPanelOpen(result.isOpen);
      return;
    }

    widgetStore.getState().togglePanel();
  }

  const handleContextMenu = useCallback(
    async (event: React.MouseEvent) => {
      event.preventDefault();
      if (contextMenuOpenRef.current) return;
      const api = getHabitatDesktopApi();
      if (!api?.showPetContextMenu) return;

      contextMenuOpenRef.current = true;
      try {
        const items = [
          { id: 'chat', label: t('pet.contextSendMessage') },
          { id: 'settings', label: t('pet.contextSettings') },
          { id: 'sep1', label: '', type: 'separator' as const },
          ...PET_ROLE_PACKS.map((pack) => ({
            id: `switch:${pack.id}`,
            label: t(`role.${pack.id}.label`),
            checked: pack.id === resolvedAppearance.rolePack,
          })),
        ];
        const actionId = await api.showPetContextMenu(items);
        if (actionId === 'chat') {
          api.sendHabitatSync?.({ type: 'openTab', tab: 'chat' });
          await api.showPanel?.();
        } else if (actionId === 'settings') {
          api.sendHabitatSync?.({ type: 'openTab', tab: 'settings' });
          await api.showPanel?.();
        } else if (actionId?.startsWith('switch:')) {
          const rolePackId = actionId.slice('switch:'.length);
          onSwitchCharacter?.(rolePackId);
        }
      } finally {
        contextMenuOpenRef.current = false;
      }
    },
    [resolvedAppearance.rolePack, onSwitchCharacter, t],
  );

  const handleBubbleSend = useCallback(
    (text: string) => {
      if (onSendMessage) {
        onSendMessage(text);
      }
    },
    [onSendMessage],
  );

  const statusTextMap: Record<string, string> = {
    idle: t('pet.idle'),
    thinking: t('pet.thinking'),
    working: t('pet.working'),
    waiting: t('pet.waiting'),
    done: t('pet.done'),
    blocked: t('pet.blocked'),
  };

  return (
    <main className="desktop-pet-shell">
      <PetBubble
        mode={bubbleMode}
        statusText={statusTextMap[animationState.activity] ?? ''}
        onSend={handleBubbleSend}
        onClose={() => setBubbleMode(null)}
      />
      <button
        ref={petRef}
        type="button"
        className={`desktop-pet desktop-pet--frameless desktop-pet--${connectionStatus} desktop-pet--state-${animationState.activity} desktop-pet--activity-${animationState.activity} desktop-pet--mood-${animationState.mood} desktop-pet--role-${resolvedAppearance.rolePack}${isPanelOpen ? ' desktop-pet--active desktop-pet--interaction-panel-open' : ''}${isHovered ? ' desktop-pet--interaction-hovered' : ''}${isPressed ? ' desktop-pet--interaction-pressed' : ''}${isFocused ? ' desktop-pet--interaction-focused' : ''}${isDragging ? ' desktop-pet--interaction-dragging' : ''}${isGreeting ? ' desktop-pet--interaction-greeting' : ''}`}
        aria-label={`${petName} desktop pet`}
        title={t('pet.tooltip')}
        onContextMenu={handleContextMenu}
        onDoubleClick={() => {
          triggerGreeting();
          void togglePanel();
        }}
        onClick={() => {
          if (!wasDrag()) {
            setClickSignal((value) => value + 1);
            setBubbleMode((prev) => (prev === 'input' ? null : 'input'));
          }
        }}
        onFocus={() => {
          setIsFocused(true);
          triggerGreeting();
        }}
        onBlur={() => {
          setIsFocused(false);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            triggerGreeting();
            void togglePanel();
          }
        }}
        onPointerEnter={() => {
          setIsHovered(true);
          triggerGreeting();
        }}
        onPointerLeave={() => {
          setIsHovered(false);
        }}
        {...dragHandlers}
      >
        <span className={stageClassName} aria-hidden="true">
          {resolvedAppearance.avatar ? (
            <span className="desktop-pet__custom-art">
              <img className="desktop-pet__avatar" src={resolvedAppearance.avatar} alt="" />
            </span>
          ) : (
            <PetRenderer
              rolePack={resolvedAppearance.rolePack}
              activity={isDisconnected ? 'blocked' : animationState.activity}
              clickSignal={clickSignal}
              isDimmed={isDisconnected}
            />
          )}
          {supportsRoleMetric ? (
            <MeritParticles
              active={showMerit}
              petId={petId}
              intervalMs={meritInterval}
              initialDelayMs={meritInitialDelay}
              text={rolePackMeta.metricBurst}
              counterLabel={rolePackMeta.metricLabel}
              rolePack={resolvedAppearance.rolePack}
              celebrationEnabled
            />
          ) : null}
        </span>
        <span className="desktop-pet__label">{petName}</span>
      </button>
    </main>
  );
}

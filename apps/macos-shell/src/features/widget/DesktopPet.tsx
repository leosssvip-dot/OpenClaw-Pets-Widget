import { useEffect, useRef, useState } from 'react';
import type { ConnectionStatus } from '../connection/ConnectionBadge';
import { getHabitatDesktopApi } from '../../runtime/habitat-api';
import { useWidgetStore, widgetStore } from './widget-store';
import { resolvePetAppearance, type PetAppearanceConfig } from './pet-appearance';
import { resolvePetAnimationState } from './pet-animation-state';
import { MonkPetSvg } from './MonkPetSvg';

function renderBuiltInPet(rolePack: 'lobster' | 'cat' | 'robot' | 'monk') {
  switch (rolePack) {
    case 'cat':
      return (
        <span className="desktop-pet__cat">
          <span className="desktop-pet__cat-tail" />
          <span className="desktop-pet__cat-body">
            <span className="desktop-pet__cat-ears">
              <span className="desktop-pet__cat-ear desktop-pet__cat-ear--left" />
              <span className="desktop-pet__cat-ear desktop-pet__cat-ear--right" />
            </span>
            <span className="desktop-pet__cat-face">
              <span className="desktop-pet__cat-eye desktop-pet__cat-eye--left" />
              <span className="desktop-pet__cat-eye desktop-pet__cat-eye--right" />
              <span className="desktop-pet__cat-nose" />
              <span className="desktop-pet__cat-mouth" />
              <span className="desktop-pet__cat-whiskers desktop-pet__cat-whiskers--left" />
              <span className="desktop-pet__cat-whiskers desktop-pet__cat-whiskers--right" />
            </span>
          </span>
          <span className="desktop-pet__cat-paw desktop-pet__cat-paw--left" />
          <span className="desktop-pet__cat-paw desktop-pet__cat-paw--right" />
        </span>
      );
    case 'robot':
      return (
        <span className="desktop-pet__robot">
          <span className="desktop-pet__robot-antenna" />
          <span className="desktop-pet__robot-head">
            <span className="desktop-pet__robot-visor">
              <span className="desktop-pet__robot-eye desktop-pet__robot-eye--left" />
              <span className="desktop-pet__robot-eye desktop-pet__robot-eye--right" />
            </span>
            <span className="desktop-pet__robot-mouth" />
          </span>
          <span className="desktop-pet__robot-body">
            <span className="desktop-pet__robot-panel" />
            <span className="desktop-pet__robot-arm desktop-pet__robot-arm--left" />
            <span className="desktop-pet__robot-arm desktop-pet__robot-arm--right" />
            <span className="desktop-pet__robot-leg desktop-pet__robot-leg--left" />
            <span className="desktop-pet__robot-leg desktop-pet__robot-leg--right" />
          </span>
        </span>
      );
    case 'monk':
      return <MonkPetSvg />;
    case 'lobster':
    default:
      return (
        <span className="desktop-pet__lobster">
          <span className="desktop-pet__lobster-antenna desktop-pet__lobster-antenna--left" />
          <span className="desktop-pet__lobster-antenna desktop-pet__lobster-antenna--right" />
          <span className="desktop-pet__lobster-claw desktop-pet__lobster-claw--left" />
          <span className="desktop-pet__lobster-claw desktop-pet__lobster-claw--right" />
          <span className="desktop-pet__lobster-body">
            <span className="desktop-pet__lobster-eye desktop-pet__lobster-eye--left" />
            <span className="desktop-pet__lobster-eye desktop-pet__lobster-eye--right" />
            <span className="desktop-pet__lobster-cheek desktop-pet__lobster-cheek--left" />
            <span className="desktop-pet__lobster-cheek desktop-pet__lobster-cheek--right" />
            <span className="desktop-pet__lobster-mouth" />
          </span>
          <span className="desktop-pet__lobster-tail" />
        </span>
      );
  }
}

export function DesktopPet({
  petName,
  connectionStatus,
  appearance,
  petStatus
}: {
  petName: string;
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
}) {
  const isPanelOpen = useWidgetStore((state) => state.isPanelOpen);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isGreeting, setIsGreeting] = useState(false);
  const dragStateRef = useRef({
    pointerId: null as number | null,
    startX: 0,
    startY: 0,
    isDragging: false,
    lastWindowX: 0,
    lastWindowY: 0
  });
  const greetingTimeoutRef = useRef<number | null>(null);
  const resolvedAppearance = resolvePetAppearance(appearance);
  const animationState = resolvePetAnimationState({
    petStatus,
    connectionStatus
  });
  const stageClassName = `desktop-pet__stage${resolvedAppearance.rolePack === 'monk' ? ' desktop-pet__stage--roomy' : ''}`;

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

  return (
    <main className="desktop-pet-shell">
      <button
        type="button"
        className={`desktop-pet desktop-pet--frameless desktop-pet--${connectionStatus} desktop-pet--state-${animationState.activity} desktop-pet--activity-${animationState.activity} desktop-pet--mood-${animationState.mood} desktop-pet--role-${resolvedAppearance.rolePack}${isPanelOpen ? ' desktop-pet--active desktop-pet--interaction-panel-open' : ''}${isHovered ? ' desktop-pet--interaction-hovered' : ''}${isPressed ? ' desktop-pet--interaction-pressed' : ''}${isFocused ? ' desktop-pet--interaction-focused' : ''}${isDragging ? ' desktop-pet--interaction-dragging' : ''}${isGreeting ? ' desktop-pet--interaction-greeting' : ''}`}
        aria-label={`${petName} desktop pet`}
        title="Drag to move. Double-click to open settings."
        onDoubleClick={() => {
          triggerGreeting();
          void togglePanel();
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
          setIsPressed(false);
        }}
        onPointerDown={(event) => {
          setIsPressed(true);
          dragStateRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            isDragging: false,
            lastWindowX: 0,
            lastWindowY: 0
          };
          event.currentTarget.setPointerCapture?.(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (dragStateRef.current.pointerId !== event.pointerId) {
            return;
          }

          const movedEnough =
            Math.abs(event.clientX - dragStateRef.current.startX) > 6 ||
            Math.abs(event.clientY - dragStateRef.current.startY) > 6;

          if (!movedEnough) {
            return;
          }

          dragStateRef.current.isDragging = true;
          setIsDragging(true);
          dragStateRef.current.lastWindowX = Math.round(
            event.screenX - dragStateRef.current.startX
          );
          dragStateRef.current.lastWindowY = Math.round(
            event.screenY - dragStateRef.current.startY
          );

          void getHabitatDesktopApi()?.movePetWindow({
            x: dragStateRef.current.lastWindowX,
            y: dragStateRef.current.lastWindowY
          });
        }}
        onPointerUp={(event) => {
          if (dragStateRef.current.pointerId !== event.pointerId) {
            return;
          }

          if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
            event.currentTarget.releasePointerCapture?.(event.pointerId);
          }

          setIsPressed(false);
          setIsDragging(false);

          if (dragStateRef.current.isDragging) {
            void getHabitatDesktopApi()?.persistPetWindowPosition({
              x: dragStateRef.current.lastWindowX,
              y: dragStateRef.current.lastWindowY
            });
          }

          dragStateRef.current = {
            pointerId: null,
            startX: 0,
            startY: 0,
            isDragging: false,
            lastWindowX: 0,
            lastWindowY: 0
          };
        }}
        onPointerCancel={(event) => {
          if (dragStateRef.current.pointerId !== event.pointerId) {
            return;
          }

          if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
            event.currentTarget.releasePointerCapture?.(event.pointerId);
          }

          setIsPressed(false);
          setIsDragging(false);

          dragStateRef.current = {
            pointerId: null,
            startX: 0,
            startY: 0,
            isDragging: false,
            lastWindowX: 0,
            lastWindowY: 0
          };
        }}
      >
        <span className={stageClassName} aria-hidden="true">
          <span className="desktop-pet__glow" />
          <span className="desktop-pet__ground" />
          {resolvedAppearance.avatar ? (
            <span className="desktop-pet__custom-art">
              <img className="desktop-pet__avatar" src={resolvedAppearance.avatar} alt="" />
            </span>
          ) : (
            renderBuiltInPet(resolvedAppearance.rolePack)
          )}
        </span>
        <span className="desktop-pet__label">{petName}</span>
      </button>
    </main>
  );
}

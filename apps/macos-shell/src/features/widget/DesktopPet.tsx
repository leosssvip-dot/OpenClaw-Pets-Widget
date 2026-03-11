import { useRef } from 'react';
import type { ConnectionStatus } from '../connection/ConnectionBadge';
import { getHabitatDesktopApi } from '../../runtime/habitat-api';
import { useWidgetStore, widgetStore } from './widget-store';
import { resolvePetAppearance, type PetAppearanceConfig } from './pet-appearance';

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
      return (
        <span className="desktop-pet__monk">
          <span className="desktop-pet__monk-cushion" />
          <span className="desktop-pet__woodfish">
            <span className="desktop-pet__woodfish-slot" />
            <span className="desktop-pet__woodfish-impact" />
          </span>
          <span className="desktop-pet__monk-body">
            <span className="desktop-pet__monk-head">
              <span className="desktop-pet__monk-brow" />
              <span className="desktop-pet__monk-eye desktop-pet__monk-eye--left" />
              <span className="desktop-pet__monk-eye desktop-pet__monk-eye--right" />
              <span className="desktop-pet__monk-mouth" />
            </span>
            <span className="desktop-pet__monk-robe" />
            <span className="desktop-pet__monk-beads" />
            <span className="desktop-pet__monk-arm desktop-pet__monk-arm--left" />
            <span className="desktop-pet__monk-arm desktop-pet__monk-arm--right">
              <span className="desktop-pet__monk-sleeve" />
              <span className="desktop-pet__mallet" />
            </span>
          </span>
        </span>
      );
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
  const dragStateRef = useRef({
    pointerId: null as number | null,
    startX: 0,
    startY: 0,
    isDragging: false,
    lastWindowX: 0,
    lastWindowY: 0
  });
  const resolvedAppearance = resolvePetAppearance(appearance);
  const visualState =
    petStatus === 'collaborating'
      ? 'working'
      : petStatus === 'disconnected'
        ? 'blocked'
        : petStatus ?? 'idle';

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
        className={`desktop-pet desktop-pet--frameless desktop-pet--${connectionStatus} desktop-pet--state-${visualState} desktop-pet--role-${resolvedAppearance.rolePack}${isPanelOpen ? ' desktop-pet--active' : ''}`}
        aria-label={`${petName} desktop pet`}
        title="Drag to move. Double-click to open settings."
        onDoubleClick={() => {
          void togglePanel();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            void togglePanel();
          }
        }}
        onPointerDown={(event) => {
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
        <span className="desktop-pet__stage" aria-hidden="true">
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

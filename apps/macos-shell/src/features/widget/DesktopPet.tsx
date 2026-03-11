import { useRef } from 'react';
import type { ConnectionStatus } from '../connection/ConnectionBadge';
import { getHabitatDesktopApi } from '../../runtime/habitat-api';
import { useWidgetStore, widgetStore } from './widget-store';
import { resolvePetAppearance, type PetAppearanceConfig } from './pet-appearance';

export function DesktopPet({
  petName,
  connectionStatus,
  appearance
}: {
  petName: string;
  connectionStatus: ConnectionStatus;
  appearance?: PetAppearanceConfig;
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
        className={`desktop-pet desktop-pet--frameless desktop-pet--${connectionStatus}${isPanelOpen ? ' desktop-pet--active' : ''}`}
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
          <span className="desktop-pet__antenna desktop-pet__antenna--left" />
          <span className="desktop-pet__antenna desktop-pet__antenna--right" />
          <span className="desktop-pet__claw desktop-pet__claw--left" />
          <span className="desktop-pet__claw desktop-pet__claw--right" />
          <span
            className={`desktop-pet__body${resolvedAppearance.variant === 'custom' ? ' desktop-pet__body--custom' : ''}`}
          >
            {resolvedAppearance.avatar ? (
              <img className="desktop-pet__avatar" src={resolvedAppearance.avatar} alt="" />
            ) : (
              <>
                <span className="desktop-pet__eye-stalk desktop-pet__eye-stalk--left">
                  <span className="desktop-pet__eye" />
                </span>
                <span className="desktop-pet__eye-stalk desktop-pet__eye-stalk--right">
                  <span className="desktop-pet__eye" />
                </span>
                <span className="desktop-pet__shell-mark desktop-pet__shell-mark--left" />
                <span className="desktop-pet__shell-mark desktop-pet__shell-mark--right" />
                <span className="desktop-pet__mouth" />
              </>
            )}
          </span>
          <span className="desktop-pet__tail" />
        </span>
        <span className="desktop-pet__label">{petName}</span>
      </button>
    </main>
  );
}

import { useRef } from 'react';
import type { ConnectionStatus } from '../connection/ConnectionBadge';
import { getHabitatDesktopApi } from '../../runtime/habitat-api';
import { useWidgetStore, widgetStore } from './widget-store';

export function DesktopPet({
  petName,
  connectionStatus
}: {
  petName: string;
  connectionStatus: ConnectionStatus;
}) {
  const isPanelOpen = useWidgetStore((state) => state.isPanelOpen);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  return (
    <main className="desktop-pet-shell">
      <button
        type="button"
        className={`desktop-pet desktop-pet--${connectionStatus}${isPanelOpen ? ' desktop-pet--active' : ''}`}
        aria-label={`${petName} desktop pet`}
        onClick={async () => {
          const result = await getHabitatDesktopApi()?.togglePanel();

          if (result) {
            widgetStore.getState().setPanelOpen(result.isOpen);
            return;
          }

          widgetStore.getState().togglePanel();
        }}
        onPointerDown={(event) => {
          dragOffsetRef.current = {
            x: event.clientX,
            y: event.clientY
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
            return;
          }

          void getHabitatDesktopApi()?.movePetWindow({
            x: Math.round(event.screenX - dragOffsetRef.current.x),
            y: Math.round(event.screenY - dragOffsetRef.current.y)
          });
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }

          void getHabitatDesktopApi()?.snapPetWindow();
        }}
      >
        <span className="desktop-pet__ear desktop-pet__ear--left" aria-hidden="true" />
        <span className="desktop-pet__ear desktop-pet__ear--right" aria-hidden="true" />
        <span className="desktop-pet__face" aria-hidden="true">
          <span className="desktop-pet__eye" />
          <span className="desktop-pet__eye" />
          <span className="desktop-pet__nose" />
        </span>
        <span className="desktop-pet__label">{petName}</span>
      </button>
    </main>
  );
}

import { useRef, useState, useCallback } from 'react';
import { getHabitatDesktopApi } from '../../runtime/habitat-api';

interface DragState {
  pointerId: number | null;
  startX: number;
  startY: number;
  isDragging: boolean;
  lastWindowX: number;
  lastWindowY: number;
}

const INITIAL_DRAG_STATE: DragState = {
  pointerId: null,
  startX: 0,
  startY: 0,
  isDragging: false,
  lastWindowX: 0,
  lastWindowY: 0,
};

const DRAG_THRESHOLD = 6;

export function usePetDrag() {
  const [isDragging, setIsDragging] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const dragRef = useRef<DragState>({ ...INITIAL_DRAG_STATE });

  /** True if the last pointer interaction was a drag (not a click). */
  const wasDrag = useCallback(() => dragRef.current.isDragging, []);

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    setIsPressed(true);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      isDragging: false,
      lastWindowX: 0,
      lastWindowY: 0,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    if (dragRef.current.pointerId !== event.pointerId) return;

    const dx = Math.abs(event.clientX - dragRef.current.startX);
    const dy = Math.abs(event.clientY - dragRef.current.startY);
    if (dx <= DRAG_THRESHOLD && dy <= DRAG_THRESHOLD) return;

    dragRef.current.isDragging = true;
    setIsDragging(true);
    dragRef.current.lastWindowX = Math.round(event.screenX - dragRef.current.startX);
    dragRef.current.lastWindowY = Math.round(event.screenY - dragRef.current.startY);

    void getHabitatDesktopApi()?.movePetWindow({
      x: dragRef.current.lastWindowX,
      y: dragRef.current.lastWindowY,
    });
  }, []);

  const endDrag = useCallback((event: React.PointerEvent) => {
    if (dragRef.current.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }

    setIsPressed(false);
    setIsDragging(false);

    if (dragRef.current.isDragging) {
      void getHabitatDesktopApi()?.persistPetWindowPosition({
        x: dragRef.current.lastWindowX,
        y: dragRef.current.lastWindowY,
      });
    }

    dragRef.current = { ...INITIAL_DRAG_STATE };
  }, []);

  const onPointerUp = endDrag;

  const onPointerCancel = useCallback((event: React.PointerEvent) => {
    if (dragRef.current.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }

    setIsPressed(false);
    setIsDragging(false);
    dragRef.current = { ...INITIAL_DRAG_STATE };
  }, []);

  return {
    isDragging,
    isPressed,
    wasDrag,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  };
}

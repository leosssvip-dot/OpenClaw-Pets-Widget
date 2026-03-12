/**
 * RivePetRenderer — renders a pet character using a .riv file with Rive runtime.
 *
 * Features:
 * - Drives animation state via a "status" Number input on the state machine
 * - Emits "strike" events that the merit particle system listens for
 * - Falls back gracefully if the .riv file fails to load
 */

import { useEffect, useCallback } from 'react';
import { useRive, useStateMachineInput, EventType } from '@rive-app/react-canvas';
import type { Event as RiveEvent } from '@rive-app/react-canvas';
import {
  RIVE_STATE_MACHINE,
  RIVE_STATUS_INPUT,
  RIVE_STRIKE_EVENT,
  ACTIVITY_TO_RIVE_INPUT,
} from './pet-engine';
import type { PetAnimationActivity } from './pet-animation-state';

interface RivePetRendererProps {
  src: string;
  activity: PetAnimationActivity;
  onStrike?: () => void;
  onLoadError?: () => void;
  className?: string;
}

export function RivePetRenderer({
  src,
  activity,
  onStrike,
  onLoadError,
  className = '',
}: RivePetRendererProps) {
  const { rive, RiveComponent } = useRive({
    src,
    stateMachines: RIVE_STATE_MACHINE,
    autoplay: true,
    onLoadError: () => {
      onLoadError?.();
    },
  });

  const statusInput = useStateMachineInput(rive, RIVE_STATE_MACHINE, RIVE_STATUS_INPUT);

  // Sync activity → Rive state machine input
  useEffect(() => {
    if (statusInput) {
      statusInput.value = ACTIVITY_TO_RIVE_INPUT[activity];
    }
  }, [activity, statusInput]);

  // Listen for strike events from the Rive animation
  const handleRiveEvent = useCallback(
    (event: RiveEvent) => {
      const data = event.data as { name?: string } | undefined;
      if (data?.name === RIVE_STRIKE_EVENT) {
        onStrike?.();
      }
    },
    [onStrike],
  );

  useEffect(() => {
    if (!rive) return;
    rive.on(EventType.RiveEvent, handleRiveEvent);
    return () => {
      rive.off(EventType.RiveEvent, handleRiveEvent);
    };
  }, [rive, handleRiveEvent]);

  return (
    <RiveComponent
      className={`desktop-pet__rive-canvas ${className}`}
    />
  );
}

/**
 * RivePetRenderer — renders a pet character using a .riv file with Rive runtime.
 *
 * Features:
 * - Drives animation state via a "status" Number input on the state machine
 * - Emits "strike" events that the merit particle system listens for
 * - Falls back gracefully if the .riv file fails to load
 */

import { useEffect, useCallback, useRef } from 'react';
import {
  useRive,
  useStateMachineInput,
  EventType,
  StateMachineInputType,
} from '@rive-app/react-canvas';
import type { Event as RiveEvent } from '@rive-app/react-canvas';
import {
  RIVE_STATE_MACHINE,
  RIVE_WORKING_INPUT,
  RIVE_CLICK_INPUT,
  RIVE_CLICK_PULSE_MS,
  RIVE_STRIKE_EVENT,
  ACTIVITY_TO_RIVE_BOOLEAN,
} from './pet-engine';
import type { PetAnimationActivity } from './pet-animation-state';

interface RivePetRendererProps {
  src: string;
  activity: PetAnimationActivity;
  clickSignal?: number;
  onStrike?: () => void;
  onLoadError?: () => void;
  className?: string;
}

export function RivePetRenderer({
  src,
  activity,
  clickSignal = 0,
  onStrike,
  onLoadError,
  className = '',
}: RivePetRendererProps) {
  const clickResetTimeoutRef = useRef<number | null>(null);
  const { rive, RiveComponent } = useRive({
    src,
    stateMachines: RIVE_STATE_MACHINE,
    autoplay: true,
    onLoadError: () => {
      onLoadError?.();
    },
  });

  const workingInput = useStateMachineInput(rive, RIVE_STATE_MACHINE, RIVE_WORKING_INPUT);
  const clickInput = useStateMachineInput(rive, RIVE_STATE_MACHINE, RIVE_CLICK_INPUT);

  // Sync activity → Rive state machine input
  useEffect(() => {
    if (workingInput) {
      workingInput.value = ACTIVITY_TO_RIVE_BOOLEAN[activity];
    }
  }, [activity, workingInput]);

  useEffect(() => {
    return () => {
      if (clickResetTimeoutRef.current !== null) {
        window.clearTimeout(clickResetTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (clickSignal <= 0 || !clickInput) {
      return;
    }

    if (clickResetTimeoutRef.current !== null) {
      window.clearTimeout(clickResetTimeoutRef.current);
      clickResetTimeoutRef.current = null;
    }

    if (clickInput.type === StateMachineInputType.Trigger) {
      clickInput.fire();
      return;
    }

    if (clickInput.type === StateMachineInputType.Boolean) {
      clickInput.value = true;
      clickResetTimeoutRef.current = window.setTimeout(() => {
        clickInput.value = false;
        clickResetTimeoutRef.current = null;
      }, RIVE_CLICK_PULSE_MS);
      return () => {
        if (clickResetTimeoutRef.current !== null) {
          window.clearTimeout(clickResetTimeoutRef.current);
          clickResetTimeoutRef.current = null;
        }
      };
    }

    clickInput.value = 1;
    clickResetTimeoutRef.current = window.setTimeout(() => {
      clickInput.value = 0;
      clickResetTimeoutRef.current = null;
    }, RIVE_CLICK_PULSE_MS);
    return () => {
      if (clickResetTimeoutRef.current !== null) {
        window.clearTimeout(clickResetTimeoutRef.current);
        clickResetTimeoutRef.current = null;
      }
    };
  }, [clickInput, clickSignal]);

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

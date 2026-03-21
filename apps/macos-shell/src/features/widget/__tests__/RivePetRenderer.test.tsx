import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RivePetRenderer } from '../RivePetRenderer';
import { RIVE_CLICK_PULSE_MS } from '../pet-engine';

const riveMocks = vi.hoisted(() => {
  const stateInput = { value: false };
  const clickInput = { fire: vi.fn(), type: 58, value: false };
  const rive = {
    on: vi.fn(),
    off: vi.fn(),
  };
  const useRive = vi.fn(() => ({
    rive,
    RiveComponent: ({ className }: { className?: string }) => (
      <div data-testid="rive-canvas" className={className} />
    ),
  }));
  const useStateMachineInput = vi.fn(
    (_rive: unknown, _stateMachine: string, inputName: string) => {
      if (inputName === 'state') {
        return stateInput;
      }

      if (inputName === 'click') {
        return clickInput;
      }

      return null;
    },
  );

  return {
    clickInput,
    rive,
    stateInput,
    useRive,
    useStateMachineInput,
  };
});

vi.mock('@rive-app/react-canvas', () => ({
  EventType: {
    RiveEvent: 'riveevent',
  },
  StateMachineInputType: {
    Number: 56,
    Trigger: 58,
    Boolean: 59,
  },
  useRive: riveMocks.useRive,
  useStateMachineInput: riveMocks.useStateMachineInput,
}));

describe('RivePetRenderer', () => {
  afterEach(() => {
    riveMocks.stateInput.value = false;
    riveMocks.clickInput.fire.mockClear();
    riveMocks.clickInput.type = 58;
    riveMocks.clickInput.value = false;
    riveMocks.rive.on.mockClear();
    riveMocks.rive.off.mockClear();
    riveMocks.useRive.mockClear();
    riveMocks.useStateMachineInput.mockClear();
  });

  it('maps widget activity to the boolean state input and fires click triggers', () => {
    const { rerender } = render(
      <RivePetRenderer src="./assets/pets/robot(1).riv" activity="working" clickSignal={0} />,
    );

    expect(riveMocks.stateInput.value).toBe(true);
    expect(riveMocks.clickInput.fire).not.toHaveBeenCalled();

    rerender(
      <RivePetRenderer src="./assets/pets/robot(1).riv" activity="blocked" clickSignal={1} />,
    );

    expect(riveMocks.stateInput.value).toBe(false);
    expect(riveMocks.clickInput.fire).toHaveBeenCalledTimes(1);
  });

  it('falls back to pulsing non-trigger click inputs so click animations still play', () => {
    vi.useFakeTimers();
    riveMocks.clickInput.type = 59;

    const { rerender } = render(
      <RivePetRenderer src="./assets/pets/robot(1).riv" activity="idle" clickSignal={0} />,
    );

    rerender(
      <RivePetRenderer src="./assets/pets/robot(1).riv" activity="idle" clickSignal={1} />,
    );

    expect(riveMocks.clickInput.value).toBe(true);

    vi.advanceTimersByTime(RIVE_CLICK_PULSE_MS - 1);

    expect(riveMocks.clickInput.value).toBe(true);

    vi.advanceTimersByTime(1);

    expect(riveMocks.clickInput.value).toBe(false);
    vi.useRealTimers();
  });

  it('keeps non-trigger click inputs active long enough to finish the full click animation', () => {
    vi.useFakeTimers();
    riveMocks.clickInput.type = 59;

    const { rerender } = render(
      <RivePetRenderer src="./assets/pets/robot(1).riv" activity="idle" clickSignal={0} />,
    );

    rerender(
      <RivePetRenderer src="./assets/pets/robot(1).riv" activity="idle" clickSignal={1} />,
    );

    vi.advanceTimersByTime(500);

    expect(riveMocks.clickInput.value).toBe(true);
    vi.useRealTimers();
  });
});

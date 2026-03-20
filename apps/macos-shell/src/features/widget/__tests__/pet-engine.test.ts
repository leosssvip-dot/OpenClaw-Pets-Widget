import { describe, expect, it } from 'vitest';
import {
  ACTIVITY_TO_RIVE_BOOLEAN,
  RIVE_CLICK_INPUT,
  RIVE_STATE_MACHINE,
  RIVE_WORKING_INPUT,
  resolveEngine,
} from '../pet-engine';

describe('pet engine rive integration', () => {
  it('prefers the imported rive assets for every built-in role pack', () => {
    expect(resolveEngine('monk')).toEqual(
      expect.objectContaining({
        type: 'rive',
        riveSrc: '/assets/pets/monk(1).riv',
      }),
    );
    expect(resolveEngine('cat')).toEqual(
      expect.objectContaining({
        type: 'rive',
        riveSrc: '/assets/pets/cat(1).riv',
      }),
    );
    expect(resolveEngine('robot')).toEqual(
      expect.objectContaining({
        type: 'rive',
        riveSrc: '/assets/pets/robot(1).riv',
      }),
    );
    expect(resolveEngine('lobster')).toEqual(
      expect.objectContaining({
        type: 'rive',
        riveSrc: '/assets/pets/lobster(1).riv',
      }),
    );
  });

  it('collapses rich widget activities into the boolean rive state input', () => {
    expect(RIVE_STATE_MACHINE).toBe('State Machine 1');
    expect(RIVE_WORKING_INPUT).toBe('state');
    expect(RIVE_CLICK_INPUT).toBe('click');

    expect(ACTIVITY_TO_RIVE_BOOLEAN.working).toBe(true);
    expect(ACTIVITY_TO_RIVE_BOOLEAN.thinking).toBe(true);
    expect(ACTIVITY_TO_RIVE_BOOLEAN.idle).toBe(false);
    expect(ACTIVITY_TO_RIVE_BOOLEAN.waiting).toBe(false);
    expect(ACTIVITY_TO_RIVE_BOOLEAN.done).toBe(false);
    expect(ACTIVITY_TO_RIVE_BOOLEAN.blocked).toBe(false);
  });
});

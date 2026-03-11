import { describe, expect, it, vi } from 'vitest';
import type { BrowserWindow } from 'electron';
import {
  clampPetWindowPosition,
  createPetWindowPositionController
} from '../main';

describe('pet window position persistence', () => {
  it('stores free pet coordinates and restores them without edge snapping', () => {
    const petWindow = {
      getBounds: vi.fn(() => ({
        x: 500,
        y: 120,
        width: 140,
        height: 160
      })),
      setPosition: vi.fn()
    } as unknown as BrowserWindow;
    const display = {
      id: 1,
      workArea: {
        x: 0,
        y: 0,
        width: 1280,
        height: 720
      }
    };
    const screen = {
      getDisplayMatching: vi.fn(() => display),
      getAllDisplays: vi.fn(() => [display])
    };
    const controller = createPetWindowPositionController({
      screen,
      getPetWindow: () => petWindow
    });

    controller.move({ x: 500, y: 120 });
    controller.persist({ x: 500, y: 120 });

    expect(controller.restore()).toEqual({ x: 500, y: 120, displayId: '1' });
    expect(petWindow.setPosition).not.toHaveBeenCalledWith(0, 120);
  });

  it('clamps restored coordinates to the active display work area', () => {
    const display = {
      id: 9,
      workArea: {
        x: 40,
        y: 20,
        width: 400,
        height: 300
      }
    };

    expect(
      clampPetWindowPosition(
        { x: 700, y: 260 },
        {
          getAllDisplays: () => [display],
          getDisplayMatching: () => display
        },
        { width: 140, height: 160 }
      )
    ).toEqual({ x: 300, y: 160, displayId: '9' });
  });
});

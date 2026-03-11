import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { DesktopPet } from '../DesktopPet';
import { widgetStore } from '../widget-store';

function installPointerCaptureMocks(element: HTMLElement) {
  const activePointerIds = new Set<number>();

  Object.defineProperty(element, 'setPointerCapture', {
    value: vi.fn((pointerId: number) => {
      activePointerIds.add(pointerId);
    })
  });
  Object.defineProperty(element, 'hasPointerCapture', {
    value: vi.fn((pointerId: number) => activePointerIds.has(pointerId))
  });
  Object.defineProperty(element, 'releasePointerCapture', {
    value: vi.fn((pointerId: number) => {
      activePointerIds.delete(pointerId);
    })
  });
}

describe('DesktopPet', () => {
  it('moves on drag without opening the panel and only toggles on double click', async () => {
    widgetStore.getState().setPanelOpen(false);
    const togglePanel = vi.fn().mockResolvedValue({ isOpen: true });
    (globalThis as typeof globalThis & {
      habitat?: Record<string, unknown>;
    }).habitat = {
      getRuntimeInfo: vi.fn(),
      prepareGatewayConnection: vi.fn(),
      teardownGatewayConnection: vi.fn(),
      movePetWindow: vi.fn().mockResolvedValue(undefined),
      togglePanel,
      snapPetWindow: vi.fn().mockResolvedValue({ side: 'left' }),
      storeSecret: vi.fn(),
      retrieveSecret: vi.fn(),
      deleteSecret: vi.fn()
    };

    render(<DesktopPet petName="Ruby" connectionStatus="connected" />);

    const pet = screen.getByRole('button', { name: 'Ruby desktop pet' });
    installPointerCaptureMocks(pet);

    fireEvent.pointerDown(pet, {
      pointerId: 1,
      clientX: 20,
      clientY: 24
    });
    fireEvent.pointerMove(pet, {
      pointerId: 1,
      clientX: 52,
      clientY: 64,
      screenX: 252,
      screenY: 264
    });
    fireEvent.pointerUp(pet, {
      pointerId: 1
    });
    fireEvent.click(pet);

    expect(togglePanel).not.toHaveBeenCalled();

    fireEvent.doubleClick(pet);

    await waitFor(() => {
      expect(togglePanel).toHaveBeenCalledTimes(1);
    });
  });
});

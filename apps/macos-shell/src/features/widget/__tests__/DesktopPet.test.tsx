import { createEvent, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { DesktopPet } from '../DesktopPet';
import { widgetStore } from '../widget-store';

function mockHabitatDesktopApi(api: Record<string, unknown>) {
  (globalThis as typeof globalThis & {
    habitat?: Record<string, unknown>;
  }).habitat = {
    getRuntimeInfo: vi.fn(),
    prepareGatewayConnection: vi.fn(),
    teardownGatewayConnection: vi.fn(),
    movePetWindow: vi.fn().mockResolvedValue(undefined),
    persistPetWindowPosition: vi.fn().mockResolvedValue(undefined),
    togglePanel: vi.fn().mockResolvedValue({ isOpen: false }),
    snapPetWindow: vi.fn().mockResolvedValue({ side: 'left' }),
    storeSecret: vi.fn(),
    retrieveSecret: vi.fn(),
    deleteSecret: vi.fn(),
    ...api
  };
}

if (!globalThis.PointerEvent) {
  (globalThis as typeof globalThis & {
    PointerEvent?: typeof PointerEvent;
  }).PointerEvent = MouseEvent as unknown as typeof PointerEvent;
}

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
  it('moves the pet window without snapping on drag end', async () => {
    widgetStore.getState().setPanelOpen(false);
    const movePetWindow = vi.fn().mockResolvedValue(undefined);
    const persistPetWindowPosition = vi.fn().mockResolvedValue(undefined);
    const togglePanel = vi.fn().mockResolvedValue({ isOpen: true });
    const snapPetWindow = vi.fn().mockResolvedValue({ side: 'left' });

    mockHabitatDesktopApi({
      movePetWindow,
      persistPetWindowPosition,
      togglePanel,
      snapPetWindow
    });

    render(<DesktopPet petName="Ruby" connectionStatus="connected" />);

    const pet = screen.getByRole('button', { name: 'Ruby desktop pet' });
    installPointerCaptureMocks(pet);

    expect(pet).toHaveClass('desktop-pet--frameless');
    expect(screen.getByText('Ruby')).toBeInTheDocument();
    expect(document.querySelector('.desktop-pet__bubble')).toBeNull();
    expect(screen.queryByText('connected')).not.toBeInTheDocument();

    fireEvent(
      pet,
      createEvent.pointerDown(pet, {
        pointerId: 1,
        buttons: 1,
        clientX: 20,
        clientY: 24
      })
    );
    fireEvent(
      pet,
      createEvent.pointerMove(pet, {
        pointerId: 1,
        buttons: 1,
        clientX: 52,
        clientY: 64,
        screenX: 252,
        screenY: 264
      })
    );
    fireEvent(
      pet,
      createEvent.pointerUp(pet, {
        pointerId: 1
      })
    );
    fireEvent.click(pet);

    expect(movePetWindow).toHaveBeenCalledWith({ x: 232, y: 240 });
    expect(persistPetWindowPosition).toHaveBeenCalledTimes(1);
    expect(persistPetWindowPosition).toHaveBeenCalledWith({ x: 232, y: 240 });
    expect(snapPetWindow).not.toHaveBeenCalled();
    expect(togglePanel).not.toHaveBeenCalled();

    fireEvent.doubleClick(pet);

    await waitFor(() => {
      expect(togglePanel).toHaveBeenCalledTimes(1);
    });
  });

  it('applies a visual state class for richer pet animation states', () => {
    widgetStore.getState().setPanelOpen(false);
    mockHabitatDesktopApi({
      togglePanel: vi.fn().mockResolvedValue({ isOpen: false })
    });

    render(
      <DesktopPet
        petName="Ruby"
        connectionStatus="connected"
        petStatus="working"
      />
    );

    expect(screen.getByRole('button', { name: 'Ruby desktop pet' })).toHaveClass(
      'desktop-pet--state-working'
    );
  });

  it('applies a role-pack class for non-default character rendering', () => {
    widgetStore.getState().setPanelOpen(false);
    mockHabitatDesktopApi({
      togglePanel: vi.fn().mockResolvedValue({ isOpen: false })
    });

    render(
      <DesktopPet
        petName="Zen"
        connectionStatus="connected"
        appearance={{
          rolePack: 'monk'
        }}
      />
    );

    expect(screen.getByRole('button', { name: 'Zen desktop pet' })).toHaveClass(
      'desktop-pet--role-monk'
    );
  });

  it('renders dedicated monk anatomy with a wooden-fish rig', () => {
    widgetStore.getState().setPanelOpen(false);
    mockHabitatDesktopApi({
      togglePanel: vi.fn().mockResolvedValue({ isOpen: false })
    });

    const { container } = render(
      <DesktopPet
        petName="Zen"
        connectionStatus="connected"
        appearance={{
          rolePack: 'monk'
        }}
        petStatus="working"
      />
    );

    expect(container.querySelector('.desktop-pet__monk')).toBeInTheDocument();
    expect(container.querySelector('.desktop-pet__monk-head')).toBeInTheDocument();
    expect(container.querySelector('.desktop-pet__woodfish')).toBeInTheDocument();
    expect(container.querySelector('.desktop-pet__mallet')).toBeInTheDocument();
    expect(container.querySelector('.desktop-pet__woodfish-impact')).toBeInTheDocument();
    expect(container.querySelector('.desktop-pet__monk-sleeve')).toBeInTheDocument();
  });

  it('uses distinct markup for each built-in role pack instead of one shared body', () => {
    widgetStore.getState().setPanelOpen(false);
    mockHabitatDesktopApi({
      togglePanel: vi.fn().mockResolvedValue({ isOpen: false })
    });

    const { container, rerender } = render(
      <DesktopPet
        petName="Ruby"
        connectionStatus="connected"
        appearance={{
          rolePack: 'lobster'
        }}
      />
    );

    expect(container.querySelector('.desktop-pet__lobster')).toBeInTheDocument();

    rerender(
      <DesktopPet
        petName="Miso"
        connectionStatus="connected"
        appearance={{
          rolePack: 'cat'
        }}
      />
    );
    expect(container.querySelector('.desktop-pet__cat')).toBeInTheDocument();

    rerender(
      <DesktopPet
        petName="Unit-7"
        connectionStatus="connected"
        appearance={{
          rolePack: 'robot'
        }}
      />
    );
    expect(container.querySelector('.desktop-pet__robot')).toBeInTheDocument();
  });
});

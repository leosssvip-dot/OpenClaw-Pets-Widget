import { createEvent, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { DesktopPet } from '../DesktopPet';
import { widgetStore } from '../widget-store';

const petRendererSpy = vi.hoisted(() => vi.fn());
const meritParticlesSpy = vi.hoisted(() => vi.fn());

vi.mock('../PetRenderer', () => ({
  PetRenderer: (props: {
    activity: string;
    clickSignal?: number;
    isDimmed?: boolean;
    rolePack: string;
  }) => {
    petRendererSpy(props);
    return (
      <div
        data-testid="pet-renderer"
        data-activity={props.activity}
        data-click-signal={String(props.clickSignal ?? 0)}
        data-dimmed={String(props.isDimmed ?? false)}
        data-role-pack={props.rolePack}
      />
    );
  }
}));

vi.mock('../MeritParticles', () => ({
  MeritParticles: (props: {
    active: boolean;
    petId?: string;
    intervalMs?: number;
    initialDelayMs?: number;
    text?: string;
    counterLabel?: string;
  }) => {
    meritParticlesSpy(props);
    return (
      <div
        data-testid="merit-particles"
        data-active={String(props.active)}
        data-pet-id={props.petId ?? ''}
        data-text={props.text ?? ''}
        data-counter-label={props.counterLabel ?? ''}
      />
    );
  }
}));

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
    showPanel: vi.fn().mockResolvedValue({ isOpen: true }),
    snapPetWindow: vi.fn().mockResolvedValue({ side: 'left' }),
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
  beforeEach(() => {
    petRendererSpy.mockClear();
    meritParticlesSpy.mockClear();
  });

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
    expect(document.querySelector('.desktop-pet__ground')).toBeNull();
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

  it('applies layered activity and mood classes for agent states', () => {
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
      'desktop-pet--activity-working'
    );
    expect(screen.getByRole('button', { name: 'Ruby desktop pet' })).toHaveClass(
      'desktop-pet--mood-focused'
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

  it('renders the monk through the shared pet renderer instead of legacy svg animation', () => {
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
        petStatus="working"
      />
    );

    expect(screen.getByTestId('pet-renderer')).toHaveAttribute('data-role-pack', 'monk');
    expect(screen.getByTestId('pet-renderer')).toHaveAttribute('data-activity', 'working');
    expect(screen.queryByText('功德+1')).not.toBeInTheDocument();
  });

  it('does not start a legacy gsap timeline for the monk working state', () => {
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
        petStatus="working"
      />
    );

    expect(screen.getByRole('button', { name: 'Zen desktop pet' })).not.toHaveClass(
      'desktop-pet--monk-gsap'
    );
    expect(screen.queryByText('功德+1')).not.toBeInTheDocument();
  });

  it('uses the shared renderer for all built-in role packs instead of legacy shared svg art', () => {
    widgetStore.getState().setPanelOpen(false);
    mockHabitatDesktopApi({
      togglePanel: vi.fn().mockResolvedValue({ isOpen: false })
    });

    const { rerender } = render(
      <DesktopPet
        petName="Ruby"
        connectionStatus="connected"
        appearance={{
          rolePack: 'lobster'
        }}
      />
    );

    expect(screen.getByTestId('pet-renderer')).toHaveAttribute('data-role-pack', 'lobster');

    rerender(
      <DesktopPet
        petName="Miso"
        connectionStatus="connected"
        appearance={{
          rolePack: 'cat'
        }}
      />
    );
    expect(screen.getByTestId('pet-renderer')).toHaveAttribute('data-role-pack', 'cat');

    rerender(
      <DesktopPet
        petName="Unit-7"
        connectionStatus="connected"
        appearance={{
          rolePack: 'robot'
        }}
      />
    );
    expect(screen.getByTestId('pet-renderer')).toHaveAttribute('data-role-pack', 'robot');
  });

  it('applies owner interaction classes for hover, press, focus, and drag', () => {
    widgetStore.getState().setPanelOpen(false);
    mockHabitatDesktopApi({
      togglePanel: vi.fn().mockResolvedValue({ isOpen: false })
    });

    render(<DesktopPet petName="Ruby" connectionStatus="connected" />);

    const pet = screen.getByRole('button', { name: 'Ruby desktop pet' });
    installPointerCaptureMocks(pet);

    fireEvent.pointerEnter(pet);
    expect(pet).toHaveClass('desktop-pet--interaction-hovered');

    fireEvent.pointerDown(
      pet,
      createEvent.pointerDown(pet, {
        pointerId: 7,
        buttons: 1,
        clientX: 18,
        clientY: 20
      })
    );
    expect(pet).toHaveClass('desktop-pet--interaction-pressed');

    fireEvent.focus(pet);
    expect(pet).toHaveClass('desktop-pet--interaction-focused');

    fireEvent(
      pet,
      createEvent.pointerMove(pet, {
        pointerId: 7,
        buttons: 1,
        clientX: 42,
        clientY: 50,
        screenX: 202,
        screenY: 218
      })
    );
    expect(pet).toHaveClass('desktop-pet--interaction-dragging');

    fireEvent(
      pet,
      createEvent.pointerUp(pet, {
        pointerId: 7
      })
    );
    expect(pet).not.toHaveClass('desktop-pet--interaction-pressed');
    expect(pet).not.toHaveClass('desktop-pet--interaction-dragging');

    fireEvent.blur(pet);
    fireEvent.pointerLeave(pet);
    expect(pet).not.toHaveClass('desktop-pet--interaction-hovered');
    expect(pet).not.toHaveClass('desktop-pet--interaction-focused');
  });

  it('shows a role-specific metric overlay for non-monk pets', () => {
    widgetStore.getState().setPanelOpen(false);
    mockHabitatDesktopApi({
      togglePanel: vi.fn().mockResolvedValue({ isOpen: false })
    });

    const { rerender } = render(
      <DesktopPet
        petName="Unit-7"
        petId="pet-robot"
        connectionStatus="connected"
        appearance={{ rolePack: 'robot' }}
      />
    );

    expect(screen.getByTestId('merit-particles')).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('merit-particles')).toHaveAttribute('data-pet-id', 'pet-robot');
    expect(screen.getByTestId('merit-particles')).toHaveAttribute('data-text', '巡检+1');
    expect(screen.getByTestId('merit-particles')).toHaveAttribute('data-counter-label', '巡检');
  });

  it('keeps monk-specific metric copy for the monk role pack', () => {
    widgetStore.getState().setPanelOpen(false);
    mockHabitatDesktopApi({
      togglePanel: vi.fn().mockResolvedValue({ isOpen: false })
    });

    render(
      <DesktopPet
        petName="Zen"
        petId="pet-monk"
        connectionStatus="connected"
        appearance={{ rolePack: 'monk' }}
      />
    );

    expect(screen.getByTestId('merit-particles')).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('merit-particles')).toHaveAttribute('data-pet-id', 'pet-monk');
    expect(screen.getByTestId('merit-particles')).toHaveAttribute('data-text', '功德+1');
    expect(screen.getByTestId('merit-particles')).toHaveAttribute('data-counter-label', '功德');
  });

  it('keeps monk merit mounted but inactive when the monk is disconnected', () => {
    widgetStore.getState().setPanelOpen(false);
    mockHabitatDesktopApi({
      togglePanel: vi.fn().mockResolvedValue({ isOpen: false })
    });

    render(
      <DesktopPet
        petName="Zen"
        petId="pet-monk"
        connectionStatus="offline"
        appearance={{ rolePack: 'monk' }}
      />
    );

    expect(screen.getByTestId('merit-particles')).toHaveAttribute('data-active', 'false');
  });
});

import { createEvent, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { vi } from 'vitest';
import { DesktopPet } from '../DesktopPet';
import { widgetStore } from '../widget-store';

const gsapMocks = vi.hoisted(() => {
  const timelineApi = {
    addLabel: vi.fn(),
    set: vi.fn(),
    to: vi.fn(),
    kill: vi.fn()
  };
  timelineApi.addLabel.mockImplementation(() => timelineApi);
  timelineApi.set.mockImplementation(() => timelineApi);
  timelineApi.to.mockImplementation(() => timelineApi);

  const gsapRevert = vi.fn();
  const gsapTimeline = vi.fn(() => timelineApi);
  const gsapContext = vi.fn((callback: () => void) => {
    callback();
    return {
      revert: gsapRevert
    };
  });

  return {
    timelineApi,
    gsapRevert,
    gsapTimeline,
    gsapContext
  };
});

vi.mock('gsap', () => ({
  gsap: {
    context: gsapMocks.gsapContext,
    timeline: gsapMocks.gsapTimeline
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
  beforeEach(() => {
    gsapMocks.gsapTimeline.mockClear();
    gsapMocks.gsapContext.mockClear();
    gsapMocks.gsapRevert.mockClear();
    gsapMocks.timelineApi.addLabel.mockClear();
    gsapMocks.timelineApi.set.mockClear();
    gsapMocks.timelineApi.to.mockClear();
    gsapMocks.timelineApi.kill.mockClear();
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

  it('renders the monk with the shared role-pack SVG art', () => {
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

    expect(container.querySelector('.desktop-pet__art')).toBeInTheDocument();
    expect(container.querySelector('.desktop-pet__role-art-motion')).toBeInTheDocument();
    expect(container.querySelector('.desktop-pet__art--monk')).toBeInTheDocument();
    expect(container.querySelector('.desktop-pet__art-svg')).toBeInTheDocument();
    expect(container.querySelector('.desktop-pet__art-backdrop')).toBeNull();
    expect(container.querySelector('.desktop-pet__monk-rig')).toBeInTheDocument();
    expect(container.querySelector('.desktop-pet__monk-breath-halo')).toBeInTheDocument();
    expect(container.querySelector('.desktop-pet__monk-arm--right')).toBeInTheDocument();
    expect(container.querySelector('.desktop-pet__mallet')).toBeInTheDocument();
    expect(container.querySelector('.desktop-pet__woodfish-impact')).toBeInTheDocument();
    expect(container.querySelector('.desktop-pet__woodfish-echo')).toBeInTheDocument();
    expect(container.querySelector('.desktop-pet__merit-badge')).toHaveTextContent('功德+1');
    expect(container.querySelector('.desktop-pet__stage--roomy')).toBeInTheDocument();
  });

  it('builds a GSAP strike timeline for the monk working state', () => {
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

    expect(gsapMocks.gsapContext).toHaveBeenCalledTimes(1);
    expect(gsapMocks.gsapTimeline).toHaveBeenCalledWith(
      expect.objectContaining({
        paused: false,
        repeat: -1
      })
    );
    expect(gsapMocks.timelineApi.to).toHaveBeenCalled();
  });

  it('uses distinct shared SVG art for each built-in role pack', () => {
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

    expect(container.querySelector('.desktop-pet__art--lobster')).toBeInTheDocument();

    rerender(
      <DesktopPet
        petName="Miso"
        connectionStatus="connected"
        appearance={{
          rolePack: 'cat'
        }}
      />
    );
    expect(container.querySelector('.desktop-pet__art--cat')).toBeInTheDocument();

    rerender(
      <DesktopPet
        petName="Unit-7"
        connectionStatus="connected"
        appearance={{
          rolePack: 'robot'
        }}
      />
    );
    expect(container.querySelector('.desktop-pet__art--robot')).toBeInTheDocument();
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

  it('keeps monk tapping rules active even when offline maps to blocked activity', () => {
    const testDir = dirname(fileURLToPath(import.meta.url));
    const styles = readFileSync(
      resolve(testDir, '../../../styles.css'),
      'utf8'
    );

    expect(styles).toContain(
      '.desktop-pet--role-monk.desktop-pet--activity-blocked .desktop-pet__monk-arm--right'
    );
    expect(styles).toContain(
      '.desktop-pet--role-monk.desktop-pet--activity-blocked .desktop-pet__woodfish-impact'
    );
  });
});

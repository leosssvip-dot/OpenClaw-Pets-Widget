import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DesktopPet } from '../DesktopPet';
import { widgetStore } from '../widget-store';

const petRendererSpy = vi.hoisted(() => vi.fn());

vi.mock('../PetRenderer', () => ({
  PetRenderer: (props: {
    activity: string;
    clickSignal: number;
    isDimmed: boolean;
    rolePack: string;
  }) => {
    petRendererSpy(props);
    return (
      <div
        data-testid="pet-renderer"
        data-activity={props.activity}
        data-click-signal={String(props.clickSignal)}
        data-dimmed={String(props.isDimmed)}
        data-role-pack={props.rolePack}
      />
    );
  },
}));

const gsapMocks = vi.hoisted(() => ({
  context: vi.fn(() => ({
    revert: vi.fn(),
  })),
  timeline: vi.fn(() => ({
    addLabel: vi.fn(),
    fromTo: vi.fn(),
    kill: vi.fn(),
    set: vi.fn(),
    to: vi.fn(),
  })),
}));

vi.mock('gsap', () => ({
  gsap: gsapMocks,
}));

function mockHabitatDesktopApi() {
  (globalThis as typeof globalThis & {
    habitat?: Record<string, unknown>;
  }).habitat = {
    movePetWindow: vi.fn().mockResolvedValue(undefined),
    persistPetWindowPosition: vi.fn().mockResolvedValue(undefined),
    showPanel: vi.fn().mockResolvedValue({ isOpen: true }),
    snapPetWindow: vi.fn().mockResolvedValue({ side: 'left' }),
    togglePanel: vi.fn().mockResolvedValue({ isOpen: false }),
  };
}

describe('DesktopPet rive bridge', () => {
  beforeEach(() => {
    widgetStore.getState().setPanelOpen(false);
    petRendererSpy.mockClear();
    mockHabitatDesktopApi();
  });

  it('passes click pulses through to the pet renderer without breaking click-to-chat', () => {
    render(
      <DesktopPet
        petName="Unit-7"
        connectionStatus="connected"
        appearance={{ rolePack: 'robot' }}
      />,
    );

    const pet = screen.getByRole('button', { name: 'Unit-7 desktop pet' });
    expect(screen.getByTestId('pet-renderer')).toHaveAttribute('data-click-signal', '0');

    fireEvent.click(pet);

    expect(screen.getByTestId('pet-renderer')).toHaveAttribute('data-click-signal', '1');
    expect(screen.getByTestId('pet-renderer')).toHaveAttribute('data-role-pack', 'robot');
  });

  it('marks disconnected pets as dimmed while preserving blocked semantics upstream', () => {
    render(
      <DesktopPet
        petName="Unit-7"
        connectionStatus="offline"
        appearance={{ rolePack: 'robot' }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Unit-7 desktop pet' })).toHaveClass(
      'desktop-pet--offline',
    );
    expect(screen.getByTestId('pet-renderer')).toHaveAttribute('data-activity', 'blocked');
    expect(screen.getByTestId('pet-renderer')).toHaveAttribute('data-dimmed', 'true');
  });
});

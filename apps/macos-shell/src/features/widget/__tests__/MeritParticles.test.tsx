import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MeritParticles } from '../MeritParticles';

// Mock the merit store to avoid localStorage issues in tests
vi.mock('../merit-store', () => {
  let counts: Record<string, number> = {};
  return {
    meritStore: {
      getState: () => ({
        counts,
        increment: (petId: string) => {
          const prev = counts[petId] ?? 0;
          counts[petId] = prev + 1;
          return prev + 1;
        },
        totalMerit: () => Object.values(counts).reduce((s, n) => s + n, 0),
      }),
    },
    useMeritStore: (selector: (state: { counts: Record<string, number> }) => number) => {
      return selector({ counts });
    },
    createMeritStore: vi.fn(),
  };
});

// Mock the celebration component to simplify tests
vi.mock('../MeritCelebration', () => ({
  MeritCelebration: ({ milestone }: { milestone: unknown }) =>
    milestone ? <div data-testid="celebration" /> : null,
}));

describe('MeritParticles', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when inactive', () => {
    const { container } = render(<MeritParticles active={false} />);
    expect(container.querySelector('.merit-particles__item')).toBeNull();
  });

  it('spawns a particle immediately when activated', () => {
    const { container } = render(
      <MeritParticles active={true} petId="test-pet" intervalMs={2000} />
    );
    expect(container.querySelectorAll('.merit-particles__item').length).toBe(1);
  });

  it('spawns additional particles at the interval', () => {
    const { container } = render(
      <MeritParticles active={true} petId="test-pet" intervalMs={1000} />
    );

    // Initial particle
    expect(container.querySelectorAll('.merit-particles__item').length).toBe(1);

    // After one interval
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(container.querySelectorAll('.merit-particles__item').length).toBe(2);

    // After another interval
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(container.querySelectorAll('.merit-particles__item').length).toBe(3);
  });

  it('stops spawning when deactivated', () => {
    const { container, rerender } = render(
      <MeritParticles active={true} petId="test-pet" intervalMs={1000} />
    );

    expect(container.querySelectorAll('.merit-particles__item').length).toBe(1);

    rerender(
      <MeritParticles active={false} petId="test-pet" intervalMs={1000} />
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // No new particles spawned after deactivation
    expect(container.querySelectorAll('.merit-particles__item').length).toBe(1);
  });

  it('uses custom text', () => {
    const { container } = render(
      <MeritParticles active={true} text="善哉+1" />
    );
    expect(container.querySelector('.merit-particles__item')?.textContent).toBe('善哉+1');
  });

  it('waits for the first strike when an initial delay is provided', () => {
    const { container } = render(
      <MeritParticles active={true} petId="test-pet" intervalMs={1780} initialDelayMs={1080} />
    );

    expect(container.querySelectorAll('.merit-particles__item').length).toBe(0);

    act(() => {
      vi.advanceTimersByTime(1079);
    });
    expect(container.querySelectorAll('.merit-particles__item').length).toBe(0);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(container.querySelectorAll('.merit-particles__item').length).toBe(1);
  });
});

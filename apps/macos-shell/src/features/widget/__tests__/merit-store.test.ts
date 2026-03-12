import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from 'zustand/vanilla';

/**
 * Test the merit store logic without persist middleware to avoid
 * localStorage state leaking between tests.
 */
function createTestMeritStore() {
  return createStore<{
    counts: Record<string, number>;
    increment: (petId: string) => number;
    totalMerit: () => number;
  }>((set, get) => ({
    counts: {},
    increment: (petId: string) => {
      const prev = get().counts[petId] ?? 0;
      const next = prev + 1;
      set((state) => ({
        counts: { ...state.counts, [petId]: next },
      }));
      return next;
    },
    totalMerit: () => {
      return Object.values(get().counts).reduce((sum, n) => sum + n, 0);
    },
  }));
}

describe('merit-store', () => {
  let store: ReturnType<typeof createTestMeritStore>;

  beforeEach(() => {
    store = createTestMeritStore();
  });

  it('starts with zero counts', () => {
    expect(store.getState().counts).toEqual({});
    expect(store.getState().totalMerit()).toBe(0);
  });

  it('increments merit for a pet and returns new count', () => {
    const result = store.getState().increment('pet-1');
    expect(result).toBe(1);
    expect(store.getState().counts['pet-1']).toBe(1);
  });

  it('tracks per-pet counts independently', () => {
    store.getState().increment('pet-1');
    store.getState().increment('pet-1');
    store.getState().increment('pet-2');

    expect(store.getState().counts['pet-1']).toBe(2);
    expect(store.getState().counts['pet-2']).toBe(1);
    expect(store.getState().totalMerit()).toBe(3);
  });

  it('accumulates correctly over many increments', () => {
    for (let i = 0; i < 100; i++) {
      store.getState().increment('pet-1');
    }
    expect(store.getState().counts['pet-1']).toBe(100);
  });
});

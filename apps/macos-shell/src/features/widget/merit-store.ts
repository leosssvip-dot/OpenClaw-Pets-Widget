/**
 * Merit Store — cumulative 功德 counter per pet.
 *
 * Persists to localStorage so the merit count survives restarts.
 * Each woodfish strike increments the counter.
 */

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const MERIT_STORAGE_KEY = 'openclaw-merit-counter';

interface MeritState {
  /** Total merit per petId */
  counts: Record<string, number>;
  /** Increment merit for a pet. Returns the new total. */
  increment: (petId: string) => number;
  /** Get total across all pets */
  totalMerit: () => number;
}

export const createMeritStore = () =>
  createStore<MeritState>()(
    persist(
      (set, get) => ({
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
      }),
      {
        name: MERIT_STORAGE_KEY,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ counts: state.counts }),
      },
    ),
  );

export const meritStore = createMeritStore();

export function useMeritStore<T>(selector: (state: MeritState) => T) {
  return useStore(meritStore, selector);
}

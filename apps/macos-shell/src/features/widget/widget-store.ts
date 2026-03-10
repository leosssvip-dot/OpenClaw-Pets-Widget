import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';

interface WidgetState {
  isPanelOpen: boolean;
  togglePanel: () => void;
  setPanelOpen: (value: boolean) => void;
}

export const createWidgetStore = () =>
  createStore<WidgetState>((set) => ({
    isPanelOpen: false,
    togglePanel: () =>
      set((state) => ({
        isPanelOpen: !state.isPanelOpen
      })),
    setPanelOpen: (value) =>
      set({
        isPanelOpen: value
      })
  }));

export const widgetStore = createWidgetStore();

export function useWidgetStore<T>(selector: (state: WidgetState) => T) {
  return useStore(widgetStore, selector);
}

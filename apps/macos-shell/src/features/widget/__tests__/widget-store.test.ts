import { describe, expect, it } from 'vitest';
import { createWidgetStore } from '../widget-store';

describe('createWidgetStore', () => {
  it('opens the control panel when the pet is toggled', () => {
    const store = createWidgetStore();

    store.getState().togglePanel();

    expect(store.getState().isPanelOpen).toBe(true);
  });
});

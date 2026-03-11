import { describe, expect, it } from 'vitest';
import { createSettingsStore } from '../settings-store';

describe('display mode settings', () => {
  it('stores display mode and pinned agent selection', () => {
    const store = createSettingsStore();

    store.getState().setDisplayMode('group');
    store.getState().setPinnedAgentId('ad-expert');

    expect(store.getState().displayMode).toBe('group');
    expect(store.getState().pinnedAgentId).toBe('ad-expert');
  });
});

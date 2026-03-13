import { describe, expect, it } from 'vitest';
import { createSettingsStore } from '../settings-store';

describe('pinned agent settings', () => {
  it('stores pinned agent selection', () => {
    const store = createSettingsStore();

    store.getState().setPinnedAgentId('ad-expert');

    expect(store.getState().pinnedAgentId).toBe('ad-expert');
  });
});

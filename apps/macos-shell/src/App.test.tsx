import { describe, expect, it, vi } from 'vitest';
import { hydrateAndReconnectActiveProfile } from './App';

describe('hydrateAndReconnectActiveProfile', () => {
  it('hydrates stored tokens before reconnecting the active profile from the panel surface', async () => {
    const hydrateTokens = vi.fn().mockResolvedValue(undefined);
    const getActiveProfileId = vi.fn().mockReturnValue('remote-1');
    const reconnectProfile = vi.fn().mockResolvedValue(undefined);
    const markReconnectAttempted = vi.fn();

    await hydrateAndReconnectActiveProfile(
      'panel',
      false,
      hydrateTokens,
      markReconnectAttempted,
      getActiveProfileId,
      reconnectProfile
    );

    expect(markReconnectAttempted).toHaveBeenCalledTimes(1);
    expect(hydrateTokens).toHaveBeenCalledTimes(1);
    expect(getActiveProfileId).toHaveBeenCalledTimes(1);
    expect(reconnectProfile).toHaveBeenCalledWith('remote-1');
    expect(
      hydrateTokens.mock.invocationCallOrder[0]
    ).toBeLessThan(reconnectProfile.mock.invocationCallOrder[0]);
  });

  it('skips reconnect when there is no active profile', async () => {
    const hydrateTokens = vi.fn().mockResolvedValue(undefined);
    const reconnectProfile = vi.fn().mockResolvedValue(undefined);
    const markReconnectAttempted = vi.fn();

    await hydrateAndReconnectActiveProfile(
      'panel',
      false,
      hydrateTokens,
      markReconnectAttempted,
      () => null,
      reconnectProfile
    );

    expect(markReconnectAttempted).toHaveBeenCalledTimes(1);
    expect(hydrateTokens).toHaveBeenCalledTimes(1);
    expect(reconnectProfile).not.toHaveBeenCalled();
  });

  it('does not auto reconnect from the pet surface', async () => {
    const hydrateTokens = vi.fn().mockResolvedValue(undefined);
    const reconnectProfile = vi.fn().mockResolvedValue(undefined);
    const markReconnectAttempted = vi.fn();

    await hydrateAndReconnectActiveProfile(
      'pet',
      false,
      hydrateTokens,
      markReconnectAttempted,
      () => 'remote-1',
      reconnectProfile
    );

    expect(markReconnectAttempted).not.toHaveBeenCalled();
    expect(hydrateTokens).not.toHaveBeenCalled();
    expect(reconnectProfile).not.toHaveBeenCalled();
  });

  it('does not auto reconnect more than once per renderer startup', async () => {
    const hydrateTokens = vi.fn().mockResolvedValue(undefined);
    const reconnectProfile = vi.fn().mockResolvedValue(undefined);
    const markReconnectAttempted = vi.fn();

    await hydrateAndReconnectActiveProfile(
      'panel',
      true,
      hydrateTokens,
      markReconnectAttempted,
      () => 'remote-1',
      reconnectProfile
    );

    expect(markReconnectAttempted).not.toHaveBeenCalled();
    expect(hydrateTokens).not.toHaveBeenCalled();
    expect(reconnectProfile).not.toHaveBeenCalled();
  });
});

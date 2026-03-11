import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hydrateAndReconnectActiveProfile } from './App';
import { App } from './App';
import { habitatStore } from './features/habitat/store';
import { settingsStore } from './features/settings/settings-store';

vi.mock('./runtime/runtime-deps', () => ({
  getRuntimeDeps: () => ({
    bridge: {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn(() => () => undefined),
      listAgents: vi.fn().mockResolvedValue([])
    }
  })
}));

beforeEach(() => {
  window.history.replaceState({}, '', '/');
  localStorage.clear();
  habitatStore.setState({
    pets: {},
    agentSnapshots: {},
    selectedPetId: null
  });
  settingsStore.setState({
    gatewayProfiles: {},
    bindings: {},
    appearances: {},
    activeProfileId: null,
    displayMode: 'pinned',
    pinnedAgentId: null,
    petWindowPlacement: null
  });
  (globalThis as typeof globalThis & {
    habitat?: Record<string, unknown>;
  }).habitat = {
    getRuntimeInfo: vi.fn().mockResolvedValue({
      platform: 'darwin'
    }),
    prepareGatewayConnection: vi.fn(),
    teardownGatewayConnection: vi.fn(),
    movePetWindow: vi.fn(),
    persistPetWindowPosition: vi.fn(),
    togglePanel: vi.fn().mockResolvedValue({ isOpen: false }),
    storeSecret: vi.fn(),
    retrieveSecret: vi.fn(),
    deleteSecret: vi.fn()
  };
});

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

  it('lets the user switch between pinned and group modes and choose a pinned agent', async () => {
    habitatStore.getState().seedPets([
      {
        id: 'pet-1',
        agentId: 'main',
        gatewayId: 'remote-1',
        status: 'idle',
        name: 'Main'
      },
      {
        id: 'pet-2',
        agentId: 'ad-expert',
        gatewayId: 'remote-1',
        status: 'working',
        name: 'Ads'
      }
    ]);
    settingsStore.getState().bindPetToAgent({
      petId: 'pet-1',
      gatewayId: 'remote-1',
      agentId: 'main'
    });
    settingsStore.getState().bindPetToAgent({
      petId: 'pet-2',
      gatewayId: 'remote-1',
      agentId: 'ad-expert'
    });

    render(<App />);

    fireEvent.click(await screen.findByRole('radio', { name: 'Group Stage' }));
    fireEvent.change(screen.getByLabelText('Pinned agent'), {
      target: { value: 'ad-expert' }
    });

    expect(screen.getByRole('radio', { name: 'Group Stage' })).toBeChecked();
    expect(screen.getByLabelText('Pinned agent')).toHaveValue('ad-expert');
  });

  it('marks the pet surface as transparent chrome', async () => {
    window.history.replaceState({}, '', '/?surface=pet');

    render(<App />);

    expect(
      await screen.findByRole('button', { name: 'OpenClaw desktop pet' })
    ).toBeInTheDocument();
    expect(document.body.dataset.surface).toBe('pet');
  });
});

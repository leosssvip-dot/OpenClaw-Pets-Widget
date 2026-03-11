import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hydrateAndReconnectActiveProfile, hydrateProfileSecrets } from './App';
import { App } from './App';
import { habitatStore } from './features/habitat/store';
import { settingsStore } from './features/settings/settings-store';
import {
  clearGatewaySessionAuth,
  getGatewaySessionAuth
} from './runtime/gateway-session-auth';

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
  clearGatewaySessionAuth('remote-1');
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

  it('shows the companion stage and reveals grouped settings controls', async () => {
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

    expect(await screen.findByRole('heading', { name: 'Current companion' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Switch agent' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Switch character' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'More settings' }));

    expect(screen.getByRole('heading', { name: 'Display' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Characters' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Connection' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: 'Group' }));
    fireEvent.change(screen.getByLabelText('Pinned agent'), {
      target: { value: 'ad-expert' }
    });

    expect(screen.getByRole('radio', { name: 'Group' })).toBeChecked();
    expect(screen.getByLabelText('Pinned agent')).toHaveValue('ad-expert');
  });

  it('shows a direct gateway connection action when no companion is connected', async () => {
    render(<App />);

    expect(await screen.findByText('No companion connected')).toBeInTheDocument();
    const connectButton = screen.getByRole('button', { name: 'Connect gateway' });

    fireEvent.click(connectButton);

    expect(screen.getByRole('heading', { name: 'Connection' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect Remote' })).toBeInTheDocument();
  });

  it('marks the pet surface as transparent chrome', async () => {
    window.history.replaceState({}, '', '/?surface=pet');

    render(<App />);

    expect(
      await screen.findByRole('button', { name: 'OpenClaw desktop pet' })
    ).toBeInTheDocument();
    expect(document.body.dataset.surface).toBe('pet');
  });

  it('shows the pinned agent name on the pet surface', async () => {
    window.history.replaceState({}, '', '/?surface=pet');
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
    settingsStore.getState().setDisplayMode('pinned');
    settingsStore.getState().setPinnedAgentId('ad-expert');

    render(<App />);

    expect(
      await screen.findByRole('button', { name: 'Ads desktop pet' })
    ).toBeInTheDocument();
    expect(screen.getByText('Ads')).toBeInTheDocument();
  });

  it('hydrates stored gateway tokens and ssh passwords from secure storage', async () => {
    settingsStore.getState().saveGatewayProfile({
      id: 'remote-1',
      label: 'Studio Gateway',
      transport: 'ssh',
      host: 'studio.internal',
      username: 'chenyang',
      sshPort: 22,
      remoteGatewayPort: 18789,
      gatewayToken: ''
    });

    const retrieveSecret = vi
      .fn()
      .mockImplementation(async (key: string) =>
        key === 'gateway-token:remote-1'
          ? 'secret-token'
          : key === 'gateway-password:remote-1'
            ? 'hunter2'
            : null
      );

    (globalThis as typeof globalThis & {
      habitat?: Record<string, unknown>;
    }).habitat = {
      ...(globalThis as typeof globalThis & { habitat?: Record<string, unknown> }).habitat,
      retrieveSecret
    };

    await hydrateProfileSecrets();

    expect(retrieveSecret).toHaveBeenCalledWith('gateway-token:remote-1');
    expect(retrieveSecret).toHaveBeenCalledWith('gateway-password:remote-1');
    expect(settingsStore.getState().gatewayProfiles['remote-1'].gatewayToken).toBe(
      'secret-token'
    );
    expect(getGatewaySessionAuth('remote-1')).toEqual({
      password: 'hunter2'
    });
  });
});

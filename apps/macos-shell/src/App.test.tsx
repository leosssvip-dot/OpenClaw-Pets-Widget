import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hydrateAndReconnectActiveProfile, hydrateProfileSecrets } from './App';
import { App } from './App';
import { habitatStore } from './features/habitat/store';
import { settingsStore } from './features/settings/settings-store';
import {
  clearGatewaySessionAuth,
  getGatewaySessionAuth
} from './runtime/gateway-session-auth';

const bridgeMocks = vi.hoisted(() => ({
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  subscribe: vi.fn(() => () => undefined),
  listAgents: vi.fn().mockResolvedValue([]),
  getConnectionState: vi.fn().mockReturnValue({ status: 'disconnected', profileId: null, errorMessage: null }),
  subscribeConnection: vi.fn(() => () => undefined)
}));

import { ConnectionManager } from './runtime/connection-manager';

const connectionManagerInstance = new ConnectionManager(bridgeMocks as any);

vi.mock('./runtime/runtime-deps', () => ({
  getRuntimeDeps: () => ({
    bridge: bridgeMocks,
    connectionManager: connectionManagerInstance
  })
}));

beforeEach(() => {
  let syncCallback: ((msg: unknown) => void) | null = null;
  window.history.replaceState({}, '', '/');
  localStorage.clear();
  bridgeMocks.connect.mockClear();
  bridgeMocks.disconnect.mockClear();
  bridgeMocks.subscribe.mockClear();
  bridgeMocks.listAgents.mockClear();
  bridgeMocks.connect.mockResolvedValue(undefined);
  bridgeMocks.disconnect.mockResolvedValue(undefined);
  bridgeMocks.subscribe.mockImplementation(() => () => undefined);
  bridgeMocks.listAgents.mockResolvedValue([]);
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
    sendHabitatSync: vi.fn(),
    onHabitatSync: vi.fn((callback: (msg: unknown) => void) => {
      syncCallback = callback;
      return () => {
        if (syncCallback === callback) {
          syncCallback = null;
        }
      };
    }),
    togglePanel: vi.fn().mockResolvedValue({ isOpen: false }),
    showPanel: vi.fn().mockResolvedValue({ isOpen: true }),
    storeSecret: vi.fn(),
    retrieveSecret: vi.fn(),
    deleteSecret: vi.fn()
  };
  (globalThis as typeof globalThis & { __habitatSyncCallback?: (msg: unknown) => void }).__habitatSyncCallback =
    (msg: unknown) => syncCallback?.(msg);
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
      () => null,
      vi.fn(),
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
      () => null,
      vi.fn(),
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
      () => null,
      vi.fn(),
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
      () => null,
      vi.fn(),
      reconnectProfile
    );

    expect(markReconnectAttempted).not.toHaveBeenCalled();
    expect(hydrateTokens).not.toHaveBeenCalled();
    expect(reconnectProfile).not.toHaveBeenCalled();
  });

  it('shows a unified prompt-first panel with collapsible settings groups', async () => {
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
    settingsStore.getState().setPetAppearance('pet-1', {
      rolePack: 'lobster'
    });
    settingsStore.getState().setPetAppearance('pet-2', {
      rolePack: 'robot'
    });

    render(<App />);

    expect(await screen.findByRole('button', { name: 'Send' })).toBeInTheDocument();
    expect(screen.queryByText('Agent Habitat')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        name: 'Your coding pet is already at the keyboard.'
      })
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Signal')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Switch agent' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Switch character' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'More settings' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Agent' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Current agent')).not.toBeInTheDocument();

    expect(screen.getByRole('button', { name: '💬 Chat' })).toHaveClass('panel-tab--active');

    // Switch to Setup tab
    fireEvent.click(screen.getByRole('button', { name: '⚙️ Settings' }));
    expect(screen.getByRole('heading', { name: 'Connection & Gateways' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add gateway' }));

    expect(screen.getByLabelText('Gateway Port')).toBeInTheDocument();
    expect(screen.getByLabelText('Gateway Token')).toBeInTheDocument();
  });

  it('shows a direct gateway connection action when no companion is connected', async () => {
    render(<App />);

    expect(await screen.findByText('No companion on stage')).toBeInTheDocument();
    const connectButton = screen.getByRole('button', { name: 'Connect gateway' });

    fireEvent.click(connectButton);

    expect(screen.getByRole('heading', { name: 'System Setup' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add gateway' })).toBeInTheDocument();
  });

  it('does not rebroadcast identical uiState snapshots after store rehydrate noise', async () => {
    render(<App />);

    const sendHabitatSync = (globalThis as typeof globalThis & {
      habitat?: {
        sendHabitatSync?: ReturnType<typeof vi.fn>;
      };
    }).habitat?.sendHabitatSync;

    await waitFor(() => {
      expect(sendHabitatSync).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      settingsStore.setState({
        appearances: {},
        pinnedAgentId: null,
      });
    });

    expect(sendHabitatSync).toHaveBeenCalledTimes(1);
  });

  it('rebroadcasts uiState when the selected companion actually changes', async () => {
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

    render(<App />);

    const sendHabitatSync = (globalThis as typeof globalThis & {
      habitat?: {
        sendHabitatSync?: ReturnType<typeof vi.fn>;
      };
    }).habitat?.sendHabitatSync;

    await waitFor(() => {
      expect(sendHabitatSync).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      settingsStore.getState().setPinnedAgentId('ad-expert');
      habitatStore.getState().selectPet('pet-2');
    });

    await waitFor(() => {
      expect(sendHabitatSync).toHaveBeenCalledTimes(2);
    });

    expect(sendHabitatSync?.mock.calls[1]?.[0]).toMatchObject({
      type: 'uiState',
      selectedPetId: 'pet-2',
      pinnedAgentId: 'ad-expert',
    });
  });

  it('reconnects again when the panel remounts with an active profile', async () => {
    settingsStore.getState().saveGatewayProfile({
      id: 'remote-1',
      label: 'Remote 1',
      transport: 'ssh',
      host: '127.0.0.1',
      username: 'demo',
      sshPort: 22,
      identityFile: '',
      remoteGatewayPort: 62828,
      gatewayToken: 'token'
    });

    const firstRender = render(<App />);
    await screen.findByRole('button', { name: 'Connect gateway' });
    expect(bridgeMocks.connect).toHaveBeenCalledTimes(1);

    firstRender.unmount();

    render(<App />);
    await screen.findByRole('button', { name: 'Connect gateway' });

    expect(bridgeMocks.connect).toHaveBeenCalledTimes(2);
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
    settingsStore.getState().setPinnedAgentId('ad-expert');

    render(<App />);

    expect(
      await screen.findByRole('button', { name: 'Ads desktop pet' })
    ).toBeInTheDocument();
    expect(screen.getByText('Ads')).toBeInTheDocument();
  });

  it('applies synced companion selection and appearance updates on the pet surface', async () => {
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

    render(<App />);

    expect(
      await screen.findByRole('button', { name: 'Main desktop pet' })
    ).toBeInTheDocument();

    await act(async () => {
      (globalThis as typeof globalThis & {
        __habitatSyncCallback?: (msg: unknown) => void;
      }).__habitatSyncCallback?.({
        type: 'uiState',
        selectedPetId: 'pet-2',
        pinnedAgentId: 'ad-expert',
        appearances: {
          'pet-2': {
            rolePack: 'robot'
          }
        }
      });
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Ads desktop pet' })).toHaveClass(
        'desktop-pet--role-robot'
      );
    });
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
    const hydratedProfile = settingsStore.getState().gatewayProfiles['remote-1'];

    expect(hydratedProfile?.transport).toBe('ssh');
    if (hydratedProfile?.transport === 'ssh') {
      expect(hydratedProfile.gatewayToken).toBe('secret-token');
    }
    expect(getGatewaySessionAuth('remote-1')).toEqual({
      password: 'hunter2'
    });
  });
});

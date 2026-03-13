import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  AgentBindingSeed,
  BridgeClient,
  BridgeConnectionState,
  CreateTaskInput,
  HabitatEvent,
  SendMessageInput
} from '@openclaw-habitat/bridge';
import { habitatStore } from '../../features/habitat/store';
import { settingsStore } from '../../features/settings/settings-store';
import { ConnectionManager } from '../connection-manager';

class FakeBridgeClient implements BridgeClient {
  private readonly eventListeners = new Set<(event: HabitatEvent) => void>();
  private readonly connectionListeners = new Set<(state: BridgeConnectionState) => void>();
  private connectionState: BridgeConnectionState = {
    status: 'disconnected',
    profileId: null,
    errorMessage: null
  };

  connect = vi.fn(async (profileId: string) => {
    this.connectionState = {
      status: 'connected',
      profileId,
      errorMessage: null
    };
    this.emitConnectionState(this.connectionState);
  });

  disconnect = vi.fn(async () => {
    this.connectionState = {
      status: 'disconnected',
      profileId: null,
      errorMessage: null
    };
    this.emitConnectionState(this.connectionState);
  });

  listAgents = vi.fn(async (): Promise<AgentBindingSeed[]> => [
    {
      id: 'pet-1',
      agentId: 'main',
      gatewayId: 'remote-1',
      label: 'Main'
    }
  ]);

  subscribe(listener: (event: HabitatEvent) => void): () => void {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  subscribeConnection(listener: (state: BridgeConnectionState) => void): () => void {
    this.connectionListeners.add(listener);
    listener(this.connectionState);
    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  getConnectionState(): BridgeConnectionState {
    return this.connectionState;
  }

  sendMessage = vi.fn(async (_input: SendMessageInput) => undefined);

  createTask = vi.fn(async (_input: CreateTaskInput) => undefined);

  emitConnectionState(state: BridgeConnectionState) {
    this.connectionState = state;
    for (const listener of this.connectionListeners) {
      listener(state);
    }
  }
}

describe('ConnectionManager', () => {
  let bridge: FakeBridgeClient;
  let manager: ConnectionManager;

  beforeEach(() => {
    habitatStore.setState({
      pets: {},
      agentSnapshots: {},
      selectedPetId: null
    });
    settingsStore.setState({
      gatewayProfiles: {},
      bindings: {},
      appearances: {},
      activeProfileId: 'remote-1',
      displayMode: 'pinned',
      pinnedAgentId: null,
      petWindowPlacement: null
    });
    bridge = new FakeBridgeClient();
    manager = new ConnectionManager(bridge);
  });

  it('drops to offline when the bridge disconnects after connecting', async () => {
    await manager.connect('remote-1');

    bridge.emitConnectionState({
      status: 'disconnected',
      profileId: 'remote-1',
      errorMessage: 'Gateway socket closed (1006)'
    });

    expect(manager.getSnapshot()).toEqual({
      status: 'offline',
      errorMessage: 'Gateway socket closed (1006)',
      activeProfileId: 'remote-1'
    });
  });

  it('reconnects and retries sendMessage after a recoverable bridge failure', async () => {
    await manager.connect('remote-1');
    bridge.sendMessage
      .mockRejectedValueOnce(new Error('Bridge client is not connected'))
      .mockResolvedValueOnce(undefined);

    await manager.sendMessage({
      petId: 'pet-1',
      content: 'hello'
    });

    expect(bridge.connect).toHaveBeenCalledTimes(2);
    expect(bridge.sendMessage).toHaveBeenCalledTimes(2);
  });
});

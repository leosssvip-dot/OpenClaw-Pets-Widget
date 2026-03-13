import type {
  AgentBindingSeed,
  BridgeClient,
  BridgeConnectionState,
  CreateTaskInput,
  SendMessageInput
} from '@openclaw-habitat/bridge';
import type { ConnectionStatus } from '../features/connection/ConnectionBadge';
import { chatStore } from '../features/chat/store';
import { habitatStore } from '../features/habitat/store';
import { settingsStore } from '../features/settings/settings-store';

export interface ConnectionManagerSnapshot {
  status: ConnectionStatus;
  errorMessage: string | null;
  activeProfileId: string | null;
}

type ConnectionManagerListener = (snapshot: ConnectionManagerSnapshot) => void;

function toHabitatPets(agents: AgentBindingSeed[]) {
  return agents.map((agent) => ({
    id: agent.id,
    agentId: agent.agentId,
    gatewayId: agent.gatewayId,
    status: agent.status ?? 'idle',
    name: agent.label
  }));
}

function isRecoverableBridgeError(message: string) {
  return (
    message.includes('Bridge client is not connected') ||
    message.includes('gateway socket closed') ||
    message.includes('socket closed')
  );
}

function toManagerStatus(state: BridgeConnectionState): ConnectionStatus {
  switch (state.status) {
    case 'connected':
      return 'connected';
    case 'connecting':
      return 'connecting';
    case 'auth-expired':
      return 'auth-expired';
    case 'error':
    case 'disconnected':
    default:
      return 'offline';
  }
}

export class ConnectionManager {
  private readonly listeners = new Set<ConnectionManagerListener>();
  private bridgeUnsubscribe: (() => void) | null = null;
  private connectPromise: Promise<void> | null = null;
  private suppressDisconnectState = false;
  private snapshot: ConnectionManagerSnapshot;

  constructor(private readonly bridge: BridgeClient) {
    const bridgeState = bridge.getConnectionState();
    this.snapshot = {
      status: toManagerStatus(bridgeState),
      errorMessage: bridgeState.errorMessage,
      activeProfileId: bridgeState.profileId
    };

    bridge.subscribeConnection((state) => {
      this.handleBridgeConnectionState(state);
    });
  }

  subscribe(listener: ConnectionManagerListener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);

    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): ConnectionManagerSnapshot {
    return this.snapshot;
  }

  async connect(profileId: string, options?: { reconnecting?: boolean }): Promise<void> {
    if (this.connectPromise) {
      return this.connectPromise;
    }

    const promise = this.connectInternal(profileId, options).finally(() => {
      this.connectPromise = null;
    });
    this.connectPromise = promise;
    return promise;
  }

  async reconnect(): Promise<void> {
    const profileId = this.snapshot.activeProfileId ?? settingsStore.getState().activeProfileId;

    if (!profileId) {
      throw new Error('No active gateway profile selected');
    }

    await this.connect(profileId, { reconnecting: true });
  }

  async disconnect(): Promise<void> {
    this.bridgeUnsubscribe?.();
    this.bridgeUnsubscribe = null;
    this.suppressDisconnectState = true;
    try {
      await this.bridge.disconnect();
    } finally {
      this.suppressDisconnectState = false;
    }
    this.setSnapshot({
      status: 'offline',
      errorMessage: null,
      activeProfileId: null
    });
  }

  async sendMessage(input: SendMessageInput): Promise<void> {
    await this.executeWithRecovery(() => this.bridge.sendMessage(input));
  }

  async createTask(input: CreateTaskInput): Promise<void> {
    await this.executeWithRecovery(() => this.bridge.createTask(input));
  }

  private async connectInternal(profileId: string, options?: { reconnecting?: boolean }) {
    this.bridgeUnsubscribe?.();
    this.bridgeUnsubscribe = null;
    this.setSnapshot({
      status: options?.reconnecting ? 'reconnecting' : 'connecting',
      errorMessage: null,
      activeProfileId: profileId
    });

    try {
      this.suppressDisconnectState = true;
      await this.bridge.disconnect();
    } finally {
      this.suppressDisconnectState = false;
    }

    try {
      await this.bridge.connect(profileId);
      this.bridgeUnsubscribe = this.bridge.subscribe((event) => {
        habitatStore.getState().applyEvent(event);
        if (event.kind === 'chat.message' && event.petId) {
          chatStore.getState().addAssistantMessage(event.text, event.final);
        }
      });

      const agents = await this.bridge.listAgents();
      habitatStore.getState().seedPets(toHabitatPets(agents));

      for (const agent of agents) {
        settingsStore.getState().bindPetToAgent({
          petId: agent.id,
          gatewayId: agent.gatewayId,
          agentId: agent.agentId
        });
      }

      this.setSnapshot({
        status: 'connected',
        errorMessage: null,
        activeProfileId: profileId
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.bridgeUnsubscribe?.();
      this.bridgeUnsubscribe = null;
      this.setSnapshot({
        status: message.includes('AUTH_EXPIRED') ? 'auth-expired' : 'offline',
        errorMessage: message,
        activeProfileId: profileId
      });
      throw error;
    }
  }

  private async executeWithRecovery(run: () => Promise<void>) {
    try {
      await this.ensureConnected();
      await run();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (
        this.snapshot.activeProfileId &&
        isRecoverableBridgeError(message)
      ) {
        await this.connect(this.snapshot.activeProfileId, { reconnecting: true });
        await run();
        return;
      }

      throw error;
    }
  }

  private async ensureConnected() {
    if (this.bridge.getConnectionState().status === 'connected') {
      return;
    }

    const profileId = this.snapshot.activeProfileId ?? settingsStore.getState().activeProfileId;

    if (!profileId) {
      throw new Error('Bridge client is not connected');
    }

    await this.connect(profileId, { reconnecting: true });
  }

  private handleBridgeConnectionState(state: BridgeConnectionState) {
    if (state.status === 'disconnected' && this.suppressDisconnectState) {
      return;
    }

    if (state.status === 'connected') {
      return;
    }

    if (state.status === 'disconnected' || state.status === 'error' || state.status === 'auth-expired') {
      this.bridgeUnsubscribe?.();
      this.bridgeUnsubscribe = null;
    }

    this.setSnapshot({
      status: toManagerStatus(state),
      errorMessage: state.errorMessage,
      activeProfileId: state.profileId ?? this.snapshot.activeProfileId
    });
  }

  private setSnapshot(snapshot: ConnectionManagerSnapshot) {
    if (
      this.snapshot.status === snapshot.status &&
      this.snapshot.errorMessage === snapshot.errorMessage &&
      this.snapshot.activeProfileId === snapshot.activeProfileId
    ) {
      return;
    }

    this.snapshot = snapshot;
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

export function createConnectionManager(bridge: BridgeClient) {
  return new ConnectionManager(bridge);
}

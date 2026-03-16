import type {
  AgentBindingSeed,
  BridgeClient,
  BridgeConnectionState,
  CreateTaskInput,
  HabitatEvent,
  SendMessageInput
} from './contracts';

export class MockBridgeClient implements BridgeClient {
  private readonly listeners = new Set<(event: HabitatEvent) => void>();
  private readonly connectionListeners = new Set<(state: BridgeConnectionState) => void>();
  private connectedProfileId: string | null = null;

  constructor(private readonly agents: AgentBindingSeed[] = []) {}

  async connect(profileId: string): Promise<void> {
    this.connectedProfileId = profileId;
    this.emitConnectionState({
      status: 'connected',
      profileId,
      errorMessage: null
    });
  }

  async disconnect(): Promise<void> {
    this.connectedProfileId = null;
    this.emitConnectionState({
      status: 'disconnected',
      profileId: null,
      errorMessage: null
    });
  }

  async listAgents(): Promise<AgentBindingSeed[]> {
    return this.agents;
  }

  subscribe(listener: (event: HabitatEvent) => void): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  subscribeConnection(listener: (state: BridgeConnectionState) => void): () => void {
    this.connectionListeners.add(listener);
    listener(this.getConnectionState());

    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  getConnectionState(): BridgeConnectionState {
    return {
      status: this.connectedProfileId ? 'connected' : 'disconnected',
      profileId: this.connectedProfileId,
      errorMessage: null
    };
  }

  async sendMessage(_input: SendMessageInput): Promise<void> {
    if (!this.connectedProfileId) {
      throw new Error('Bridge client is not connected');
    }
  }

  async createTask(_input: CreateTaskInput): Promise<void> {
    if (!this.connectedProfileId) {
      throw new Error('Bridge client is not connected');
    }
  }

  getSessionKey(agentId: string): string {
    return `agent:${agentId}:main`;
  }

  emit(event: HabitatEvent) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  private emitConnectionState(state: BridgeConnectionState) {
    for (const listener of this.connectionListeners) {
      listener(state);
    }
  }
}

import type {
  AgentBindingSeed,
  BridgeClient,
  CreateTaskInput,
  HabitatEvent,
  SendMessageInput
} from './contracts';

export class MockBridgeClient implements BridgeClient {
  private readonly listeners = new Set<(event: HabitatEvent) => void>();
  private connectedProfileId: string | null = null;

  constructor(private readonly agents: AgentBindingSeed[] = []) {}

  async connect(profileId: string): Promise<void> {
    this.connectedProfileId = profileId;
  }

  async disconnect(): Promise<void> {
    this.connectedProfileId = null;
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

  emit(event: HabitatEvent) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

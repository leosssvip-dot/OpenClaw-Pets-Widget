import type {
  AgentBindingSeed,
  BridgeClient,
  BridgeConnectionState,
  CreateTaskInput,
  HabitatEvent,
  SendMessageInput
} from '@openclaw-habitat/bridge';
import type { ConnectionStatus } from '../features/connection/ConnectionBadge';
import { chatStore } from '../features/chat/store';
import { saveChatHistory, loadChatHistory } from '../features/chat/persistence';
import type { ChatMessage } from '../features/chat/types';
import { habitatStore } from '../features/habitat/store';
import { settingsStore } from '../features/settings/settings-store';
import { createHabitatPublisher } from './habitat-sync';

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

/**
 * Resolve the agentId from the event.  Only fall back to chatStore.activeAgentId
 * when the gateway sent an explicit sessionKey that we can verify later — this
 * prevents messages from other channels (no sessionKey) being silently attributed
 * to the currently active agent.
 */
function resolveEventAgentId(event: HabitatEvent): string | null {
  if (event.agentId && event.agentId !== 'unknown') {
    return event.agentId;
  }
  // Only fall back if the event carries a sessionKey — we can still verify it
  // downstream in isDesktopSession().  Without a sessionKey there is no way to
  // confirm this message belongs to the desktop session.
  if (event.sessionKey) {
    return chatStore.getState().activeAgentId;
  }
  return null;
}

function isActiveAgent(agentId: string | null): boolean {
  if (!agentId) return false; // can't determine → reject

  const activeAgentId = chatStore.getState().activeAgentId;
  if (!activeAgentId) return false; // nothing active → reject (runId check covers our own runs)

  return agentId === activeAgentId;
}

/**
 * Check if the event belongs to a run we initiated from this desktop client.
 * When we send a message we track the generated runId; the gateway echoes it
 * back on every event for that run, so we can always recognise our own traffic.
 */
function isOwnRun(event: HabitatEvent): boolean {
  if (!event.runId) return false;
  return chatStore.getState().pendingRunIds.has(event.runId);
}

/**
 * Check if the event's sessionKey matches the desktop app's session for the
 * given agent. Events from other channels (e.g. Feishu) will have a different
 * sessionKey and should not be displayed in the desktop chat UI.
 *
 * STRICT: events without a sessionKey are always rejected — the desktop client
 * sends a sessionKey with every request and expects the gateway to echo it back.
 */
function isDesktopSession(event: HabitatEvent, bridge: BridgeClient, agentId: string | null): boolean {
  // No sessionKey on the event → cannot verify channel, reject
  if (!event.sessionKey) return false;
  // No agent to compare against → reject
  if (!agentId) return false;

  const desktopSessionKey = bridge.getSessionKey(agentId);
  return event.sessionKey === desktopSessionKey;
}

/**
 * Append an assistant message to a different agent's persisted chat history.
 * This ensures messages arriving for a non-visible agent are not lost.
 */
let backgroundMsgId = 0;
function appendToBackgroundSession(profileId: string, agentId: string, content: string) {
  const sessionKey = `${profileId}:${agentId}`;
  const history = loadChatHistory(sessionKey);
  const last = history[history.length - 1];
  if (last?.role === 'assistant') {
    // Update in-progress streaming message
    history[history.length - 1] = { ...last, content };
  } else {
    history.push({
      id: `bg-${Date.now()}-${++backgroundMsgId}`,
      role: 'assistant',
      content,
      timestamp: Date.now(),
    });
  }
  saveChatHistory(sessionKey, history);
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
    // Generate a runId so we can recognise the gateway's response events
    const runId = input.idempotencyKey ?? crypto.randomUUID();
    chatStore.getState().trackRunId(runId);
    try {
      await this.executeWithRecovery(() =>
        this.bridge.sendMessage({ ...input, idempotencyKey: runId })
      );
    } catch (error) {
      chatStore.getState().untrackRunId(runId);
      throw error;
    }
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
      const publisher = createHabitatPublisher();
      this.bridgeUnsubscribe = this.bridge.subscribe((event) => {
        habitatStore.getState().applyEvent(event);
        publisher.publishEvent(event);

        const eventAgentId = resolveEventAgentId(event);
        // Accept if the event matches our own run OR the active agent's desktop session
        const ownRun = isOwnRun(event);
        const desktopMatch = isActiveAgent(eventAgentId) && isDesktopSession(event, this.bridge, eventAgentId);

        if (event.kind === 'chat.message') {
          if (ownRun || desktopMatch) {
            chatStore.getState().addAssistantMessage(event.text, event.final);
          } else if (eventAgentId) {
            // Different agent or different channel — persist in background
            const activeProfileId = chatStore.getState().activeProfileId ?? profileId;
            appendToBackgroundSession(activeProfileId, eventAgentId, event.text);
          }
        }
        if (event.kind === 'agent.completed') {
          if (ownRun || desktopMatch) {
            chatStore.getState().setTyping(false);
            chatStore.setState({ pendingResponse: false });
          }
          // Clean up the tracked runId
          if (event.runId) {
            chatStore.getState().untrackRunId(event.runId);
          }
        }
        // NOTE: Do NOT untrack runId on agent.error — the gateway may
        // internally retry the run (e.g. 401 → fallback model).  All
        // retry events share the same runId, so removing it here would
        // cause subsequent chat.message / agent.completed events to be
        // unrecognised.  Cleanup happens only on agent.completed above.
      });

      const agents = await this.bridge.listAgents();
      const pets = toHabitatPets(agents);
      habitatStore.getState().seedPets(pets);
      publisher.publishSeedPets(pets);

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

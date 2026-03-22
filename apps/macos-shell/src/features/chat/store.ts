import { createStore } from 'zustand/vanilla';
import type { ChatMessage, ChatImage } from './types';

export interface ChatState {
  messages: ChatMessage[];
  typing: boolean;
  /** Tracks whether we are still waiting for the first chunk of a response. */
  pendingResponse: boolean;
  /** The agentId whose chat is currently displayed. */
  activeAgentId: string | null;
  /** The gateway profile id for building session keys. */
  activeProfileId: string | null;
  /** runIds of messages we sent from this desktop client — used to identify our own responses. */
  pendingRunIds: Set<string>;
  addUserMessage: (content: string, images?: ChatImage[]) => void;
  addAssistantMessage: (content: string, final?: boolean) => void;
  replaceMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
  setTyping: (typing: boolean) => void;
  /** Set which agent/profile session is currently displayed. */
  setActiveSession: (profileId: string | null, agentId: string | null) => void;
  /** Register a runId so incoming events with that runId are recognised as ours. */
  trackRunId: (runId: string) => void;
  /** Remove a runId when the run completes. */
  untrackRunId: (runId: string) => void;
}

let messageId = 0;
function nextId() {
  return `msg-${Date.now()}-${++messageId}`;
}

export const createChatStore = () =>
  createStore<ChatState>((set) => ({
    messages: [],
    typing: false,
    pendingResponse: false,
    activeAgentId: null,
    activeProfileId: null,
    pendingRunIds: new Set<string>(),
    addUserMessage: (content, images) =>
      set((s) => ({
        typing: true,
        pendingResponse: true,
        messages: [
          ...s.messages,
          {
            id: nextId(),
            role: 'user',
            content,
            ...(images && images.length > 0 ? { images } : {}),
            timestamp: Date.now(),
          }
        ]
      })),
    addAssistantMessage: (content, final = true) =>
      set((s) => {
        const last = s.messages[s.messages.length - 1];
        // 流式或最终：若上一条已是 assistant，只更新该条，避免同一条回复出现两次
        if (last?.role === 'assistant') {
          return {
            typing: !final,
            pendingResponse: false,
            messages: [
              ...s.messages.slice(0, -1),
              { ...last, content }
            ]
          };
        }
        return {
          typing: !final,
          pendingResponse: false,
          messages: [
            ...s.messages,
            { id: nextId(), role: 'assistant', content, timestamp: Date.now() }
          ]
        };
      }),
    replaceMessages: (messages) => set({ messages }),
    clearMessages: () => set({ messages: [], typing: false, pendingResponse: false }),
    setTyping: (typing) => set({ typing }),
    setActiveSession: (profileId, agentId) => set({ activeProfileId: profileId, activeAgentId: agentId }),
    trackRunId: (runId) =>
      set((s) => {
        const next = new Set(s.pendingRunIds);
        next.add(runId);
        return { pendingRunIds: next };
      }),
    untrackRunId: (runId) =>
      set((s) => {
        const next = new Set(s.pendingRunIds);
        next.delete(runId);
        return { pendingRunIds: next };
      }),
  }));

export const chatStore = createChatStore();

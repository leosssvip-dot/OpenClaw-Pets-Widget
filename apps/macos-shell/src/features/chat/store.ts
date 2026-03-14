import { createStore } from 'zustand/vanilla';
import type { ChatMessage } from './types';

export interface ChatState {
  messages: ChatMessage[];
  addUserMessage: (content: string) => void;
  addAssistantMessage: (content: string, final?: boolean) => void;
  replaceMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
}

let messageId = 0;
function nextId() {
  return `msg-${Date.now()}-${++messageId}`;
}

export const createChatStore = () =>
  createStore<ChatState>((set) => ({
    messages: [],
    addUserMessage: (content) =>
      set((s) => ({
        messages: [
          ...s.messages,
          { id: nextId(), role: 'user', content, timestamp: Date.now() }
        ]
      })),
    addAssistantMessage: (content, final = true) =>
      set((s) => {
        const last = s.messages[s.messages.length - 1];
        // 流式或最终：若上一条已是 assistant，只更新该条，避免同一条回复出现两次
        if (last?.role === 'assistant') {
          return {
            messages: [
              ...s.messages.slice(0, -1),
              { ...last, content }
            ]
          };
        }
        return {
          messages: [
            ...s.messages,
            { id: nextId(), role: 'assistant', content, timestamp: Date.now() }
          ]
        };
      }),
    replaceMessages: (messages) => set({ messages }),
    clearMessages: () => set({ messages: [] })
  }));

export const chatStore = createChatStore();

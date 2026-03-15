import { createStore } from 'zustand/vanilla';
import type { ChatMessage, ChatImage } from './types';

export interface ChatState {
  messages: ChatMessage[];
  typing: boolean;
  addUserMessage: (content: string, images?: ChatImage[]) => void;
  addAssistantMessage: (content: string, final?: boolean) => void;
  replaceMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
  setTyping: (typing: boolean) => void;
}

let messageId = 0;
function nextId() {
  return `msg-${Date.now()}-${++messageId}`;
}

export const createChatStore = () =>
  createStore<ChatState>((set) => ({
    messages: [],
    typing: false,
    addUserMessage: (content, images) =>
      set((s) => ({
        typing: true,
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
            messages: [
              ...s.messages.slice(0, -1),
              { ...last, content }
            ]
          };
        }
        return {
          typing: !final,
          messages: [
            ...s.messages,
            { id: nextId(), role: 'assistant', content, timestamp: Date.now() }
          ]
        };
      }),
    replaceMessages: (messages) => set({ messages }),
    clearMessages: () => set({ messages: [], typing: false }),
    setTyping: (typing) => set({ typing }),
  }));

export const chatStore = createChatStore();

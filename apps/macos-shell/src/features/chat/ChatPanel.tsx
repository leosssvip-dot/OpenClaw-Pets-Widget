import { useEffect, useRef, useCallback } from 'react';
import { useStore } from 'zustand';
import { chatStore } from './store';
import { loadChatHistory, saveChatHistory } from './persistence';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput, type SlashCommand } from './ChatInput';
import type { ChatImage } from './types';

const PERSIST_DEBOUNCE_MS = 300;
const TYPING_TIMEOUT_MS = 30_000;

export function ChatPanel({
  sessionKey,
  petName,
  placeholder,
  disabled,
  onSubmit,
  extraCommands,
}: {
  sessionKey: string | null;
  petName: string;
  placeholder?: string;
  disabled?: boolean;
  onSubmit: (text: string, images?: ChatImage[]) => void | Promise<void>;
  /** Dynamic slash commands (e.g. models from the gateway). */
  extraCommands?: SlashCommand[];
}) {
  const messages = useStore(chatStore, (s) => s.messages);
  const typing = useStore(chatStore, (s) => s.typing);
  const addUserMessage = useStore(chatStore, (s) => s.addUserMessage);
  const replaceMessages = useStore(chatStore, (s) => s.replaceMessages);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionKeyRef = useRef(sessionKey);
  sessionKeyRef.current = sessionKey;

  // Safety timeout: reset typing if no response within TYPING_TIMEOUT_MS
  useEffect(() => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (typing) {
      typingTimerRef.current = setTimeout(() => {
        chatStore.getState().setTyping(false);
        typingTimerRef.current = null;
      }, TYPING_TIMEOUT_MS);
    }
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
    };
  }, [typing]);

  useEffect(() => {
    if (sessionKey) {
      replaceMessages(loadChatHistory(sessionKey));
    }
  }, [sessionKey, replaceMessages]);

  useEffect(() => {
    if (!sessionKey || messages.length === 0) return;

    persistTimerRef.current = setTimeout(() => {
      saveChatHistory(sessionKey, messages);
      persistTimerRef.current = null;
    }, PERSIST_DEBOUNCE_MS);

    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
    };
  }, [sessionKey, messages]);

  // Flush pending persistence on unmount to avoid message loss
  useEffect(() => {
    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
      const key = sessionKeyRef.current;
      const msgs = chatStore.getState().messages;
      if (key && msgs.length > 0) {
        saveChatHistory(key, msgs);
      }
    };
  }, []);

  const handleSubmit = useCallback(
    async (text: string, images?: ChatImage[]) => {
      addUserMessage(text, images);
      await onSubmit(text, images);
    },
    [addUserMessage, onSubmit],
  );

  /** Inline action buttons (from parsed assistant messages) trigger a new command. */
  const handleAction = useCallback(
    (command: string) => {
      if (disabled) return;
      void handleSubmit(command);
    },
    [disabled, handleSubmit],
  );

  const inputPlaceholder =
    placeholder ?? `Message ${petName}... (or /help, /status)`;

  return (
    <section className="chat-panel" aria-label={`Chat with ${petName}`}>
      <ChatMessageList messages={messages} typing={typing} onAction={handleAction} />
      <ChatInput
        placeholder={inputPlaceholder}
        disabled={disabled}
        onSubmit={handleSubmit}
        extraCommands={extraCommands}
      />
    </section>
  );
}

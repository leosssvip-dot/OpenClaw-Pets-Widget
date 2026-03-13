import { useEffect, useRef } from 'react';
import { useStore } from 'zustand';
import { chatStore } from './store';
import { loadChatHistory, saveChatHistory } from './persistence';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';

const PERSIST_DEBOUNCE_MS = 300;

export function ChatPanel({
  sessionKey,
  petName,
  placeholder,
  disabled,
  onSubmit
}: {
  sessionKey: string | null;
  petName: string;
  placeholder?: string;
  disabled?: boolean;
  onSubmit: (text: string) => void | Promise<void>;
}) {
  const messages = useStore(chatStore, (s) => s.messages);
  const addUserMessage = useStore(chatStore, (s) => s.addUserMessage);
  const replaceMessages = useStore(chatStore, (s) => s.replaceMessages);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleSubmit = async (text: string) => {
    addUserMessage(text);
    await onSubmit(text);
  };

  const inputPlaceholder =
    placeholder ?? `Message ${petName}... (or /help, /status)`;

  return (
    <section className="chat-panel" aria-label={`Chat with ${petName}`}>
      <ChatMessageList messages={messages} />
      <ChatInput
        placeholder={inputPlaceholder}
        disabled={disabled}
        onSubmit={handleSubmit}
      />
    </section>
  );
}

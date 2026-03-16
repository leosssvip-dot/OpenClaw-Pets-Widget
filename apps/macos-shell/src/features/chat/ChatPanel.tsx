import { useEffect, useRef, useCallback } from 'react';
import { useStore } from 'zustand';
import { chatStore } from './store';
import { loadChatHistory, saveChatHistory } from './persistence';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput, type SlashCommand } from './ChatInput';
import type { ChatImage } from './types';

const PERSIST_DEBOUNCE_MS = 300;
/**
 * Hard safety timeout — only kicks in if pendingResponse was never cleared
 * (e.g. bridge disconnected silently). Under normal flow, typing is driven
 * by pendingResponse + streaming state so this rarely fires.
 */
const TYPING_HARD_TIMEOUT_MS = 300_000; // 5 min

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
  const pendingResponse = useStore(chatStore, (s) => s.pendingResponse);
  const addUserMessage = useStore(chatStore, (s) => s.addUserMessage);
  const replaceMessages = useStore(chatStore, (s) => s.replaceMessages);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionKeyRef = useRef(sessionKey);
  const prevSessionKeyRef = useRef(sessionKey);

  // Show typing indicator as long as we're waiting for ANY response.
  // `typing` is driven by addAssistantMessage(final); pendingResponse covers
  // the gap between send and first chunk arriving.
  const showTyping = typing || pendingResponse;

  // Hard safety timeout — clears both flags if bridge goes silent
  useEffect(() => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (showTyping) {
      typingTimerRef.current = setTimeout(() => {
        chatStore.getState().setTyping(false);
        chatStore.setState({ pendingResponse: false });
        typingTimerRef.current = null;
      }, TYPING_HARD_TIMEOUT_MS);
    }
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
    };
  }, [showTyping]);

  // Keep chatStore.activeSession in sync with sessionKey so the
  // connection-manager knows which agent's chat is currently visible.
  useEffect(() => {
    if (sessionKey) {
      const colonIdx = sessionKey.indexOf(':');
      const profileId = colonIdx > 0 ? sessionKey.slice(0, colonIdx) : null;
      const agentId = colonIdx > 0 ? sessionKey.slice(colonIdx + 1) : null;
      chatStore.getState().setActiveSession(profileId, agentId);
    } else {
      chatStore.getState().setActiveSession(null, null);
    }
  }, [sessionKey]);

  useEffect(() => {
    const prevKey = prevSessionKeyRef.current;
    // Flush the old session's pending messages before switching
    if (prevKey && prevKey !== sessionKey) {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
      const msgs = chatStore.getState().messages;
      if (msgs.length > 0) {
        saveChatHistory(prevKey, msgs);
      }
    }
    prevSessionKeyRef.current = sessionKey;
    sessionKeyRef.current = sessionKey;
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
    placeholder ?? `Message ${petName}...`;

  return (
    <section className="chat-panel" aria-label={`Chat with ${petName}`}>
      <ChatMessageList messages={messages} typing={showTyping} agentName={petName} onAction={handleAction} />
      <ChatInput
        placeholder={inputPlaceholder}
        disabled={disabled}
        onSubmit={handleSubmit}
        extraCommands={extraCommands}
      />
    </section>
  );
}

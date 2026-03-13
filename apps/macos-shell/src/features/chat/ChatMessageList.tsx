import { useRef, useEffect, useMemo } from 'react';
import type { ChatMessage } from './types';
import { MarkdownContent } from './MarkdownContent';
import { parseMessageActions, type MessageAction } from './message-actions';

export function ChatMessageList({
  messages,
  onAction,
}: {
  messages: ChatMessage[];
  /** Called when the user clicks an inline action button in an assistant message. */
  onAction?: (command: string) => void;
}) {
  const containerRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    // Use rAF to ensure DOM has rendered the new message before scrolling
    const id = requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    });
    return () => cancelAnimationFrame(id);
  }, [messages]);

  /** Get the slash command from the last user message before assistant at index i (e.g. /think, /models). */
  const getTriggerCommand = (assistantIndex: number): string | null => {
    for (let i = assistantIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        const text = messages[i].content.trim();
        if (text.startsWith('/')) {
          const first = text.split(/\s+/)[0];
          return first || null;
        }
        return null;
      }
    }
    return null;
  };

  // Only parse actions for the last few assistant messages (perf)
  const actionsMap = useMemo(() => {
    const map = new Map<string, MessageAction[]>();
    const recentCount = Math.min(10, messages.length);
    const startIndex = Math.max(0, messages.length - recentCount);
    for (let i = startIndex; i < messages.length; i++) {
      const m = messages[i];
      if (m.role === 'assistant') {
        const triggerCommand = getTriggerCommand(i);
        const actions = parseMessageActions(m.content, triggerCommand);
        if (actions.length > 0) map.set(m.id, actions);
      }
    }
    return map;
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div
        className="chat-message-list chat-message-list--empty"
        aria-label="Chat messages"
      >
        <p className="chat-message-list__empty">
          No messages yet. Send a message to start.
        </p>
      </div>
    );
  }

  return (
    <ul className="chat-message-list" aria-label="Chat messages" ref={containerRef}>
      {messages.map((m) => {
        const actions = actionsMap.get(m.id);
        return (
          <li
            key={m.id}
            className={`chat-message chat-message--${m.role}`}
            data-testid={`chat-msg-${m.role}`}
          >
            <span className="chat-message__role" aria-hidden="true">
              {m.role === 'user' ? 'You' : 'Assistant'}
            </span>
            <MarkdownContent content={m.content} />
            {actions && actions.length > 0 && onAction && (
              <div className="chat-message__actions">
                {actions.map((a) => (
                  <button
                    key={a.command}
                    type="button"
                    className="chat-action-btn"
                    onClick={() => onAction(a.command)}
                    title={a.command}
                  >
                    <span className="chat-action-btn__label">{a.label}</span>
                    {a.detail && (
                      <span className="chat-action-btn__detail">{a.detail}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

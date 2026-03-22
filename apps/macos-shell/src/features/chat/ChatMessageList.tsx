import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import type { ChatMessage } from './types';
import { MarkdownContent } from './MarkdownContent';
import { parseMessageActions, type MessageAction } from './message-actions';
import { useT } from '../../i18n';

export function ChatMessageList({
  messages,
  typing,
  agentName,
  onAction,
}: {
  messages: ChatMessage[];
  /** Whether the assistant is currently generating a response. */
  typing?: boolean;
  /** Display name for the assistant / agent. */
  agentName?: string;
  /** Called when the user clicks an inline action button in an assistant message. */
  onAction?: (command: string) => void;
}) {
  const t = useT();
  const assistantLabel = agentName || 'Assistant';
  const containerRef = useRef<HTMLUListElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior,
      });
    }
  }, []);

  useEffect(() => {
    // Use rAF to ensure DOM has rendered the new message before scrolling
    const id = requestAnimationFrame(() => scrollToBottom('smooth'));
    return () => cancelAnimationFrame(id);
  }, [messages, scrollToBottom]);

  /** Show/hide "scroll to bottom" button based on scroll position */
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distanceFromBottom > 80);
  }, []);

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

  if (messages.length === 0 && !typing) {
    return (
      <div
        className="chat-message-list chat-message-list--empty"
        aria-label="Chat messages"
      >
        <p className="chat-message-list__empty">
          {t('chat.emptyMessages')}
        </p>
      </div>
    );
  }

  return (
    <div className="chat-message-list-container">
      <ul
        className="chat-message-list"
        aria-label="Chat messages"
        ref={containerRef}
        onScroll={handleScroll}
      >
        {messages.map((m) => {
          const actions = actionsMap.get(m.id);
          return (
            <li
              key={m.id}
              className={`chat-message chat-message--${m.role}`}
              data-testid={`chat-msg-${m.role}`}
            >
              <span className="chat-message__role" aria-hidden="true">
                {m.role === 'user' ? t('chat.you') : assistantLabel}
              </span>
              {m.images && m.images.length > 0 && (
                <div className="chat-message__images">
                  {m.images.map((img, i) => (
                    <a
                      key={i}
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="chat-message__image-link"
                    >
                      <img
                        src={img.url}
                        alt={img.alt ?? 'image'}
                        className="chat-message__image"
                        loading="lazy"
                      />
                    </a>
                  ))}
                </div>
              )}
              {m.content && <MarkdownContent content={m.content} />}
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

        {typing && (
          <li className="chat-message chat-message--assistant chat-typing-indicator" aria-label="Assistant is typing">
            <span className="chat-message__role" aria-hidden="true">{assistantLabel}</span>
            <div className="chat-typing-dots">
              <span className="chat-typing-dot" />
              <span className="chat-typing-dot" />
              <span className="chat-typing-dot" />
            </div>
          </li>
        )}
      </ul>

      {showScrollBtn && (
        <button
          type="button"
          className="chat-scroll-bottom-btn"
          onClick={() => scrollToBottom('smooth')}
          aria-label={t('chat.scrollToLatest')}
        >
          ↓
        </button>
      )}
    </div>
  );
}

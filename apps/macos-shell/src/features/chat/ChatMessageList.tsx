import type { ChatMessage } from './types';

export function ChatMessageList({ messages }: { messages: ChatMessage[] }) {
  if (messages.length === 0) {
    return (
      <div className="chat-message-list chat-message-list--empty" aria-label="Chat messages">
        <p className="chat-message-list__empty">No messages yet. Send a message to start.</p>
      </div>
    );
  }

  return (
    <ul className="chat-message-list" aria-label="Chat messages">
      {messages.map((m) => (
        <li
          key={m.id}
          className={`chat-message chat-message--${m.role}`}
          data-testid={`chat-msg-${m.role}`}
        >
          <span className="chat-message__role" aria-hidden="true">
            {m.role === 'user' ? 'You' : 'Assistant'}
          </span>
          <p className="chat-message__content">{m.content}</p>
        </li>
      ))}
    </ul>
  );
}

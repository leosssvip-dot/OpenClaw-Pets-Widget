/**
 * PetBubble — chat/command bubble that appears above the desktop pet.
 *
 * Modes:
 *   - "input": user can type a message or task to send to the bound agent
 *   - "status": shows agent status text (thinking, working, etc.)
 *   - null: hidden
 */

import { useState, useRef, useEffect } from 'react';

interface PetBubbleProps {
  mode: 'input' | 'status' | null;
  statusText?: string;
  onSend?: (text: string) => void;
  onClose?: () => void;
}

export function PetBubble({ mode, statusText, onSend, onClose }: PetBubbleProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'input') {
      // Small delay so the bubble renders before focusing
      const timer = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  if (!mode) {
    return null;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (trimmed && onSend) {
      onSend(trimmed);
      setValue('');
      onClose?.();
    }
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose?.();
    }
  }

  return (
    <div className={`pet-bubble pet-bubble--${mode}`} role={mode === 'input' ? 'dialog' : 'status'}>
      <div className="pet-bubble__tail" />
      {mode === 'status' ? (
        <p className="pet-bubble__status">{statusText}</p>
      ) : (
        <form className="pet-bubble__form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className="pet-bubble__input"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Say something or assign a task..."
            autoComplete="off"
            spellCheck={false}
          />
          <button className="pet-bubble__send" type="submit" disabled={!value.trim()}>
            Send
          </button>
        </form>
      )}
    </div>
  );
}

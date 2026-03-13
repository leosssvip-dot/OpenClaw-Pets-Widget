import { useState } from 'react';

export function ChatInput({
  placeholder = 'Message...',
  disabled = false,
  onSubmit
}: {
  placeholder?: string;
  disabled?: boolean;
  onSubmit: (text: string) => void | Promise<void>;
}) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    void onSubmit(text);
    setValue('');
  };

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <textarea
        className="chat-input__field"
        aria-label="Message"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        rows={2}
      />
      <button type="submit" className="chat-input__submit" disabled={disabled || !value.trim()}>
        Send
      </button>
    </form>
  );
}

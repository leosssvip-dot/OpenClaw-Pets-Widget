import { useState, useRef, useMemo } from 'react';

/* ------------------------------------------------------------------ */
/*  Public types                                                       */
/* ------------------------------------------------------------------ */

export interface SlashCommand {
  command: string;
  description: string;
}

/* ------------------------------------------------------------------ */
/*  Built-in commands (autocomplete hints only)                        */
/*  All commands are sent as plain text — the backend interprets them   */
/*  and responds with structured data that becomes inline action buttons*/
/* ------------------------------------------------------------------ */

const BUILTIN_COMMANDS: SlashCommand[] = [
  { command: '/help', description: 'Show available commands' },
  { command: '/status', description: 'Check connection status' },
  { command: '/new', description: 'Start a new session' },
  { command: '/models', description: 'List available providers & models' },
  { command: '/think', description: 'Set reasoning depth' },
  { command: '/verbose', description: 'Set response verbosity' },
  { command: '/compact', description: 'Compact conversation context' },
  { command: '/reset', description: 'Reset current session' },
  { command: '/stop', description: 'Stop current generation' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ChatInput({
  placeholder = 'Message...',
  disabled = false,
  onSubmit,
  extraCommands = [],
}: {
  placeholder?: string;
  disabled?: boolean;
  onSubmit: (text: string) => void | Promise<void>;
  /** Additional commands to show in autocomplete (e.g. from gateway). */
  extraCommands?: SlashCommand[];
}) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const commands = useMemo(() => {
    const map = new Map<string, SlashCommand>();
    for (const cmd of BUILTIN_COMMANDS) map.set(cmd.command, cmd);
    for (const cmd of extraCommands) map.set(cmd.command, cmd);
    return Array.from(map.values());
  }, [extraCommands]);

  /* ---------- derived: autocomplete list ---------- */
  const showAutocomplete = value.startsWith('/');
  const filteredCommands = showAutocomplete
    ? commands.filter((c) => c.command.includes(value.toLowerCase()))
    : [];

  /* ---------- submit ---------- */
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    setValue(''); // 先清空，保证每次发送后输入框都清空
    void onSubmit(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  /** 点选补全项后直接发送该命令并清空输入框 */
  const handleCommandClick = (cmd: SlashCommand) => {
    if (disabled) return;
    setValue('');
    void onSubmit(cmd.command);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  /* ---------- render ---------- */
  return (
    <form className="chat-input-wrapper" onSubmit={handleSubmit}>
      {/* ---- Autocomplete (command list) ---- */}
      {showAutocomplete && filteredCommands.length > 0 && (
        <div className="chat-command-popup">
          <ul className="chat-command-list">
            {filteredCommands.map((cmd) => (
              <li key={cmd.command}>
                <button
                  type="button"
                  className="chat-command-item"
                  onClick={() => handleCommandClick(cmd)}
                >
                  <strong>{cmd.command}</strong>
                  <span>{cmd.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ---- Text input ---- */}
      <div className="chat-input" style={{ position: 'relative' }}>
        <textarea
          ref={inputRef}
          className="chat-input__field"
          aria-label="Message"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={2}
        />
        <button
          type="submit"
          className="chat-input__submit"
          disabled={disabled || !value.trim()}
        >
          Send
        </button>
      </div>
    </form>
  );
}

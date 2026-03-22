import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import type { ChatImage } from './types';
import { useT } from '../../i18n';

/* ------------------------------------------------------------------ */
/*  Public types                                                       */
/* ------------------------------------------------------------------ */

export interface SlashCommand {
  command: string;
  description: string;
}

/* ------------------------------------------------------------------ */
/*  Image helpers                                                      */
/* ------------------------------------------------------------------ */

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

async function processImageFiles(files: FileList | File[]): Promise<ChatImage[]> {
  const results: ChatImage[] = [];
  for (const file of Array.from(files)) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) continue;
    if (file.size > MAX_IMAGE_SIZE) continue;
    const url = await fileToDataUri(file);
    results.push({ url, alt: file.name });
  }
  return results;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ChatInput({
  placeholder,
  disabled = false,
  onSubmit,
  extraCommands = [],
}: {
  placeholder?: string;
  disabled?: boolean;
  onSubmit: (text: string, images?: ChatImage[]) => void | Promise<void>;
  /** Additional commands to show in autocomplete (e.g. from gateway). */
  extraCommands?: SlashCommand[];
}) {
  const t = useT();
  const effectivePlaceholder = placeholder ?? t('chat.placeholder');
  const [value, setValue] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [pendingImages, setPendingImages] = useState<ChatImage[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---------- built-in commands (autocomplete hints only) ---------- */
  const builtinCommands: SlashCommand[] = useMemo(() => [
    { command: '/help', description: t('cmd.help') },
    { command: '/status', description: t('cmd.status') },
    { command: '/new', description: t('cmd.new') },
    { command: '/models', description: t('cmd.models') },
    { command: '/think', description: t('cmd.think') },
    { command: '/verbose', description: t('cmd.verbose') },
    { command: '/compact', description: t('cmd.compact') },
    { command: '/reset', description: t('cmd.reset') },
    { command: '/stop', description: t('cmd.stop') },
  ], [t]);

  const commands = useMemo(() => {
    const map = new Map<string, SlashCommand>();
    for (const cmd of builtinCommands) map.set(cmd.command, cmd);
    for (const cmd of extraCommands) map.set(cmd.command, cmd);
    return Array.from(map.values());
  }, [builtinCommands, extraCommands]);

  /* ---------- derived: autocomplete list ---------- */
  const showAutocomplete = value.startsWith('/');
  const filteredCommands = showAutocomplete
    ? commands.filter((c) => c.command.includes(value.toLowerCase()))
    : [];

  // Reset active index when filtered list changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [filteredCommands.length]);

  /* ---------- auto-resize textarea ---------- */
  const autoResize = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [value, autoResize]);

  /* ---------- image handling ---------- */
  const addImages = useCallback(async (files: FileList | File[]) => {
    const images = await processImageFiles(files);
    if (images.length > 0) {
      setPendingImages((prev) => [...prev, ...images]);
    }
  }, []);

  const removeImage = useCallback((index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        void addImages(e.target.files);
      }
      // Reset so re-selecting the same file triggers onChange
      e.target.value = '';
    },
    [addImages],
  );

  /** Handle paste: intercept images from clipboard */
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (const item of Array.from(items)) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        void addImages(imageFiles);
      }
    },
    [addImages],
  );

  /* ---------- submit ---------- */
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = value.trim();
    const hasImages = pendingImages.length > 0;
    if ((!text && !hasImages) || disabled) return;
    const images = hasImages ? [...pendingImages] : undefined;
    setValue('');
    setPendingImages([]);
    void onSubmit(text, images);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Autocomplete keyboard navigation
    if (showAutocomplete && filteredCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % filteredCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (i <= 0 ? filteredCommands.length - 1 : i - 1));
        return;
      }
      if ((e.key === 'Enter' || e.key === 'Tab') && activeIndex >= 0 && !e.nativeEvent.isComposing) {
        e.preventDefault();
        handleCommandClick(filteredCommands[activeIndex]);
        return;
      }
      if (e.key === 'Escape') {
        // Clear autocomplete by clearing the slash prefix
        setValue('');
        return;
      }
    }

    // Skip if the user is composing CJK characters via IME — Enter confirms
    // the candidate selection, not message submission.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
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
          <ul className="chat-command-list" role="listbox">
            {filteredCommands.map((cmd, i) => (
              <li key={cmd.command} role="option" aria-selected={i === activeIndex}>
                <button
                  type="button"
                  className={`chat-command-item${i === activeIndex ? ' chat-command-item--active' : ''}`}
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

      {/* ---- Image previews ---- */}
      {pendingImages.length > 0 && (
        <div className="chat-input-images">
          <p className="chat-input-images__hint">{t('chat.imageHint')}</p>
          {pendingImages.map((img, i) => (
            <div key={i} className="chat-input-images__item">
              <img src={img.url} alt={img.alt ?? 'attachment'} className="chat-input-images__thumb" />
              <button
                type="button"
                className="chat-input-images__remove"
                onClick={() => removeImage(i)}
                aria-label="Remove image"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ---- Text input ---- */}
      <div className="chat-input" style={{ position: 'relative' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="chat-input__file-hidden"
          onChange={handleFileChange}
          tabIndex={-1}
        />
        <button
          type="button"
          className="chat-input__attach"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          aria-label="Attach image"
          title="Attach image"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
        </button>
        <textarea
          ref={inputRef}
          className="chat-input__field"
          aria-label="Message"
          placeholder={effectivePlaceholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={disabled}
          rows={1}
        />
        <button
          type="submit"
          className="chat-input__submit"
          disabled={disabled || (!value.trim() && pendingImages.length === 0)}
        >
          {t('chat.send')}
        </button>
      </div>
    </form>
  );
}

import type { ChatMessage } from './types';

const STORAGE_PREFIX = 'openclaw-chat:';

export function chatStorageKey(sessionKey: string): string {
  return `${STORAGE_PREFIX}${sessionKey}`;
}

export function loadChatHistory(sessionKey: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(chatStorageKey(sessionKey));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is ChatMessage =>
        m &&
        typeof m === 'object' &&
        typeof m.id === 'string' &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        typeof m.timestamp === 'number'
    );
  } catch {
    return [];
  }
}

const MAX_PERSISTED_MESSAGES = 100;

/**
 * Strip large data-URI images before persisting to avoid blowing
 * the localStorage quota. Remote URLs are kept.
 */
function stripDataUriImages(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((m) => {
    if (!m.images || m.images.length === 0) return m;
    const kept = m.images.filter((img) => !img.url.startsWith('data:'));
    if (kept.length === m.images.length) return m;
    return kept.length > 0 ? { ...m, images: kept } : { ...m, images: undefined };
  });
}

export function saveChatHistory(sessionKey: string, messages: ChatMessage[]): void {
  try {
    let toSave =
      messages.length > MAX_PERSISTED_MESSAGES
        ? messages.slice(-MAX_PERSISTED_MESSAGES)
        : messages;
    toSave = stripDataUriImages(toSave);
    localStorage.setItem(chatStorageKey(sessionKey), JSON.stringify(toSave));
  } catch {
    // Ignore quota / privacy errors
  }
}

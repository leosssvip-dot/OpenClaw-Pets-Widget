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

export function saveChatHistory(sessionKey: string, messages: ChatMessage[]): void {
  try {
    const toSave =
      messages.length > MAX_PERSISTED_MESSAGES
        ? messages.slice(-MAX_PERSISTED_MESSAGES)
        : messages;
    localStorage.setItem(chatStorageKey(sessionKey), JSON.stringify(toSave));
  } catch {
    // Ignore quota / privacy errors
  }
}

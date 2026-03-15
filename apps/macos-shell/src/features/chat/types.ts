export type ChatMessageRole = 'user' | 'assistant';

/** A single image attachment — stored as a data-URI or remote URL. */
export interface ChatImage {
  /** data:image/…;base64,… or https://… */
  url: string;
  /** Optional alt text */
  alt?: string;
}

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  /** Optional image attachments. */
  images?: ChatImage[];
  timestamp: number;
}

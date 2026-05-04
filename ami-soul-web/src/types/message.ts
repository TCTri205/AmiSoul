export type MessageRole = 'user' | 'assistant' | 'system';

export interface Reaction {
  emoji: string;
  count: number;
}

export interface Message {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: Date;
  status: 'sending' | 'sent' | 'error';
  reactions?: Reaction[];
  replyToId?: string;
  isCrisis?: boolean;
  isInterrupted?: boolean;
  interruptedAt?: number; // Character index where the message was cut
}

export interface StreamChunk {
  messageId: string;
  content: string;
  isFinal: boolean;
}

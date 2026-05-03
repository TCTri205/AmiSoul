import { SessionVibe } from './vibe';

export interface MessageMetadata {
  messageId?: string;
  session_type?: string;
  [key: string]: unknown;
}

export interface StreamChunkPayload {
  messageId?: string;
  content: string;
  is_complete?: boolean;
  metadata?: {
    provider?: string;
    model?: string;
  };
  timestamp: string;
}

export interface StreamEndPayload {
  messageId?: string;
  timestamp: string;
}

export interface MessageAckPayload {
  messageId: string;
  status: string;
  timestamp: string;
}

export interface VibeUpdatePayload {
  vibe: SessionVibe;
  timestamp: string;
}

export interface AiResponsePayload {
  id?: string;
  content: string;
  role: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface SocketErrorPayload {
  message: string;
  code?: string;
  [key: string]: unknown;
}

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
  bonding_score?: number;
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

export interface UserAudioPayload {
  audioBase64: string;
  mimeType: string;
  duration?: number;
  messageId?: string;
}

export interface UserImagePayload {
  images: string[]; // Base64 strings
  mimeTypes: string[];
  messageId?: string;
}

export interface BatchModeStartPayload {
  message?: string;
  timestamp: string;
}

export interface AccountLinkSuggestionPayload {
  bonding_score: number;
  message: string;
}

export interface GuestAuthPayload {
  token: string;
}

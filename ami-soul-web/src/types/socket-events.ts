export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  USER_MESSAGE: 'user_message',
  AI_MESSAGE_CHUNK: 'ai_message_chunk',
  AI_MESSAGE_END: 'ai_message_end',
  VIBE_UPDATE: 'vibe_update',
  ERROR: 'error',
  INTERRUPT: 'interrupt',
  PROCESSING_START: 'processing_start',
} as const;

export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];

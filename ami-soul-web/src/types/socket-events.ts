export const SOCKET_EVENTS = {
  // Connection events (Socket.io built-in)
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  RECONNECT_ATTEMPT: 'reconnect_attempt',

  // Server -> Client
  STREAM_CHUNK: 'stream_chunk',      // Streaming AI response
  STREAM_END: 'stream_end',           // Streaming AI response completed
  VIBE_UPDATE: 'vibe_update',         // Session vibe change
  PROCESSING_START: 'processing_start', // AI started thinking
  MESSAGE_ACK: 'message_ack',         // Message received and buffered
  AI_RESPONSE: 'ai_response',         // Full AI message (not streamed)
  CRISIS_RESPONSE: 'crisis_response', // AI crisis/safety message
  SUGGEST_ACCOUNT_LINK: 'suggest_account_link', // Suggest guest upgrade account
  GUEST_AUTH: 'guest_auth',           // Backend returns guest JWT
  BATCH_MODE_START: 'batch_mode_start', // Server indicates it's buffering multiple messages
  ERROR: 'error',                     // Generic error

  // Client -> Server
  MESSAGE_SENT: 'message_sent',       // User sends a message
  INTERRUPT: 'interrupt',             // User interrupts AI stream
  MESSAGE_REACTION: 'message_reaction', // User reacts to message
  USER_AUDIO: 'user_audio',           // User sends voice recording
  USER_IMAGE: 'user_image',           // User sends image(s)
} as const;

export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useChatStore } from '@/store/useChatStore';
import { useVibeStore } from '@/store/useVibeStore';
import { generateDeviceId } from '@/lib/utils';
import { SOCKET_EVENTS } from '@/types/socket-events';
import type { 
  MessageMetadata, 
  StreamChunkPayload, 
  MessageAckPayload, 
  VibeUpdatePayload, 
  AiResponsePayload,
  SocketErrorPayload 
} from '@/types/socket.types';

type SocketContextValue = {
  socket: Socket | null;
  sendMessage: (content: string, metadata?: MessageMetadata) => void;
  sendInterrupt: (payload?: { messageId?: string }) => void;
  sendReaction: (messageId: string, emoji: string) => void;
};

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return ctx;
};

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    const token = typeof window !== 'undefined' ? localStorage.getItem('ami_soul_token') : null;
    const deviceId = generateDeviceId();

    const socketInstance = io(socketUrl, {
      auth: token ? { token } : undefined,
      query: { device_id: deviceId },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5,
    });

    setSocket(socketInstance);

    // Connection events
    socketInstance.on(SOCKET_EVENTS.CONNECT, () => {
      console.log('[Socket] Connected');
      useVibeStore.getState().setConnectionStatus('connected');
    });

    socketInstance.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log('[Socket] Disconnected');
      useVibeStore.getState().setConnectionStatus('disconnected');
      useVibeStore.getState().setVibe('offline');
    });

    socketInstance.on(SOCKET_EVENTS.RECONNECT_ATTEMPT, () => {
      useVibeStore.getState().setConnectionStatus('reconnecting');
    });

    socketInstance.on(SOCKET_EVENTS.CONNECT_ERROR, (err) => {
      console.error('[Socket] Connection Error:', err);
      useVibeStore.getState().setConnectionStatus('disconnected');
      useVibeStore.getState().setVibe('offline');
    });

    // Server-sent events
    socketInstance.on(SOCKET_EVENTS.PROCESSING_START, () => {
      useChatStore.getState().setTypingState('initial');
      useChatStore.getState().startTypingTimeout();
    });

    socketInstance.on(SOCKET_EVENTS.MESSAGE_ACK, (data: MessageAckPayload) => {
      useChatStore.getState().updateMessageStatus(data.messageId, 'sent');
    });

    socketInstance.on(SOCKET_EVENTS.AI_RESPONSE, (data: AiResponsePayload) => {
      useChatStore.getState().clearTypingTimeouts();
      useChatStore.getState().setTypingState('none');
      useChatStore.getState().addMessage({
        id: data.id || `ai_${Date.now()}`,
        content: data.content,
        role: (data.role === 'assistant' || data.role === 'user' || data.role === 'system') ? data.role : 'assistant',
        timestamp: new Date(data.timestamp),
        status: 'sent',
      });
    });

    socketInstance.on(SOCKET_EVENTS.STREAM_CHUNK, (data: StreamChunkPayload) => {
      // Use 'current' as fallback if messageId is missing (MVP compatibility)
      const messageId = data.messageId || 'current';
      useChatStore.getState().setStreaming(true);
      useChatStore.getState().appendChunk(messageId, data.content);
      
      if (data.is_complete) {
        useChatStore.getState().finalizeStream(messageId);
      }
    });

    socketInstance.on(SOCKET_EVENTS.STREAM_END, (data: { messageId?: string }) => {
      const messageId = (data && data.messageId) || 'current';
      useChatStore.getState().finalizeStream(messageId);
    });

    socketInstance.on(SOCKET_EVENTS.VIBE_UPDATE, (data: VibeUpdatePayload) => {
      useVibeStore.getState().setVibe(data.vibe);
    });

    socketInstance.on(SOCKET_EVENTS.ERROR, (err: SocketErrorPayload) => {
      console.error('[Socket] Server Error:', err);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const sendMessage = useCallback((content: string, metadata?: MessageMetadata) => {
    if (socket) {
      socket.emit(SOCKET_EVENTS.MESSAGE_SENT, { content, metadata });
    }
  }, [socket]);

  const sendInterrupt = useCallback((payload?: { messageId?: string }) => {
    if (socket) {
      socket.emit(SOCKET_EVENTS.INTERRUPT, payload);
    }
  }, [socket]);

  const sendReaction = useCallback((messageId: string, emoji: string) => {
    if (socket) {
      socket.emit(SOCKET_EVENTS.MESSAGE_REACTION, { messageId, emoji });
    }
  }, [socket]);

  const value: SocketContextValue = {
    socket,
    sendMessage,
    sendInterrupt,
    sendReaction,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

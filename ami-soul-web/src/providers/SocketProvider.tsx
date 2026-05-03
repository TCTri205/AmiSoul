'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useChatStore } from '@/store/useChatStore';
import { useVibeStore } from '@/store/useVibeStore';
import { generateDeviceId } from '@/lib/utils';
import { SOCKET_EVENTS } from '@/types/socket-events';
import type { SessionVibe } from '@/types/vibe';

type SocketContextValue = {
  socket: Socket | null;
  sendMessage: (content: string, metadata?: any) => void;
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
    });

    socketInstance.on(SOCKET_EVENTS.RECONNECT_ATTEMPT, () => {
      useVibeStore.getState().setConnectionStatus('reconnecting');
    });

    socketInstance.on(SOCKET_EVENTS.CONNECT_ERROR, (err) => {
      console.error('[Socket] Connection Error:', err);
      useVibeStore.getState().setConnectionStatus('disconnected');
    });

    // Server-sent events
    socketInstance.on(SOCKET_EVENTS.PROCESSING_START, () => {
      useChatStore.getState().setTyping(true);
    });

    socketInstance.on(SOCKET_EVENTS.STREAM_CHUNK, (data: { messageId?: string; content: string; is_complete?: boolean }) => {
      // Use 'current' as fallback if messageId is missing (MVP compatibility)
      const messageId = data.messageId || 'current';
      useChatStore.getState().setTyping(false);
      useChatStore.getState().setStreaming(true);
      useChatStore.getState().appendChunk(messageId, data.content);
      
      if (data.is_complete) {
        useChatStore.getState().setStreaming(false);
      }
    });

    socketInstance.on(SOCKET_EVENTS.STREAM_END, (data: { messageId?: string }) => {
      useChatStore.getState().setStreaming(false);
    });

    socketInstance.on(SOCKET_EVENTS.VIBE_UPDATE, (data: { vibe: SessionVibe }) => {
      useVibeStore.getState().setVibe(data.vibe);
    });

    socketInstance.on(SOCKET_EVENTS.ERROR, (err: any) => {
      console.error('[Socket] Server Error:', err);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const sendMessage = useCallback((content: string, metadata?: any) => {
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

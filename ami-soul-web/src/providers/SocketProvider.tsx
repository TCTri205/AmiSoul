'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useChatStore } from '@/store/useChatStore';
import { useVibeStore } from '@/store/useVibeStore';
import { useLocalCache } from '@/hooks/useLocalCache';
import { useHapticFeedback } from '@/components/vibe/HapticFeedback';
import * as cache from '@/lib/cache';
import { SOCKET_EVENTS } from '@/types/socket-events';
import type { 
  MessageMetadata, 
  StreamChunkPayload, 
  MessageAckPayload, 
  VibeUpdatePayload, 
  AiResponsePayload,
  SocketErrorPayload,
  AccountLinkSuggestionPayload,
  BatchModeStartPayload,
  UserAudioPayload,
  UserImagePayload,
  GuestAuthPayload
} from '@/types/socket.types';
import { AccountLinkSheet } from '@/components/layout/AccountLinkSheet';

type SocketContextValue = {
  socket: Socket | null;
  sendMessage: (content: string, metadata?: MessageMetadata) => void;
  sendInterrupt: (payload?: { messageId?: string }) => void;
  sendReaction: (messageId: string, emoji: string) => void;
  sendAudio: (payload: UserAudioPayload) => void;
  sendImage: (payload: UserImagePayload) => void;
  updateGuestToken: (token: string) => void;
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
  const [token, setToken] = useState<string | null>(null); // In-memory token storage
  const [showAccountLink, setShowAccountLink] = useState(false);
  const [accountLinkData, setAccountLinkData] = useState<AccountLinkSuggestionPayload | null>(null);
  
  const { initializeCache, queueMessage, isOffline } = useLocalCache();
  const { triggerStrong, triggerSoft } = useHapticFeedback();
  const socketRef = useRef<Socket | null>(null);

  // Method to update guest token from memory
  const updateGuestToken = useCallback((newToken: string) => {
    console.log('[Socket] Setting guest token in memory');
    setToken(newToken);
  }, []);

  // Use refs for triggers to prevent socket reconnection when settings change
  const triggerStrongRef = useRef(triggerStrong);
  const triggerSoftRef = useRef(triggerSoft);

  useEffect(() => {
    triggerStrongRef.current = triggerStrong;
    triggerSoftRef.current = triggerSoft;
  }, [triggerStrong, triggerSoft]);

  useEffect(() => {
    let socketInstance: Socket | null = null;
    let isMounted = true;

    const init = async () => {
      const deviceId = await initializeCache();
      if (!isMounted) return;

      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
      
      // Try memory token first, then localStorage (for persistent users)
      const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('ami_soul_token') : null);

      socketInstance = io(socketUrl, {
        auth: currentToken ? { token: currentToken } : undefined,
        query: { device_id: deviceId },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
        randomizationFactor: 0.5,
      });

      socketRef.current = socketInstance;
      setSocket(socketInstance);

      // Connection events
      socketInstance.on(SOCKET_EVENTS.CONNECT, async () => {
        console.log('[Socket] Connected');
        useVibeStore.getState().setConnectionStatus('connected');
        
        // Process outbox queue on connect
        const outbox = await cache.getOutbox();
        if (outbox.length > 0) {
          console.log(`[Socket] Processing ${outbox.length} queued messages`);
          for (const msg of outbox) {
            if (socketInstance) {
              socketInstance.emit(SOCKET_EVENTS.MESSAGE_SENT, { 
                content: msg.content, 
                metadata: msg.metadata 
              });
            }
            if (msg.id) await cache.removeFromOutbox(msg.id);
          }
        }
      });

      socketInstance.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
        console.log('[Socket] Disconnected, reason:', reason);
        useVibeStore.getState().setConnectionStatus('disconnected');
        useVibeStore.getState().setVibe('offline');
        
        // Clear typing state on disconnect
        useChatStore.getState().clearTypingTimeouts();
        useChatStore.getState().setTypingState('none');

        if (reason === 'io server disconnect' && socketInstance) {
          // the disconnection was initiated by the server, you need to reconnect manually
          setTimeout(() => {
            socketInstance?.connect();
          }, 1000);
        }
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
        useChatStore.getState().resetInterrupts();
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
          isCrisis: data.metadata?.is_crisis as boolean | undefined,
        });

        // Trigger haptic
        triggerSoftRef.current();
      });

      socketInstance.on(SOCKET_EVENTS.CRISIS_RESPONSE, (data: AiResponsePayload) => {
        useChatStore.getState().clearTypingTimeouts();
        useChatStore.getState().setTypingState('none');
        
        useChatStore.getState().addMessage({
          id: data.id || `crisis_${Date.now()}`,
          content: data.content,
          role: 'assistant',
          timestamp: new Date(data.timestamp),
          status: 'sent',
          isCrisis: true,
        });

        // Crisis always triggers strong feedback
        useVibeStore.getState().setVibe('crisis');
        triggerStrongRef.current();
      });

      socketInstance.on(SOCKET_EVENTS.STREAM_CHUNK, (data: StreamChunkPayload) => {
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
        if (data.bonding_score !== undefined) {
          useVibeStore.getState().setBondingScore(data.bonding_score);
        }
        
        // Trigger haptics for strong vibes
        if (data.vibe === 'positive' || data.vibe === 'stressed') {
          triggerSoftRef.current();
        }
      });

      socketInstance.on(SOCKET_EVENTS.GUEST_AUTH, (data: GuestAuthPayload) => {
        console.log('[Socket] Guest auth received, saving token to memory');
        updateGuestToken(data.token);
      });

      socketInstance.on(SOCKET_EVENTS.SUGGEST_ACCOUNT_LINK, (data: AccountLinkSuggestionPayload) => {
        console.log('[Socket] Account link suggested:', data);
        setAccountLinkData(data);
        setShowAccountLink(true);
      });

      socketInstance.on(SOCKET_EVENTS.BATCH_MODE_START, (data: BatchModeStartPayload) => {
        console.log('[Socket] Batch Mode Started:', data.message);
        useChatStore.getState().setBatchModeActive(true);
      });

      socketInstance.on(SOCKET_EVENTS.ERROR, (err: SocketErrorPayload) => {
        console.error('[Socket] Server Error:', err);
      });
    };

    init();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [initializeCache, token, updateGuestToken]);

  const sendMessage = useCallback((content: string, metadata?: MessageMetadata) => {
    if (isOffline()) {
      console.log('[Socket] Offline: Queuing message');
      queueMessage(content, metadata);
      return;
    }

    if (socketRef.current) {
      socketRef.current.emit(SOCKET_EVENTS.MESSAGE_SENT, { content, metadata });
    }
  }, [isOffline, queueMessage]);

  const sendInterrupt = useCallback((payload?: { messageId?: string }) => {
    if (socketRef.current) {
      socketRef.current.emit(SOCKET_EVENTS.INTERRUPT, payload);
    }
  }, []);

  const sendReaction = useCallback((messageId: string, emoji: string) => {
    if (socketRef.current) {
      socketRef.current.emit(SOCKET_EVENTS.MESSAGE_REACTION, { messageId, emoji });
    }
  }, []);

  const sendAudio = useCallback((payload: UserAudioPayload) => {
    if (socketRef.current) {
      socketRef.current.emit(SOCKET_EVENTS.USER_AUDIO, payload);
    }
  }, []);

  const sendImage = useCallback((payload: UserImagePayload) => {
    if (socketRef.current) {
      socketRef.current.emit(SOCKET_EVENTS.USER_IMAGE, payload);
    }
  }, []);

  const value: SocketContextValue = {
    socket,
    sendMessage,
    sendInterrupt,
    sendReaction,
    sendAudio,
    sendImage,
    updateGuestToken,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
      <AccountLinkSheet 
        open={showAccountLink} 
        onOpenChange={setShowAccountLink}
        bondingScore={accountLinkData?.bonding_score}
        suggestionMessage={accountLinkData?.message}
      />
    </SocketContext.Provider>
  );
};

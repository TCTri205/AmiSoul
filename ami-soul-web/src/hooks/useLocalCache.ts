'use client';

import { useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useChatStore } from '@/store/useChatStore';
import { useVibeStore } from '@/store/useVibeStore';
import * as cache from '@/lib/cache';

export const useLocalCache = () => {
  const { setMessages, messages } = useChatStore();
  const { connectionStatus } = useVibeStore();

  const initializeCache = useCallback(async () => {
    // 1. Initialize DB
    await cache.initDB();

    // 2. Load/Generate Device ID
    let deviceId = await cache.getDeviceId();
    
    // Migration from localStorage
    if (!deviceId && typeof window !== 'undefined') {
      const oldId = localStorage.getItem('ami_soul_device_id');
      if (oldId) {
        deviceId = oldId;
        await cache.setDeviceId(deviceId);
        localStorage.removeItem('ami_soul_device_id'); // Clean up after migration
      }
    }

    if (!deviceId) {
      deviceId = uuidv4();
      await cache.setDeviceId(deviceId);
    }

    // 3. Load Messages
    const cachedMessages = await cache.getMessages(50);
    if (cachedMessages.length > 0) {
      setMessages(cachedMessages);
    }

    return deviceId;
  }, [setMessages]);

  // Auto-sync messages to IndexedDB (debounced)
  useEffect(() => {
    if (messages.length === 0) return;

    const timeoutId = setTimeout(() => {
      // Save all messages to ensure status updates (e.g. 'sent') are persisted
      // even for older messages in the list
      cache.saveAllMessages(messages);
    }, 1000); // 1s debounce to avoid thrashing on streams

    return () => clearTimeout(timeoutId);
  }, [messages]);

  const queueMessage = async (content: string, metadata?: Record<string, unknown>) => {
    const queuedMessage: cache.QueuedMessage = {
      content,
      metadata,
      timestamp: Date.now(),
    };
    await cache.addToOutbox(queuedMessage);
  };

  const isOffline = () => connectionStatus !== 'connected';

  return {
    initializeCache,
    queueMessage,
    isOffline,
  };
};

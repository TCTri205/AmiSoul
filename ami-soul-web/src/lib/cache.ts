import { openDB, IDBPDatabase } from 'idb';
import { Message } from '@/types/message';

const DB_NAME = 'AmiSoulDB';
const DB_VERSION = 1;

export interface QueuedMessage {
  id?: number;
  content: string;
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface AmiSoulSchema {
  messages: {
    key: string;
    value: Message;
  };
  device: {
    key: 'device_id';
    value: string;
  };
  outbox: {
    key: number;
    value: QueuedMessage;
  };
}

let dbPromise: Promise<IDBPDatabase<AmiSoulSchema>> | null = null;

export const initDB = () => {
  if (typeof window === 'undefined') return null;
  
  if (!dbPromise) {
    dbPromise = openDB<AmiSoulSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('messages')) {
          db.createObjectStore('messages', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('device')) {
          db.createObjectStore('device');
        }
        if (!db.objectStoreNames.contains('outbox')) {
          db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
};

// Device ID Operations
export const getDeviceId = async (): Promise<string | null> => {
  try {
    const db = await initDB();
    if (!db) return null;
    return (await db.get('device', 'device_id')) || null;
  } catch (error) {
    console.error('[Cache] getDeviceId failed:', error);
    return null;
  }
};

export const setDeviceId = async (id: string): Promise<void> => {
  try {
    const db = await initDB();
    if (!db) return;
    await db.put('device', id, 'device_id');
  } catch (error) {
    console.error('[Cache] setDeviceId failed:', error);
  }
};

// Message Operations
export const saveMessage = async (message: Message): Promise<void> => {
  try {
    const db = await initDB();
    if (!db) return;
    await db.put('messages', message);
  } catch (error) {
    console.error('[Cache] saveMessage failed:', error);
  }
};

export const saveAllMessages = async (messages: Message[]): Promise<void> => {
  try {
    const db = await initDB();
    if (!db) return;

    const tx = db.transaction('messages', 'readwrite');
    const store = tx.objectStore('messages');
    
    // Save all
    await Promise.all(messages.map(msg => store.put(msg)));
    
    // LRU Eviction: Keep only last 50
    const allKeys = await store.getAllKeys();
    if (allKeys.length > 50) {
      const allMessages = await store.getAll();
      const sorted = allMessages.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      const toDelete = sorted.slice(0, allMessages.length - 50);
      await Promise.all(toDelete.map(msg => store.delete(msg.id)));
    }

    await tx.done;
  } catch (error) {
    console.error('[Cache] saveAllMessages failed:', error);
  }
};

export const getMessages = async (limit: number = 50): Promise<Message[]> => {
  try {
    const db = await initDB();
    if (!db) return [];
    
    const messages = await db.getAll('messages');
    return messages
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-limit);
  } catch (error) {
    console.error('[Cache] getMessages failed:', error);
    return [];
  }
};

export const deleteMessage = async (id: string): Promise<void> => {
  try {
    const db = await initDB();
    if (!db) return;
    await db.delete('messages', id);
  } catch (error) {
    console.error('[Cache] deleteMessage failed:', error);
  }
};

// Outbox Operations
export const addToOutbox = async (message: QueuedMessage): Promise<number | undefined> => {
  try {
    const db = await initDB();
    if (!db) return;
    return await db.add('outbox', message);
  } catch (error) {
    console.error('[Cache] addToOutbox failed:', error);
    return undefined;
  }
};

export const getOutbox = async (): Promise<QueuedMessage[]> => {
  try {
    const db = await initDB();
    if (!db) return [];
    return await db.getAll('outbox');
  } catch (error) {
    console.error('[Cache] getOutbox failed:', error);
    return [];
  }
};

export const removeFromOutbox = async (id: number): Promise<void> => {
  try {
    const db = await initDB();
    if (!db) return;
    await db.delete('outbox', id);
  } catch (error) {
    console.error('[Cache] removeFromOutbox failed:', error);
  }
};

export const clearOutbox = async (): Promise<void> => {
  try {
    const db = await initDB();
    if (!db) return;
    await db.clear('outbox');
  } catch (error) {
    console.error('[Cache] clearOutbox failed:', error);
  }
};

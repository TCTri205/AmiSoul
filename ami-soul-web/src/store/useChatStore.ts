import { create } from 'zustand';
import { Message } from '@/types/message';

interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  isTyping: boolean;
  streamingChunks: Record<string, string>;
  
  // Actions
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  appendChunk: (messageId: string, chunk: string) => void;
  setStreaming: (isStreaming: boolean) => void;
  setTyping: (isTyping: boolean) => void;
  clearStreamingChunks: (messageId?: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  isTyping: false,
  streamingChunks: {},

  addMessage: (message) => 
    set((state) => ({ messages: [...state.messages, message] })),

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),

  appendChunk: (messageId, chunk) =>
    set((state) => ({
      streamingChunks: {
        ...state.streamingChunks,
        [messageId]: (state.streamingChunks[messageId] || '') + chunk,
      },
    })),

  setStreaming: (isStreaming) => set({ isStreaming }),
  setTyping: (isTyping) => set({ isTyping }),

  clearStreamingChunks: (messageId) =>
    set((state) => {
      if (messageId) {
        const newChunks = { ...state.streamingChunks };
        delete newChunks[messageId];
        return { streamingChunks: newChunks };
      }
      return { streamingChunks: {} };
    }),
}));

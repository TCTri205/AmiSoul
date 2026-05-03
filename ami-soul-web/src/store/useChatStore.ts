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
  updateMessageStatus: (id: string, status: Message['status']) => void;
  appendChunk: (messageId: string, chunk: string) => void;
  finalizeStream: (messageId: string) => void;
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
    set((state) => ({ 
      messages: [...state.messages, {
        ...message,
        id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp),
      }] 
    })),

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),

  updateMessageStatus: (id, status) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, status } : m)),
    })),


  appendChunk: (messageId, chunk) =>
    set((state) => ({
      streamingChunks: {
        ...state.streamingChunks,
        [messageId]: (state.streamingChunks[messageId] || '') + chunk,
      },
    })),

  finalizeStream: (messageId) =>
    set((state) => {
      const content = state.streamingChunks[messageId];
      if (!content) return state;

      const newMessage: Message = {
        id: messageId === 'current' ? `ai_${Date.now()}` : messageId,
        content,
        role: 'assistant',
        timestamp: new Date(),
        status: 'sent',
      };

      const newChunks = { ...state.streamingChunks };
      delete newChunks[messageId];

      return {
        messages: [...state.messages, newMessage],
        streamingChunks: newChunks,
        isStreaming: false,
      };
    }),

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

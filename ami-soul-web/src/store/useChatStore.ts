import { create } from 'zustand';
import { Message } from '@/types/message';

export type TypingState = 'none' | 'initial' | 'thinking' | 'error';

interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  typingState: TypingState;
  streamingChunks: Record<string, string>;
  replyToMessage: Message | null;
  
  // Timeout tracking
  lastChunkTimestamp: number | null;
  typingTimeoutId: NodeJS.Timeout | null;
  errorTimeoutId: NodeJS.Timeout | null;
  
  // Actions
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  updateMessageStatus: (id: string, status: Message['status']) => void;
  appendChunk: (messageId: string, chunk: string) => void;
  finalizeStream: (messageId: string, isInterrupted?: boolean) => void;
  setStreaming: (isStreaming: boolean) => void;
  setTypingState: (state: TypingState) => void;
  setReplyToMessage: (message: Message | null) => void;
  clearStreamingChunks: (messageId?: string) => void;
  toggleReaction: (messageId: string, emoji: string) => void;

  // Preemption Actions
  setConsecutiveInterrupts: (count: number) => void;
  setBatchModeActive: (active: boolean) => void;
  incrementInterrupts: () => void;
  resetInterrupts: () => void;

  // Timeout Actions
  startTypingTimeout: () => void;
  clearTypingTimeouts: () => void;
  resetStreaming: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  typingState: 'none',
  streamingChunks: {},
  replyToMessage: null,
  consecutiveInterrupts: 0,
  batchModeActive: false,
  lastChunkTimestamp: null,
  typingTimeoutId: null,
  errorTimeoutId: null,

  setMessages: (messages) => set({ messages }),

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

  appendChunk: (messageId, chunk) => {
    const { clearTypingTimeouts, startTypingTimeout } = get();
    clearTypingTimeouts();
    // Restart timeout on every chunk to detect if stream stalls
    startTypingTimeout();

    set((state) => {
      // If message is already finalized, ignore late chunks
      if (state.messages.some(m => m.id === messageId)) {
        return state;
      }

      return {
        lastChunkTimestamp: Date.now(),
        typingState: 'none',
        streamingChunks: {
          ...state.streamingChunks,
          [messageId]: (state.streamingChunks[messageId] || '') + chunk,
        },
      };
    });
  },

  finalizeStream: (messageId, isInterrupted = false) => {
    const { clearTypingTimeouts } = get();
    clearTypingTimeouts();

    set((state) => {
      const content = state.streamingChunks[messageId];
      if (!content) {
        return { 
          ...state, 
          isStreaming: Object.keys(state.streamingChunks).length > 0, 
          typingState: 'none' 
        };
      }

      // If message is already in messages, don't add it again. Just clean up chunks.
      if (state.messages.some(m => m.id === messageId)) {
        const newChunks = { ...state.streamingChunks };
        delete newChunks[messageId];
        return {
          ...state,
          streamingChunks: newChunks,
          isStreaming: Object.keys(newChunks).length > 0,
        };
      }

      const newMessage: Message = {
        id: messageId === 'current' ? `ai_${Date.now()}` : messageId,
        content: isInterrupted ? `${content}...` : content,
        role: 'assistant',
        timestamp: new Date(),
        status: 'sent',
        isInterrupted,
        interruptedAt: isInterrupted ? content.length : undefined,
      };

      const newChunks = { ...state.streamingChunks };
      delete newChunks[messageId];

      return {
        messages: [...state.messages, newMessage],
        streamingChunks: newChunks,
        isStreaming: Object.keys(newChunks).length > 0,
        typingState: 'none',
        lastChunkTimestamp: null,
      };
    });
  },

  setStreaming: (isStreaming) => set({ isStreaming }),
  
  setTypingState: (typingState) => set({ typingState }),

  setReplyToMessage: (replyToMessage) => set({ replyToMessage }),

  clearStreamingChunks: (messageId) =>
    set((state) => {
      if (messageId) {
        const newChunks = { ...state.streamingChunks };
        delete newChunks[messageId];
        return { streamingChunks: newChunks };
      }
      return { streamingChunks: {} };
    }),

  toggleReaction: (messageId, emoji) =>
    set((state) => ({
      messages: state.messages.map((msg) => {
        if (msg.id !== messageId) return msg;

        const reactions = [...(msg.reactions || [])];
        const index = reactions.findIndex((r) => r.emoji === emoji);

        if (index > -1) {
          // Remove or decrement
          if (reactions[index].count > 1) {
            reactions[index] = { ...reactions[index], count: reactions[index].count - 1 };
          } else {
            reactions.splice(index, 1);
          }
        } else {
          // Add new
          reactions.push({ emoji, count: 1 });
        }

        return { ...msg, reactions };
      }),
    })),

  setConsecutiveInterrupts: (consecutiveInterrupts) => set({ consecutiveInterrupts }),
  setBatchModeActive: (batchModeActive) => set({ batchModeActive }),
  incrementInterrupts: () => set((state) => ({ consecutiveInterrupts: state.consecutiveInterrupts + 1 })),
  resetInterrupts: () => set({ consecutiveInterrupts: 0, batchModeActive: false }),

  startTypingTimeout: () => {
    const { clearTypingTimeouts } = get();
    clearTypingTimeouts();

    const tId = setTimeout(() => {
      set({ typingState: 'thinking' });
    }, 6000);

    const eId = setTimeout(() => {
      set({ typingState: 'error' });
    }, 15000);

    set({ typingTimeoutId: tId as unknown as NodeJS.Timeout, errorTimeoutId: eId as unknown as NodeJS.Timeout });
  },

  clearTypingTimeouts: () => {
    const { typingTimeoutId, errorTimeoutId } = get();
    if (typingTimeoutId) clearTimeout(typingTimeoutId);
    if (errorTimeoutId) clearTimeout(errorTimeoutId);
    set({ typingTimeoutId: null, errorTimeoutId: null });
  },

  resetStreaming: () => {
    const { clearTypingTimeouts } = get();
    clearTypingTimeouts();
    set({
      isStreaming: false,
      typingState: 'none',
      streamingChunks: {},
      lastChunkTimestamp: null,
    });
  },
}));
Timestamp: null,
    });
  },
}));

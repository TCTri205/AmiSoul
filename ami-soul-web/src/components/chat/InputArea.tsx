'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Plus } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { useSocket } from '@/providers/SocketProvider';
import { useVibeStore } from '@/store/useVibeStore';
import ReplyPreview from './ReplyPreview';
import { cn } from '@/lib/utils';

const InputArea = () => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, sendInterrupt } = useSocket();
  const { connectionStatus } = useVibeStore();
  const { 
    replyToMessage, 
    setReplyToMessage, 
    addMessage,
    isStreaming,
    typingState,
    streamingChunks,
    finalizeStream
  } = useChatStore();

  const handleSend = () => {
    if (!text.trim()) return;

    // Handle interruption/preemption
    if (isStreaming) {
      sendInterrupt();
      // Optimistically finalize current streams as interrupted
      Object.keys(streamingChunks).forEach(id => {
        finalizeStream(id, true);
      });
    }

    const messageContent = text.trim();
    const tempId = `msg_${Date.now()}`;

    // Optimistic UI
    addMessage({
      id: tempId,
      content: messageContent,
      role: 'user',
      timestamp: new Date(),
      status: 'sending',
      replyToId: replyToMessage?.id
    });

    // Send via socket (or queue if offline)
    sendMessage(messageContent, { 
      replyToId: replyToMessage?.id,
      messageId: tempId
    });

    // Reset state
    setText('');
    setReplyToMessage(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize logic
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const isOffline = connectionStatus !== 'connected';
  const isDisabled = !text.trim() || typingState === 'thinking' || isOffline;

  return (
    <div className="sticky bottom-0 w-full p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-transparent z-20">
      {replyToMessage && (
        <ReplyPreview 
          message={replyToMessage} 
          onCancel={() => setReplyToMessage(null)} 
        />
      )}
      
      <div className="flex items-end gap-2 bg-white/20 dark:bg-black/30 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-2 shadow-lg">
        <button 
          disabled={isOffline}
          className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/10 dark:hover:bg-white/5 rounded-full transition-colors group disabled:opacity-30 disabled:cursor-not-allowed" 
          aria-label="Thêm tệp đính kèm"
        >
          <Plus className="w-5 h-5 text-foreground/60 group-hover:text-foreground/90" />
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isOffline ? "Đang đợi kết nối..." : "Trò chuyện với Ami..."}
          aria-label="Nội dung tin nhắn"
          disabled={isOffline}
          className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2 text-sm max-h-[120px] placeholder:text-foreground/40 scrollbar-none disabled:cursor-not-allowed"
        />

        <div className="flex items-center gap-1">
          {text.trim() ? (
            <button
              onClick={handleSend}
              disabled={isDisabled}
              aria-label="Gửi tin nhắn"
              className={cn(
                "p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all",
                isDisabled 
                  ? "bg-foreground/10 text-foreground/30 cursor-not-allowed" 
                  : "bg-foreground text-background hover:scale-105 active:scale-95"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          ) : (
            <button 
              disabled={isOffline}
              className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/10 dark:hover:bg-white/5 rounded-full transition-colors group disabled:opacity-30 disabled:cursor-not-allowed" 
              aria-label="Ghi âm tin nhắn"
            >
              <Mic className="w-5 h-5 text-foreground/60 group-hover:text-foreground/90" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InputArea;

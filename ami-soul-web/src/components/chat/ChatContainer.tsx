'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useChatStore } from '@/store/useChatStore';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { useSocket } from '@/providers/SocketProvider';        
import { useToast } from '@/hooks/use-toast';

const ChatContainer = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const { toast } = useToast();

  const { 
    messages, 
    isStreaming, 
    streamingChunks, 
    typingState,
    batchModeActive,
    consecutiveInterrupts,
    resetInterrupts
  } = useChatStore();

  const { sendMessage: socketSendMessage } = useSocket();      

  // Watch for batch mode or excessive interrupts
  useEffect(() => {
    if (batchModeActive || consecutiveInterrupts > 2) {
      toast({
        title: "Chế độ gom tin",
        description: "Ami đang đọc hết tin của bạn để trả lời một lần cho kỹ nhé 🧠",
        duration: 5000,
      });
      
      if (consecutiveInterrupts > 2) {
        // Prevent spamming the toast by resetting count or setting a flag
        // Here we just keep it, but in a real app we might want to only show once per "session"
      }
    }
  }, [batchModeActive, consecutiveInterrupts, toast]);
  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 100;
    
    setShouldAutoScroll(isAtBottom);
  };

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (containerRef.current && shouldAutoScroll) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior
      });
    }
  }, [shouldAutoScroll]);

  // Scroll on new messages, streaming chunks, or viewport resize (keyboard)
  useEffect(() => {
    scrollToBottom(isStreaming ? 'auto' : 'smooth');
  }, [messages, streamingChunks, isStreaming, typingState, scrollToBottom]);

  useEffect(() => {
    const handleViewportResize = () => {
      if (shouldAutoScroll) {
        scrollToBottom('auto');
      }
    };

    window.visualViewport?.addEventListener('resize', handleViewportResize);
    return () => window.visualViewport?.removeEventListener('resize', handleViewportResize);
  }, [shouldAutoScroll, scrollToBottom]);

  const handleRetry = () => {
    // Find last user message to retry
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      useChatStore.getState().setTypingState('initial');
      useChatStore.getState().startTypingTimeout();
      socketSendMessage(lastUserMsg.content, { replyToId: lastUserMsg.replyToId });
    }
  };

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-6 scrollbar-none flex flex-col"
    >
      <div className="flex-1" /> {/* Spacer to push messages to bottom if few */}
      
      {messages.map((msg, index) => (
        <MessageBubble 
          key={msg.id} 
          message={msg} 
          showTimestamp={index === messages.length - 1} // Show for last message or on interaction (todo)
        />
      ))}

      {isStreaming && Object.entries(streamingChunks).map(([id, content]) => (
        <MessageBubble 
          key={id}
          message={{
            id,
            content: '',
            role: 'assistant',
            timestamp: new Date(),
            status: 'sent'
          }}
          isStreaming={true}
          streamingContent={content}
        />
      ))}

      <TypingIndicator 
        state={typingState} 
        onRetry={handleRetry}
      />
      
      {/* Padding at the bottom to ensure last message is above input area */}
      <div className="h-4 flex-shrink-0" />
    </div>
  );
};

export default ChatContainer;

'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '@/types/message';
import { useChatStore } from '@/store/useChatStore';
import { useSocket } from '@/providers/SocketProvider';
import { useHapticFeedback } from '@/components/vibe/HapticFeedback';
import ReactionBar from './ReactionBar';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  streamingContent?: string;
  showTimestamp?: boolean;
}

const ActionTag = ({ children }: { children?: React.ReactNode }) => (
  <span className="text-[0.75em] text-foreground/50 italic font-medium mx-1 opacity-80">
    {children}
  </span>
);

const MessageBubble = ({ 
  message, 
  isStreaming, 
  streamingContent,
  showTimestamp = false 
}: MessageBubbleProps) => {
  const [showReactionBar, setShowReactionBar] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  
  const { toggleReaction } = useChatStore();
  const { sendReaction } = useSocket();
  const { triggerSoft } = useHapticFeedback();
  
  const isUser = message.role === 'user';
  const isCrisis = message.isCrisis;
  const content = isStreaming ? streamingContent : message.content;

  const handleReactionSelect = (emoji: string) => {
    toggleReaction(message.id, emoji);
    sendReaction(message.id, emoji);
    triggerSoft();
    setShowReactionBar(false);
  };

  // Long press for mobile
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowReactionBar(true);
      triggerSoft();
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  // Hover for desktop
  const handleMouseEnter = () => {
    if (window.matchMedia('(hover: hover)').matches) {
      setShowReactionBar(true);
    }
  };

  const handleMouseLeave = () => {
    setShowReactionBar(false);
  };

  // Custom component for markdown to handle *action* text and tel links
  const components = {
    em: ({ children }: { children?: React.ReactNode }) => {
      // If it looks like an action (e.g. *smiles*)
      return <ActionTag>*{children}*</ActionTag>;
    },
    a: ({ href, children }: { href?: string, children?: React.ReactNode }) => {
      const isTel = href?.startsWith('tel:');
      return (
        <a 
          href={href} 
          className={cn(
            "underline underline-offset-2 transition-colors",
            isTel ? "text-blue-500 font-bold hover:text-blue-600 dark:text-blue-400" : "text-primary"
          )}
        >
          {children}
        </a>
      );
    }
  };

  return (
    <motion.div
      initial={isUser ? { opacity: 0, y: 10 } : { opacity: 0, x: -10 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      transition={{ 
        type: "spring",
        stiffness: 400,
        damping: 30,
        mass: 0.8,
        duration: isUser ? 0.1 : 0.15 
      }}
      className={cn(
        "flex flex-col max-w-[85%] group relative",
        isUser ? "ml-auto items-end mb-6" : "mr-auto items-start mb-4",
        message.isInterrupted && "opacity-60 grayscale-[0.2]"
      )}
      aria-label={`Tin nhắn từ ${isUser ? 'bạn' : 'Ami'}: ${content || ''}`}
    >
      <AnimatePresence>
        {showReactionBar && !isStreaming && (
          <div className={cn(
            "absolute -top-10 z-30",
            isUser ? "right-0" : "left-0"
          )}>
            <ReactionBar onSelect={handleReactionSelect} />
          </div>
        )}
      </AnimatePresence>

      <div
        className={cn(
          "relative px-4 py-3 backdrop-blur-md shadow-sm transition-all duration-500 overflow-hidden break-words",
          isUser 
            ? "bg-white/30 dark:bg-white/10 text-foreground rounded-2xl rounded-br-md border border-white/20 dark:border-white/10" 
            : cn(
                "bg-white/10 dark:bg-black/40 text-foreground rounded-2xl rounded-bl-md border shadow-inner",
                isCrisis 
                  ? "border-blue-400/50 bg-blue-50/5 dark:bg-blue-900/10 shadow-blue-500/10" 
                  : "border-white/10 dark:border-white/5",
                message.isInterrupted && "after:absolute after:inset-0 after:bg-gradient-to-t after:from-background/40 after:to-transparent after:pointer-events-none"
              )
        )}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none break-words">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={components}
          >
            {content || ''}
          </ReactMarkdown>
          
          {isStreaming && (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="inline-block w-1.5 h-4 ml-1 bg-foreground/60 align-middle"
            />
          )}
        </div>

        {isUser && message.status === 'sent' && (
          <div className="absolute -bottom-5 right-0 text-[10px] text-foreground/40 font-medium">
            Đã xem ✓
          </div>
        )}
      </div>

      {/* Reaction Badges */}
      {message.reactions && message.reactions.length > 0 && (
        <div className={cn(
          "flex flex-wrap gap-1 mt-1",
          isUser ? "justify-end" : "justify-start"
        )}>
          {message.reactions.map((r) => (
            <motion.div
              key={r.emoji}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1 px-1.5 py-0.5 bg-white/40 dark:bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px]"
            >
              <span>{r.emoji}</span>
              {r.count > 1 && <span className="font-bold opacity-70">{r.count}</span>}
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showTimestamp && (
          <motion.span 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[10px] text-foreground/40 mt-1 px-1"
          >
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MessageBubble;

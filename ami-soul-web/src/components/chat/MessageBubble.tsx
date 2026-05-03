'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '@/types/message';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  streamingContent?: string;
  showTimestamp?: boolean;
}

const ActionTag = ({ children }: { children: React.ReactNode }) => (
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
  const isUser = message.role === 'user';
  const content = isStreaming ? streamingContent : message.content;

  // Custom component for markdown to handle *action* text
  const components = {
    em: ({ children }: { children: React.ReactNode }) => {
      // If it looks like an action (e.g. *smiles*)
      return <ActionTag>*{children}*</ActionTag>;
    },
  };

  return (
    <motion.div
      initial={isUser ? { opacity: 0, y: 10 } : { opacity: 0, x: -10 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: isUser ? 0.1 : 0.15 }}
      className={cn(
        "flex flex-col max-w-[85%]",
        isUser ? "ml-auto items-end mb-6" : "mr-auto items-start mb-4"
      )}
    >
      <div
        className={cn(
          "relative px-4 py-3 backdrop-blur-md shadow-sm",
          isUser 
            ? "bg-white/30 dark:bg-white/10 text-foreground rounded-2xl rounded-br-md border border-white/20 dark:border-white/10" 
            : "bg-white/10 dark:bg-black/40 text-foreground rounded-2xl rounded-bl-md border border-white/10 dark:border-white/5 shadow-inner"
        )}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none">
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

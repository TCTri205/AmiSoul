'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TypingState } from '@/store/useChatStore';

interface TypingIndicatorProps {
  state: TypingState;
  onRetry?: () => void;
}

const TypingIndicator = ({ state, onRetry }: TypingIndicatorProps) => {
  if (state === 'none') return null;

  if (state === 'initial') {
    return (
      <div className="flex space-x-1 items-center px-4 py-3 bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-2xl rounded-bl-md w-fit">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 bg-foreground/40 rounded-full"
            animate={{
              y: [0, -4, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    );
  }

  if (state === 'thinking') {
    return (
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-xs text-foreground/50 italic px-4 py-2"
      >
        Ami đang suy nghĩ...
      </motion.div>
    );
  }

  if (state === 'error') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col gap-2 p-4 bg-red-500/10 border border-red-500/20 backdrop-blur-md rounded-2xl rounded-bl-md max-w-[80%]"
      >
        <p className="text-sm text-red-600 dark:text-red-400">
          Ami hơi bận, thử lại sau chút nha 💤
        </p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="text-xs font-semibold text-red-700 dark:text-red-300 hover:underline w-fit"
          >
            Gửi lại
          </button>
        )}
      </motion.div>
    );
  }

  return null;
};

export default TypingIndicator;

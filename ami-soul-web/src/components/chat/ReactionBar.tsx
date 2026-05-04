'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ReactionBarProps {
  onSelect: (emoji: string) => void;
  className?: string;
}

const EMOJIS = ['❤️', '😢', '😡', '😂', '👍'];

const ReactionBar = ({ onSelect, className }: ReactionBarProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className={cn(
        "flex items-center gap-1 p-1 bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-white/20 rounded-full shadow-xl z-30",
        className
      )}
    >
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(emoji);
          }}
          className="p-1.5 text-lg hover:scale-125 transition-transform active:scale-95"
        >
          {emoji}
        </button>
      ))}
    </motion.div>
  );
};

export default ReactionBar;

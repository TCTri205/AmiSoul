'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Message } from '@/types/message';
import { cn } from '@/lib/utils';

interface ReplyPreviewProps {
  message: Message;
  onCancel: () => void;
}

const ReplyPreview = ({ message, onCancel }: ReplyPreviewProps) => {
  const isAi = message.role === 'assistant';

  return (
    <div className="flex items-center gap-3 p-2 bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-t-xl border-t border-x border-white/10 mx-2 animate-in slide-in-from-bottom-2">
      <div 
        className={cn(
          "w-1 self-stretch rounded-full",
          isAi ? "bg-purple-400" : "bg-blue-400"
        )} 
      />
      
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-tight">
          {isAi ? 'Ami' : 'Bạn'}
        </p>
        <p className="text-xs text-foreground/70 truncate">
          {message.content}
        </p>
      </div>

      <button 
        onClick={onCancel}
        className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
        aria-label="Hủy phản hồi"
      >
        <X className="w-4 h-4 text-foreground/50" />
      </button>
    </div>
  );
};

export default ReplyPreview;

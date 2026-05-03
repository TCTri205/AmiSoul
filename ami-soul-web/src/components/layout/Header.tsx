'use client';

import React from 'react';
import { Settings } from 'lucide-react';
import { useVibeStore } from '@/store/useVibeStore';
import { useUIStore } from '@/store/useUIStore';
import { cn } from '@/lib/utils';

const Header = () => {
  const { connectionStatus } = useVibeStore();
  const { toggleSettings } = useUIStore();
  
  const statusColor = {
    connected: 'bg-green-500',
    disconnected: 'bg-gray-500',
    reconnecting: 'bg-yellow-500',
  }[connectionStatus] || 'bg-gray-500';

  const statusText = {
    connected: 'Đang lắng nghe',
    disconnected: 'Đang đợi tín hiệu từ Ami...',
    reconnecting: 'Đang đợi tín hiệu từ Ami...',
  }[connectionStatus] || 'Đang kết nối...';

  return (
    <header className="min-h-12 flex items-center justify-between px-4 pt-[env(safe-area-inset-top)] bg-white/10 dark:bg-black/10 backdrop-blur-md border-b border-white/10 z-20">
      <div className="flex items-center gap-2 py-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xs shadow-inner">
          A
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight">Ami</h1>
          <div className="flex items-center gap-1.5">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full", 
              statusColor,
              connectionStatus === 'connected' && "animate-pulse"
            )} />
            <span className="text-[10px] text-foreground/50 font-medium">
              {statusText}
            </span>
          </div>
        </div>
      </div>

      <button 
        onClick={() => toggleSettings()}
        className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/10 dark:hover:bg-white/5 rounded-full transition-colors group"
        aria-label="Cài đặt"
      >
        <Settings className="w-5 h-5 text-foreground/60 group-hover:text-foreground/90" />
      </button>
    </header>
  );
};

export default Header;

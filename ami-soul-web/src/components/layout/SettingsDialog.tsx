'use client';

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { useUIStore } from '@/store/useUIStore';
import { Button } from '@/components/ui/button';
import { Volume2, Smartphone } from 'lucide-react';

const SettingsDialog = () => {
  const { 
    isSettingsOpen, 
    toggleSettings, 
    isHapticsEnabled, 
    setHaptics,
    isSoundEnabled,
    setSound 
  } = useUIStore();

  return (
    <Dialog open={isSettingsOpen} onOpenChange={toggleSettings}>
      <DialogContent className="sm:max-w-[425px] bg-white/80 dark:bg-zinc-900/90 backdrop-blur-xl border-white/20 dark:border-white/10">
        <DialogHeader>
          <DialogTitle>Cài đặt</DialogTitle>
          <DialogDescription>
            Tùy chỉnh trải nghiệm của bạn với Ami.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Phản hồi xúc giác</p>
                <p className="text-xs text-muted-foreground">Rung nhẹ khi có tin nhắn mới</p>
              </div>
            </div>
            <Button 
              variant={isHapticsEnabled ? "default" : "outline"}
              size="lg"
              onClick={() => setHaptics(!isHapticsEnabled)}
              className="min-w-[80px]"
            >
              {isHapticsEnabled ? "Bật" : "Tắt"}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Volume2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Âm thanh thông báo</p>
                <p className="text-xs text-muted-foreground">Tiếng báo nhẹ nhàng khi Ami phản hồi</p>
              </div>
            </div>
            <Button 
              variant={isSoundEnabled ? "default" : "outline"}
              size="lg"
              onClick={() => setSound(!isSoundEnabled)}
              className="min-w-[80px]"
            >
              {isSoundEnabled ? "Bật" : "Tắt"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;

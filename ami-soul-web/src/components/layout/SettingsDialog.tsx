'use client';

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useVibeStore } from '@/store/useVibeStore';
import { Button } from '@/components/ui/button';
import { 
  Volume2, 
  Smartphone, 
  Trash2, 
  Download, 
  Shield, 
  ShieldOff, 
  User as UserIcon,
  Award,
  Loader2
} from 'lucide-react';
import { privacyApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const SettingsDialog = () => {
  const { 
    isSettingsOpen, 
    toggleSettings, 
    isHapticsEnabled, 
    setHaptics,
    isSoundEnabled,
    setSound 
  } = useUIStore();

  const { user, isIncognito, setIncognito } = useAuthStore();
  const { bondingScore } = useVibeStore();
  const { toast } = useToast();
  
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await privacyApi.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `amisoul-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Thành công",
        description: "Dữ liệu của bạn đã được chuẩn bị để tải xuống.",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xuất dữ liệu.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteMemories = async (hard: boolean = false) => {
    setIsDeleting(true);
    try {
      if (hard) {
        await privacyApi.hardDelete();
      } else {
        await privacyApi.softDelete();
      }
      
      toast({
        title: "Đã thực hiện",
        description: hard ? "Toàn bộ ký ức đã bị xóa vĩnh viễn." : "Ký ức của bạn đã được ẩn đi.",
      });
      setShowConfirmDelete(false);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa ký ức.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getBondingLevel = (score: number) => {
    if (score >= 80) return "Tri kỷ (L5)";
    if (score >= 60) return "Thân thiết (L4)";
    if (score >= 40) return "Bạn bè (L3)";
    if (score >= 20) return "Quen biết (L2)";
    return "Người lạ (L1)";
  };

  return (
    <Dialog open={isSettingsOpen} onOpenChange={toggleSettings}>
      <DialogContent className="sm:max-w-[450px] max-h-[85vh] overflow-y-auto bg-white/90 dark:bg-zinc-900/95 backdrop-blur-2xl border-white/20 dark:border-white/10 p-0 gap-0">
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Cài đặt & Riêng tư</DialogTitle>
            <DialogDescription>
              Quản lý trải nghiệm và dữ liệu cá nhân của bạn.
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="px-6 py-4 space-y-6">
          {/* Profile Section */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Cá nhân</h3>
            <div className="bg-foreground/[0.03] dark:bg-white/[0.03] rounded-2xl p-4 border border-foreground/5 dark:border-white/5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.email || (user?.isGuest ? "Chế độ Khách" : "Người dùng AmiSoul")}</p>
                  <p className="text-[10px] text-muted-foreground truncate font-mono opacity-60">ID: {user?.id || '...'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Mức độ thân thiết</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">{getBondingLevel(bondingScore)} ({bondingScore} pts)</p>
                </div>
              </div>
            </div>
          </section>

          {/* Experience Section */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Trải nghiệm</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Xúc giác</p>
                    <p className="text-[11px] text-muted-foreground">Rung nhẹ khi Ami trả lời</p>
                  </div>
                </div>
                <Switch 
                  checked={isHapticsEnabled} 
                  onCheckedChange={setHaptics} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Volume2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Âm thanh</p>
                    <p className="text-[11px] text-muted-foreground">Tiếng báo khi có tin nhắn</p>
                  </div>
                </div>
                <Switch 
                  checked={isSoundEnabled} 
                  onCheckedChange={setSound} 
                />
              </div>
            </div>
          </section>

          <Separator className="opacity-50" />

          {/* Privacy Section */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Quyền riêng tư</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    isIncognito ? "bg-zinc-200 dark:bg-zinc-800" : "bg-green-100 dark:bg-green-900/30"
                  )}>
                    {isIncognito ? <ShieldOff className="w-4 h-4 text-zinc-600 dark:text-zinc-400" /> : <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Chế độ ẩn danh</p>
                    <p className="text-[11px] text-muted-foreground">Không lưu lại ký ức mới</p>
                  </div>
                </div>
                <Switch 
                  checked={isIncognito} 
                  onCheckedChange={setIncognito} 
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl h-10 border-foreground/10"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                  Xuất dữ liệu
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl h-10 border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/5"
                  onClick={() => setShowConfirmDelete(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa ký ức
                </Button>
              </div>
            </div>
          </section>
        </div>

        <div className="p-6 pt-2 pb-8 text-center">
          <p className="text-[10px] text-muted-foreground opacity-50">
            AmiSoul v0.1.0 • Được thiết kế để thấu hiểu.
          </p>
        </div>
      </DialogContent>

      {/* Confirmation Dialog for Delete */}
      <Dialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <DialogContent className="sm:max-w-[400px] bg-white dark:bg-zinc-950 border-white/20">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa ký ức?</DialogTitle>
            <DialogDescription>
              Bạn muốn xóa vĩnh viễn hay chỉ ẩn chúng đi? Dữ liệu bị xóa vĩnh viễn sẽ không thể khôi phục.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
             <Button 
               variant="outline" 
               className="justify-start h-14 px-4 rounded-xl"
               onClick={() => handleDeleteMemories(false)}
               disabled={isDeleting}
             >
               <div className="text-left">
                 <p className="text-sm font-semibold">Ẩn ký ức (Soft Delete)</p>
                 <p className="text-[10px] text-muted-foreground font-normal">Giữ lại trong hệ thống nhưng Ami sẽ lãng quên.</p>
               </div>
             </Button>

             <Button 
               variant="destructive" 
               className="justify-start h-14 px-4 rounded-xl"
               onClick={() => handleDeleteMemories(true)}
               disabled={isDeleting}
             >
               <div className="text-left">
                 <p className="text-sm font-semibold text-white">Xóa vĩnh viễn (Hard Delete)</p>
                 <p className="text-[10px] text-white/70 font-normal">Xóa sạch khỏi máy chủ, không thể khôi phục.</p>
               </div>
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default SettingsDialog;

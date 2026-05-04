'use client';

import React, { useState, useEffect } from 'react';
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
  Loader2,
  ChevronRight,
  History,
  X
} from 'lucide-react';
import { privacyApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const SettingsDialog = () => {
  const { 
    isSettingsOpen, 
    toggleSettings, 
    isHapticsEnabled, 
    setHaptics,
    isSoundEnabled,
    setSound,
    setAccountLink
  } = useUIStore();

  const { user, isIncognito, setIncognito } = useAuthStore();
  const { bondingScore } = useVibeStore();
  const { toast } = useToast();
  
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showMemoryList, setShowMemoryList] = useState(false);
  const [memories, setMemories] = useState<any[]>([]);
  const [isLoadingMemories, setIsLoadingMemories] = useState(false);

  useEffect(() => {
    if (isSettingsOpen && showMemoryList) {
      fetchMemories();
    }
  }, [isSettingsOpen, showMemoryList]);

  const fetchMemories = async () => {
    setIsLoadingMemories(true);
    try {
      const data = await privacyApi.exportData();
      setMemories(data.memories || []);
    } catch (error) {
      console.error('Failed to fetch memories', error);
    } finally {
      setIsLoadingMemories(false);
    }
  };

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
      if (showMemoryList) fetchMemories();
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

  const handleDeleteSingleMemory = async (id: string) => {
    try {
      await privacyApi.deleteMemory(id);
      setMemories(prev => prev.filter(m => m.id !== id));
      toast({
        description: "Đã xóa ký ức chọn lọc.",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa ký ức này.",
        variant: "destructive"
      });
    }
  };

  const handleLinkAccount = () => {
    toggleSettings(false); // Close settings first
    setTimeout(() => {
      setAccountLink(true, { 
        bonding_score: bondingScore,
        message: "Hãy liên kết tài khoản để lưu giữ những kỷ niệm quý giá cùng Ami nhé!" 
      });
    }, 300);
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
      <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-zinc-900/98 backdrop-blur-3xl border-white/20 dark:border-white/10 p-0 gap-0 shadow-2xl rounded-3xl scrollbar-none">
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Cài đặt & Riêng tư</DialogTitle>
            <DialogDescription className="text-muted-foreground/70">
              Quản lý trải nghiệm và bảo mật dữ liệu của bạn.
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="px-6 py-4 space-y-7">
          {/* Profile Section */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Tài khoản</h3>
            <div className="bg-foreground/[0.02] dark:bg-white/[0.02] rounded-[24px] p-4 border border-foreground/[0.05] dark:border-white/[0.05] space-y-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-500/10">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate leading-none mb-1.5">{user?.email || (user?.isGuest ? "Người dùng Khách" : "Người dùng AmiSoul")}</p>
                  <p className="text-[10px] text-muted-foreground/60 truncate font-mono tracking-tighter">ID: {user?.id || '...'}</p>
                </div>
                {user?.isGuest && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-3 text-[11px] font-bold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20"
                    onClick={handleLinkAccount}
                  >
                    Liên kết
                  </Button>
                )}
              </div>
              
              <div className="h-[1px] bg-foreground/[0.05] dark:bg-white/[0.05] mx-2" />

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-500/10">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider leading-none mb-1.5">Mức độ gắn kết</p>
                  <p className="text-sm font-bold bg-gradient-to-r from-amber-600 to-orange-500 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">{getBondingLevel(bondingScore)}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Experience Section */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Cấu hình trải nghiệm</h3>
            <div className="space-y-5 px-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100/50 dark:border-blue-900/30">
                    <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Phản hồi xúc giác</p>
                    <p className="text-[11px] text-muted-foreground/70">Rung nhẹ khi Ami phản hồi</p>
                  </div>
                </div>
                <Switch 
                  checked={isHapticsEnabled} 
                  onCheckedChange={setHaptics} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100/50 dark:border-purple-900/30">
                    <Volume2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Âm thanh hệ thống</p>
                    <p className="text-[11px] text-muted-foreground/70">Hiệu ứng âm thanh khi nhắn tin</p>
                  </div>
                </div>
                <Switch 
                  checked={isSoundEnabled} 
                  onCheckedChange={setSound} 
                />
              </div>
            </div>
          </section>

          {/* Privacy Section */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Quyền riêng tư</h3>
            <div className="space-y-5 px-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-2.5 rounded-xl border transition-all duration-300",
                    isIncognito 
                      ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700" 
                      : "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30"
                  )}>
                    {isIncognito ? <ShieldOff className="w-4 h-4 text-zinc-600 dark:text-zinc-400" /> : <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Chế độ ẩn danh</p>
                    <p className="text-[11px] text-muted-foreground/70">Ami sẽ không ghi nhớ các cuộc trò chuyện mới</p>
                  </div>
                </div>
                <Switch 
                  checked={isIncognito} 
                  onCheckedChange={setIncognito} 
                />
              </div>
            </div>
          </section>

          {/* Data Management Section */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Quản lý dữ liệu</h3>
            <div className="space-y-3 px-1">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-2xl h-11 border-foreground/5 bg-foreground/[0.02] dark:bg-white/[0.02] hover:bg-foreground/[0.05] dark:hover:bg-white/[0.05] transition-all font-medium"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2 text-muted-foreground" />}
                  Xuất dữ liệu
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-2xl h-11 border-red-500/10 bg-red-500/[0.02] text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all font-medium"
                  onClick={() => setShowConfirmDelete(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa ký ức
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between h-10 px-4 rounded-xl hover:bg-foreground/[0.03] text-muted-foreground/80 font-medium"
                onClick={() => setShowMemoryList(!showMemoryList)}
              >
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  <span className="text-xs">Quản lý ký ức chọn lọc</span>
                </div>
                <ChevronRight className={cn("w-4 h-4 transition-transform", showMemoryList && "rotate-90")} />
              </Button>

              {showMemoryList && (
                <div className="space-y-3 mt-2 animate-in slide-in-from-top-2 duration-300">
                  {isLoadingMemories ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/30" />
                    </div>
                  ) : memories.length > 0 ? (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-foreground/5">
                      {memories.map((m) => (
                        <div key={m.id} className="flex items-start justify-between gap-3 p-3 bg-foreground/[0.02] dark:bg-white/[0.02] rounded-xl border border-foreground/[0.05] dark:border-white/[0.05] group">
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] line-clamp-2 leading-relaxed text-foreground/80">{m.content}</p>
                            <p className="text-[9px] text-muted-foreground/50 mt-1 font-mono">
                              {new Date(m.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button 
                            onClick={() => handleDeleteSingleMemory(m.id)}
                            className="p-1.5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-center text-muted-foreground/40 py-4 italic">
                      Chưa có ký ức nào được lưu lại.
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <p className="text-[10px] text-center text-muted-foreground/50 italic pt-2">
              Tuân thủ tiêu chuẩn bảo mật dữ liệu AmiSoul.
            </p>
          </section>
        </div>

        <div className="p-8 text-center bg-foreground/[0.02] dark:bg-white/[0.01] mt-4">
          <p className="text-[10px] text-muted-foreground/40 font-medium tracking-widest uppercase">
            AmiSoul Engine v0.1.0 • Safe Harbor Protocol
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
               className="justify-start h-14 px-4 rounded-xl border-foreground/5 bg-foreground/[0.01] hover:bg-foreground/[0.03]"
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
               className="justify-start h-14 px-4 rounded-xl shadow-lg shadow-red-500/10"
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

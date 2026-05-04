'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Plus, X, Square } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { useSocket } from '@/providers/SocketProvider';
import { useVibeStore } from '@/store/useVibeStore';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/hooks/use-toast';
import ReplyPreview from './ReplyPreview';
import AudioWaveform from './AudioWaveform';
import ImagePreview from './ImagePreview';
import { cn } from '@/lib/utils';

const InputArea = () => {
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const { sendMessage, sendInterrupt, sendAudio, sendImage } = useSocket();
  const { isIncognito } = useAuthStore();
  const { connectionStatus } = useVibeStore();
  const { isRecordingVoice, setRecording } = useUIStore();
  const { toast } = useToast();

  const { 
    replyToMessage, 
    setReplyToMessage, 
    addMessage,
    isStreaming,
    typingState,
    streamingChunks,
    finalizeStream
  } = useChatStore();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        if (audioBlob.size < 1000) {
           toast({
             description: "Quá ngắn, hãy nói lâu hơn chút nhé",
             variant: "destructive"
           });
           return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          const session_type = isIncognito ? 'incognito' : 'persistent';
          const audioMsgId = `voice_${Date.now()}`;

          sendAudio({
            audioBase64: base64Audio,
            mimeType: 'audio/webm',
            messageId: audioMsgId,
            session_type
          } as any);
          
          addMessage({
            id: audioMsgId,
            content: "🎤 [Tin nhắn thoại]",
            role: 'user',
            timestamp: new Date(),
            status: 'sending',
            isIncognito
          });
        };

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      toast({
        title: "Lỗi ghi âm",
        description: "Không thể truy cập micro của bạn.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecordingVoice) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecordingVoice) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setRecording(false);
      toast({
        description: "Đã hủy ghi âm",
      });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (images.length + files.length > 4) {
      toast({
        description: "Tối đa 4 ảnh cho mỗi tin nhắn thôi nha",
        variant: "destructive"
      });
      return;
    }

    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          description: "Ảnh to quá (>10MB), hãy chọn ảnh khác nhé",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
    });
    
    // Reset input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (!text.trim() && images.length === 0) return;

    if (isStreaming) {
      sendInterrupt();
      useChatStore.getState().incrementInterrupts();
      Object.keys(streamingChunks).forEach(id => {
        finalizeStream(id, true);
      });
    }

    const messageContent = text.trim();
    const tempId = `msg_${Date.now()}`;
    const session_type = isIncognito ? 'incognito' : 'persistent';

    // 1. Send text message if exists
    if (messageContent) {
      addMessage({
        id: tempId,
        content: messageContent,
        role: 'user',
        timestamp: new Date(),
        status: 'sending',
        replyToId: replyToMessage?.id,
        isIncognito
      });
      sendMessage(messageContent, { 
        replyToId: replyToMessage?.id,
        messageId: tempId,
        session_type
      });
    }

    // 2. Send images if exists
    if (images.length > 0) {
      const imageMsgId = `img_${Date.now()}`;
      
      // Optimistic UI for images
      addMessage({
        id: imageMsgId,
        content: "🖼️ [Hình ảnh]",
        role: 'user',
        timestamp: new Date(),
        status: 'sending',
        isIncognito
      });

      sendImage({
        images: images,
        mimeTypes: images.map(img => img.split(';')[0].split(':')[1] || 'image/jpeg'),
        messageId: imageMsgId,
        session_type
      } as any);
    }

    setText('');
    setImages([]);
    setReplyToMessage(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const isOffline = connectionStatus !== 'connected';
  const isDisabled = (!text.trim() && images.length === 0 && !isRecordingVoice) || typingState === 'thinking' || isOffline;

  return (
    <div className="sticky bottom-0 w-full p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-transparent z-20">
      {replyToMessage && (
        <ReplyPreview 
          message={replyToMessage} 
          onCancel={() => setReplyToMessage(null)} 
        />
      )}
      
      <ImagePreview images={images} onRemove={removeImage} />
      
      <div className={cn(
        "flex items-end gap-2 bg-white/20 dark:bg-black/30 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-2 shadow-lg transition-all",
        isRecordingVoice && "border-primary/50 ring-1 ring-primary/20"
      )}>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          multiple 
          onChange={handleImageSelect}
        />

        {!isRecordingVoice ? (
          <button 
            disabled={isOffline || isRecordingVoice}
            onClick={() => fileInputRef.current?.click()}
            className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/10 dark:hover:bg-white/5 rounded-full transition-colors group disabled:opacity-30 disabled:cursor-not-allowed" 
            aria-label="Thêm hình ảnh"
          >
            <Plus className="w-5 h-5 text-foreground/60 group-hover:text-foreground/90" />
          </button>
        ) : (
          <button 
            onClick={cancelRecording}
            className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-red-500/10 rounded-full transition-colors group" 
            aria-label="Hủy ghi âm"
          >
            <X className="w-5 h-5 text-red-500/60 group-hover:text-red-500" />
          </button>
        )}

        <div className="flex-1 flex items-center min-h-[44px]">
          {!isRecordingVoice ? (
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isOffline ? "Đang đợi kết nối..." : "Trò chuyện với Ami..."}
              aria-label="Nội dung tin nhắn"
              disabled={isOffline}
              className="w-full bg-transparent border-none focus:ring-0 resize-none py-2 text-sm max-h-[120px] placeholder:text-foreground/40 scrollbar-none disabled:cursor-not-allowed"
            />
          ) : (
            <div className="flex-1 flex items-center justify-between px-2">
              <span className="text-xs font-medium text-primary animate-pulse">Đang ghi âm...</span>
              <AudioWaveform isRecording={isRecordingVoice} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {text.trim() || images.length > 0 || isRecordingVoice ? (
            <button
              onClick={isRecordingVoice ? stopRecording : handleSend}
              disabled={isDisabled}
              aria-label={isRecordingVoice ? "Dừng ghi âm" : "Gửi tin nhắn"}
              className={cn(
                "p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all",
                isDisabled 
                  ? "bg-foreground/10 text-foreground/30 cursor-not-allowed" 
                  : isRecordingVoice
                    ? "bg-primary text-primary-foreground hover:scale-105"
                    : "bg-foreground text-background hover:scale-105 active:scale-95"
              )}
            >
              {isRecordingVoice ? <Square className="w-4 h-4 fill-current" /> : <Send className="w-4 h-4" />}
            </button>
          ) : (
            <button 
              onClick={startRecording}
              disabled={isOffline || isStreaming}
              className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/10 dark:hover:bg-white/5 rounded-full transition-colors group disabled:opacity-30 disabled:cursor-not-allowed" 
              aria-label="Ghi âm tin nhắn"
            >
              <Mic className="w-5 h-5 text-foreground/60 group-hover:text-foreground/90" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InputArea;

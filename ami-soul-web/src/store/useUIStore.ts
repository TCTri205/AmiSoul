import { create } from 'zustand';
import { Message } from '@/types/message';

interface UIStore {
  isModalOpen: boolean;
  isRecordingVoice: boolean;
  isSettingsOpen: boolean;
  replyingToMessage: Message | null;

  // Actions
  toggleModal: (isOpen?: boolean) => void;
  setRecording: (isRecording: boolean) => void;
  toggleSettings: (isOpen?: boolean) => void;
  setReply: (message: Message | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isModalOpen: false,
  isRecordingVoice: false,
  isSettingsOpen: false,
  replyingToMessage: null,

  toggleModal: (isOpen) => 
    set((state) => ({ isModalOpen: isOpen ?? !state.isModalOpen })),
  
  setRecording: (isRecordingVoice) => set({ isRecordingVoice }),
  
  toggleSettings: (isOpen) =>
    set((state) => ({ isSettingsOpen: isOpen ?? !state.isSettingsOpen })),
  
  setReply: (replyingToMessage) => set({ replyingToMessage }),
}));

import { create } from 'zustand';
import { Message } from '@/types/message';

interface UIStore {
  isModalOpen: boolean;
  isRecordingVoice: boolean;
  isSettingsOpen: boolean;
  isHapticsEnabled: boolean;
  isSoundEnabled: boolean;
  replyingToMessage: Message | null;

  // Actions
  toggleModal: (isOpen?: boolean) => void;
  setRecording: (isRecording: boolean) => void;
  toggleSettings: (isOpen?: boolean) => void;
  setHaptics: (enabled: boolean) => void;
  setSound: (enabled: boolean) => void;
  setReply: (message: Message | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isModalOpen: false,
  isRecordingVoice: false,
  isSettingsOpen: false,
  isHapticsEnabled: true,
  isSoundEnabled: true,
  replyingToMessage: null,

  toggleModal: (isOpen) => 
    set((state) => ({ isModalOpen: isOpen ?? !state.isModalOpen })),
  
  setRecording: (isRecordingVoice) => set({ isRecordingVoice }),
  
  toggleSettings: (isOpen) =>
    set((state) => ({ isSettingsOpen: isOpen ?? !state.isSettingsOpen })),

  setHaptics: (isHapticsEnabled) => set({ isHapticsEnabled }),
  setSound: (isSoundEnabled) => set({ isSoundEnabled }),
  
  setReply: (replyingToMessage) => set({ replyingToMessage }),
}));

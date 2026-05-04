import { create } from 'zustand';
import { Message } from '@/types/message';

interface UIStore {
  isModalOpen: boolean;
  isRecordingVoice: boolean;
  isSettingsOpen: boolean;
  isHapticsEnabled: boolean;
  isSoundEnabled: boolean;
  isAccountLinkOpen: boolean;
  accountLinkData: { bonding_score?: number; message?: string } | null;
  replyingToMessage: Message | null;

  // Actions
  toggleModal: (isOpen?: boolean) => void;
  setRecording: (isRecording: boolean) => void;
  toggleSettings: (isOpen?: boolean) => void;
  setHaptics: (enabled: boolean) => void;
  setSound: (enabled: boolean) => void;
  setAccountLink: (isOpen: boolean, data?: { bonding_score?: number; message?: string } | null) => void;
  setReply: (message: Message | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isModalOpen: false,
  isRecordingVoice: false,
  isSettingsOpen: false,
  isHapticsEnabled: true,
  isSoundEnabled: true,
  isAccountLinkOpen: false,
  accountLinkData: null,
  replyingToMessage: null,

  toggleModal: (isOpen) => 
    set((state) => ({ isModalOpen: isOpen ?? !state.isModalOpen })),
  
  setRecording: (isRecordingVoice) => set({ isRecordingVoice }),
  
  toggleSettings: (isOpen) =>
    set((state) => ({ isSettingsOpen: isOpen ?? !state.isSettingsOpen })),

  setHaptics: (isHapticsEnabled) => set({ isHapticsEnabled }),
  setSound: (isSoundEnabled) => set({ isSoundEnabled }),
  
  setAccountLink: (isAccountLinkOpen, accountLinkData = null) => 
    set({ isAccountLinkOpen, accountLinkData: accountLinkData ?? null }),
  
  setReply: (replyingToMessage) => set({ replyingToMessage }),
}));

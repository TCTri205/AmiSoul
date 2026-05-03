import { create } from 'zustand';
import { SessionVibe, ConnectionStatus } from '@/types/vibe';

interface VibeStore {
  sessionVibe: SessionVibe;
  bondingScore: number;
  connectionStatus: ConnectionStatus;

  // Actions
  setVibe: (vibe: SessionVibe) => void;
  setBondingScore: (score: number) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
}

export const useVibeStore = create<VibeStore>((set) => ({
  sessionVibe: 'neutral',
  bondingScore: 0,
  connectionStatus: 'disconnected',

  setVibe: (sessionVibe) => set({ sessionVibe }),
  setBondingScore: (bondingScore) => set({ bondingScore }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
}));

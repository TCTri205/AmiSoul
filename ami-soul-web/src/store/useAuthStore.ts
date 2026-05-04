import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email?: string;
  username?: string;
  isGuest: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isIncognito: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setIncognito: (isIncognito: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isIncognito: false,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setIncognito: (isIncognito) => set({ isIncognito }),
      logout: () => set({ user: null, token: null, isIncognito: false }),
    }),
    {
      name: 'ami-soul-auth',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isIncognito: state.isIncognito 
      }),
    }
  )
);

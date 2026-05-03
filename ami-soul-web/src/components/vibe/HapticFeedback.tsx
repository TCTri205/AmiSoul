'use client';

import { useEffect, useCallback } from 'react';
import { useUIStore } from '@/store/useUIStore';

export const useHapticFeedback = () => {
  const { isHapticsEnabled, isSoundEnabled } = useUIStore();

  const triggerVibration = useCallback((pattern: number | number[] = 50) => {
    if (typeof window !== 'undefined' && navigator.vibrate && isHapticsEnabled) {
      navigator.vibrate(pattern);
    }
  }, [isHapticsEnabled]);

  const triggerSound = useCallback(() => {
    if (typeof window !== 'undefined' && isSoundEnabled) {
      const audio = new Audio('/sounds/soft-notification.mp3');
      audio.volume = 0.4;
      audio.play().catch(err => console.warn('[HapticFeedback] Audio playback blocked:', err));
    }
  }, [isSoundEnabled]);

  const triggerStrong = useCallback(() => {
    triggerVibration([100, 50, 100]);
    triggerSound();
  }, [triggerVibration, triggerSound]);

  const triggerSoft = useCallback(() => {
    triggerVibration(50);
  }, [triggerVibration]);

  return { triggerStrong, triggerSoft };
};

// This is a provider-like component if we need to wrap something, 
// but for now, we just export the hook.
export const HapticFeedback = () => {
  return null;
};

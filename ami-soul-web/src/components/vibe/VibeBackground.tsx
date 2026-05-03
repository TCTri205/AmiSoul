'use client';

import React, { useMemo } from 'react';
import { useVibeStore } from '@/store/useVibeStore';
import { cn } from '@/lib/utils';
import { SessionVibe } from '@/types/vibe';

export const VibeBackground = () => {
  const sessionVibe = useVibeStore((state) => state.sessionVibe);

  // Mapping vibes to their constituent colors for Mesh Gradient effect
  const vibeColors: Record<SessionVibe, [string, string, string]> = useMemo(() => ({
    positive: ['var(--pastel-pink)', 'var(--pastel-lavender)', 'var(--pastel-peach)'],
    neutral: ['var(--pastel-blue)', 'var(--pastel-cream)', 'var(--pastel-lavender)'],
    stressed: ['var(--pastel-violet)', 'var(--pastel-slate)', 'var(--dusty-blue)'],
    crisis: ['var(--pastel-blue)', 'var(--pastel-slate)', 'var(--background)'],
    offline: ['var(--pastel-slate)', 'var(--pastel-lavender)', 'var(--background)'],
  }), []);

  const currentColors = vibeColors[sessionVibe] || vibeColors.neutral;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-0 animate-drift transition-all duration-[3000ms] ease-in-out",
      )}
      style={{
        background: `linear-gradient(135deg, hsl(${currentColors[0]}), hsl(${currentColors[1]}), hsl(${currentColors[2]}))`,
        backgroundSize: '200% 200%',
      }}
    />
  );
};

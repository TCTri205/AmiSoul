'use client';

import React, { useMemo } from 'react';
import { useVibeStore } from '@/store/useVibeStore';
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
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Blob 1 - Primary color */}
      <div 
        className="vibe-blob w-[150%] h-[150%] -top-[25%] -left-[25%] animate-drift-1"
        style={{ backgroundColor: `hsl(${currentColors[0]})` }}
      />
      {/* Blob 2 - Secondary color */}
      <div 
        className="vibe-blob w-[150%] h-[150%] -top-[25%] -left-[25%] animate-drift-2"
        style={{ backgroundColor: `hsl(${currentColors[1]})` }}
      />
      {/* Blob 3 - Accent/Background blend */}
      <div 
        className="vibe-blob w-[150%] h-[150%] -top-[25%] -left-[25%] animate-drift-3"
        style={{ backgroundColor: `hsl(${currentColors[2]})` }}
      />
    </div>
  );
};

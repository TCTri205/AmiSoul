'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AudioWaveformProps {
  isRecording: boolean;
}

const AudioWaveform = ({ isRecording }: AudioWaveformProps) => {
  if (!isRecording) return null;

  return (
    <div className="flex items-center justify-center gap-1 h-8 px-2">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-primary/60 rounded-full"
          animate={{
            height: [8, 24, 12, 28, 8],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export default AudioWaveform;

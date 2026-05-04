'use client';

import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface ImagePreviewProps {
  images: string[]; // Base64 strings
  onRemove: (index: number) => void;
}

const ImagePreview = ({ images, onRemove }: ImagePreviewProps) => {
  if (images.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-2 p-2 bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-xl border border-white/10 mx-2">
      <AnimatePresence>
        {images.map((img, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/20 group"
          >
            <Image 
              src={img} 
              alt={`Preview ${index}`} 
              fill 
              className="object-cover"
            />
            <button
              onClick={() => onRemove(index)}
              className="absolute top-0.5 right-0.5 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ImagePreview;

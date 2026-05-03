'use client';

import React, { useState, useEffect } from 'react';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
}

/**
 * Handles virtual keyboard resizing on mobile devices by adjusting padding.
 * Uses the visualViewport API to detect keyboard presence and height.
 */
export const SafeAreaWrapper = ({ children }: SafeAreaWrapperProps) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!window.visualViewport) return;

    const handleResize = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;

      // Calculate how much the viewport has shrunk from the window height
      // This is typically the keyboard height
      const height = window.innerHeight - viewport.height;
      
      // Only apply if the height is positive and significant (to avoid small changes)
      setKeyboardHeight(height > 20 ? height : 0);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    
    // Initial check
    handleResize();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  return (
    <div 
      className="flex flex-col h-[100dvh] w-full transition-[padding-bottom] duration-300 ease-out overflow-hidden"
      style={{ paddingBottom: `${keyboardHeight}px` }}
    >
      {children}
    </div>
  );
};

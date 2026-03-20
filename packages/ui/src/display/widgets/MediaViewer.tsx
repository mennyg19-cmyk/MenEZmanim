'use client';

import React, { useState, useEffect, useCallback } from 'react';

export interface MediaViewerProps {
  sources: string[];
  rotationInterval: number;
  fit: 'cover' | 'contain' | 'fill';
  showTransition: boolean;
}

export function MediaViewer({
  sources,
  rotationInterval,
  fit,
  showTransition,
}: MediaViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);

  const transitionDuration = 800;

  const advance = useCallback(() => {
    if (sources.length <= 1) return;
    if (showTransition) {
      setFadingOut(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % sources.length);
        setFadingOut(false);
      }, transitionDuration);
    } else {
      setCurrentIndex((prev) => (prev + 1) % sources.length);
    }
  }, [sources.length, showTransition]);

  useEffect(() => {
    if (sources.length <= 1) return;
    const interval = setInterval(advance, rotationInterval * 1000);
    return () => clearInterval(interval);
  }, [sources.length, rotationInterval, advance]);

  useEffect(() => {
    setCurrentIndex(0);
    setFadingOut(false);
  }, [sources]);

  if (sources.length === 0) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a1a',
          color: '#666',
          fontSize: 18,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        No media
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#000',
      }}
    >
      <img
        key={currentIndex}
        src={sources[currentIndex]}
        alt=""
        style={{
          width: '100%',
          height: '100%',
          objectFit: fit,
          display: 'block',
          opacity: fadingOut ? 0 : 1,
          transition: showTransition
            ? `opacity ${transitionDuration}ms ease-in-out`
            : 'none',
        }}
      />
    </div>
  );
}

'use client';

import React, { useRef, useEffect, useState } from 'react';

export interface ScrollingTickerProps {
  items: string[];
  speed: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  direction: 'rtl' | 'ltr';
  separator: string;
}

export function ScrollingTicker({
  items,
  speed,
  fontSize,
  fontFamily,
  color,
  direction,
  separator,
}: ScrollingTickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [textWidth, setTextWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const fullText = items.join(` ${separator} `);

  useEffect(() => {
    const measure = () => {
      if (textRef.current) setTextWidth(textRef.current.offsetWidth);
      if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [fullText, fontSize, fontFamily]);

  const totalWidth = textWidth + 80;
  const duration = totalWidth / speed;

  const isRtl = direction === 'rtl';
  const animationName = isRtl ? 'ticker-scroll-rtl' : 'ticker-scroll-ltr';

  const keyframes = isRtl
    ? `@keyframes ${animationName} { 0% { transform: translateX(-${totalWidth}px); } 100% { transform: translateX(${containerWidth}px); } }`
    : `@keyframes ${animationName} { 0% { transform: translateX(${containerWidth}px); } 100% { transform: translateX(-${totalWidth}px); } }`;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        overflow: 'hidden',
        padding: '8px 0',
        position: 'relative',
      }}
    >
      <style>{keyframes}</style>

      {/* Hidden measurement element */}
      <span
        ref={textRef}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          whiteSpace: 'nowrap',
          fontSize,
          fontFamily,
        }}
      >
        {fullText}
      </span>

      {/* Scrolling text */}
      <div
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          fontSize,
          fontFamily,
          color,
          animation:
            textWidth > 0 && containerWidth > 0
              ? `${animationName} ${duration}s linear infinite`
              : 'none',
        }}
      >
        {fullText}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';


export interface YahrzeitEntry {
  name: string;
  hebrewName: string;
  relationship?: string;
  hebrewDate?: string;
}

export interface YahrzeitDisplayProps {
  entries: YahrzeitEntry[];
  title?: string;
  titleHebrew?: string;
  language?: 'hebrew' | 'english';
  fontSize?: number;
  textColor?: string;
  showBorder?: boolean;
  scrollSpeed?: number;
}

export function YahrzeitDisplay({
  entries,
  title,
  titleHebrew,
  language = 'hebrew',
  fontSize = 28,
  textColor = 'var(--wgt-text)',
  showBorder = true,
  scrollSpeed = 30,
}: YahrzeitDisplayProps) {
  const isRtl = language === 'hebrew';
  const fontFamily = 'system-ui, -apple-system, sans-serif';
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const displayTitle = isRtl
    ? titleHebrew ?? title ?? 'נשמות'
    : title ?? titleHebrew ?? 'Memorial';

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const needsScroll = content.scrollHeight > container.clientHeight;
    setShouldScroll(needsScroll);
  }, [entries, fontSize]);

  useEffect(() => {
    if (!shouldScroll || scrollSpeed <= 0) return;

    const content = contentRef.current;
    const container = containerRef.current;
    if (!content || !container) return;

    const totalHeight = content.scrollHeight;
    const visibleHeight = container.clientHeight;

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      setScrollOffset((prev) => {
        const next = prev + scrollSpeed * delta;
        return next >= totalHeight ? -visibleHeight : next;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [shouldScroll, scrollSpeed]);

  const getName = (entry: YahrzeitEntry) =>
    isRtl ? entry.hebrewName : entry.name;

  return (
    <div
      className="wgt-yzContainer"
      style={{
        width: '100%',
        height: '100%',
        fontFamily,
        direction: isRtl ? 'rtl' : 'ltr',
        border: showBorder ? `1px solid var(--wgt-border)` : 'none',
        borderRadius: 8,
      }}
    >
      {/* Title */}
      <div
        className="wgt-yzTitle"
        style={{
          padding: '16px 20px',
          fontSize: fontSize * 1.3,
          fontWeight: 700,
          color: textColor,
          borderBottom: `2px solid var(--wgt-border-light)`,
        }}
      >
        {displayTitle}
      </div>

      {/* Entries */}
      <div
        ref={containerRef}
        className="wgt-yzEntries"
        style={{
          position: 'relative',
        }}
      >
        <div
          ref={contentRef}
          style={{
            transform: shouldScroll ? `translateY(-${scrollOffset}px)` : undefined,
            padding: '12px 20px',
          }}
        >
          {entries.map((entry, index) => (
            <div
              key={`${entry.name}-${index}`}
              className="wgt-yzEntry"
              style={{
                padding: '10px 0',
                borderBottom:
                  index < entries.length - 1
                    ? `1px solid var(--wgt-border-faint)`
                    : 'none',
              }}
            >
              <div
                className="wgt-yzName"
                style={{
                  fontSize,
                  fontWeight: 600,
                  color: textColor,
                }}
              >
                {getName(entry)}
              </div>
              {entry.relationship && (
                <div
                  className="wgt-yzRelation"
                  style={{
                    fontSize: fontSize * 0.7,
                    color: textColor,
                    opacity: 0.65,
                  }}
                >
                  {entry.relationship}
                </div>
              )}
              {entry.hebrewDate && (
                <div
                  style={{
                    fontSize: fontSize * 0.65,
                    color: textColor,
                    opacity: 0.5,
                    marginTop: 2,
                    direction: 'rtl',
                  }}
                >
                  {entry.hebrewDate}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

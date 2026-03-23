'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

export interface ScrollConfig {
  enabled?: boolean;
  direction?: 'up' | 'down' | 'left' | 'right';
  /** Pixels per second */
  speed?: number;
}

interface ScrollWrapperProps {
  config?: ScrollConfig;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Wraps content and applies continuous CSS-animated scrolling.
 * Content is duplicated so the scroll loops seamlessly.
 * If scrolling is disabled or not configured, renders children as-is (no extra wrapper).
 */
export function ScrollWrapper({ config, children, style }: ScrollWrapperProps) {
  const enabled = config?.enabled === true;
  const direction = config?.direction ?? 'up';
  const speed = config?.speed ?? 30;

  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [contentSize, setContentSize] = useState(0);
  const [containerSize, setContainerSize] = useState(0);
  const [measured, setMeasured] = useState(false);

  const isVertical = direction === 'up' || direction === 'down';

  const measure = useCallback(() => {
    if (!containerRef.current || !measureRef.current) return;
    const cSize = isVertical
      ? containerRef.current.clientHeight
      : containerRef.current.clientWidth;

    const el = measureRef.current;
    const prevOverflow = el.style.overflow;
    const prevHeight = el.style.height;
    const prevWidth = el.style.width;
    const prevPosition = el.style.position;
    el.style.overflow = 'visible';
    if (isVertical) {
      el.style.height = 'auto';
    } else {
      // Let children expand to their natural width by removing width
      // constraint and making the element out of flow for measurement.
      el.style.width = 'max-content';
      el.style.position = 'absolute';
    }

    const mSize = isVertical ? el.scrollHeight : el.scrollWidth;

    el.style.overflow = prevOverflow;
    el.style.height = prevHeight;
    el.style.width = prevWidth;
    el.style.position = prevPosition;

    setContainerSize(cSize);
    setContentSize(mSize);
    setMeasured(true);
  }, [isVertical]);

  useEffect(() => {
    if (!enabled) { setMeasured(false); return; }
    // Delay initial measurement to allow content to render
    const timer = setTimeout(measure, 100);
    const ro = new ResizeObserver(() => {
      // Re-measure on any size change
      measure();
    });
    if (containerRef.current) ro.observe(containerRef.current);
    if (measureRef.current) ro.observe(measureRef.current);
    return () => { clearTimeout(timer); ro.disconnect(); };
  }, [enabled, measure]);

  if (!enabled) {
    return <>{children}</>;
  }

  const needsScroll = measured && contentSize > containerSize && containerSize > 0;

  if (!needsScroll) {
    // Render content for measurement; overflow hidden so it doesn't visually spill
    return (
      <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden', ...style }}>
        <div ref={measureRef}>{children}</div>
      </div>
    );
  }

  const duration = contentSize / Math.max(speed, 1);
  const axis = isVertical ? 'Y' : 'X';
  const sign = direction === 'up' || direction === 'left' ? -1 : 1;

  const from = sign < 0 ? '0' : `-${contentSize}px`;
  const to = sign < 0 ? `-${contentSize}px` : '0';

  const animName = `scroll-${direction}-${Math.round(contentSize)}-${Math.round(containerSize)}`;
  const keyframes = `@keyframes ${animName} { from { transform: translate${axis}(${from}); } to { transform: translate${axis}(${to}); } }`;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        ...style,
      }}
    >
      <style>{keyframes}</style>
      <div
        style={{
          display: isVertical ? 'block' : 'inline-flex',
          animation: `${animName} ${duration}s linear infinite`,
          whiteSpace: isVertical ? undefined : 'nowrap',
        }}
      >
        <div ref={measureRef} style={{ display: isVertical ? 'block' : 'inline-block' }}>{children}</div>
        <div aria-hidden style={{ display: isVertical ? 'block' : 'inline-block' }}>{children}</div>
      </div>
    </div>
  );
}

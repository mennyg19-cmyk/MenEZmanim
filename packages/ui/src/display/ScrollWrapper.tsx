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
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentSize, setContentSize] = useState(0);
  const [containerSize, setContainerSize] = useState(0);
  const [ready, setReady] = useState(false);

  const isVertical = direction === 'up' || direction === 'down';

  const measure = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;
    if (isVertical) {
      setContentSize(contentRef.current.scrollHeight);
      setContainerSize(containerRef.current.clientHeight);
    } else {
      setContentSize(contentRef.current.scrollWidth);
      setContainerSize(containerRef.current.clientWidth);
    }
    setReady(true);
  }, [isVertical]);

  useEffect(() => {
    if (!enabled) { setReady(false); return; }
    const timer = setTimeout(measure, 50);
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    if (contentRef.current) ro.observe(contentRef.current);
    return () => { clearTimeout(timer); ro.disconnect(); };
  }, [enabled, measure]);

  if (!enabled) {
    return <>{children}</>;
  }

  const needsScroll = ready && contentSize > 0 && containerSize > 0;

  if (!needsScroll) {
    return (
      <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden', ...style }}>
        <div ref={contentRef}>{children}</div>
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
        <div ref={contentRef} style={{ display: isVertical ? 'block' : 'inline-block' }}>{children}</div>
        <div aria-hidden style={{ display: isVertical ? 'block' : 'inline-block' }}>{children}</div>
      </div>
    </div>
  );
}

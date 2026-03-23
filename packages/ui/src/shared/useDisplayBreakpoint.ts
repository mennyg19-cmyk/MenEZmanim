'use client';

import { useEffect, useRef, useState } from 'react';
import type { DisplayBreakpoint } from '@zmanim-app/core';

const MOBILE_MAX = 767;
const TABLET_MAX = 1023;

/**
 * Breakpoint for public display boards: orientation-aware.
 * Phone in landscape (tablet-range width) uses `full` so layouts match large screens.
 *
 * Uses multiple detection strategies to handle Chrome DevTools device-mode
 * which doesn't always fire standard resize events.
 */
export function useDisplayBreakpoint(): DisplayBreakpoint {
  const [bp, setBp] = useState<DisplayBreakpoint>(() => {
    if (typeof window === 'undefined') return 'full';
    return computeBreakpoint(window.innerWidth, window.innerHeight);
  });

  const prevDims = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      if (w === prevDims.current.w && h === prevDims.current.h) return;
      prevDims.current = { w, h };

      setBp(computeBreakpoint(w, h));
    };

    update();

    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);

    const vv = window.visualViewport;
    if (vv) vv.addEventListener('resize', update);

    // Poll as fallback: DevTools device-mode toggle doesn't always fire resize.
    const poll = setInterval(update, 500);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      if (vv) vv.removeEventListener('resize', update);
      clearInterval(poll);
    };
  }, []);

  return bp;
}

function computeBreakpoint(w: number, h: number): DisplayBreakpoint {
  if (w >= 1024) return 'full';

  const landscape = w > h;

  if (landscape && w > MOBILE_MAX) return 'full';

  if (w <= MOBILE_MAX) return 'mobile';
  if (w <= TABLET_MAX) return 'tablet';

  return 'full';
}

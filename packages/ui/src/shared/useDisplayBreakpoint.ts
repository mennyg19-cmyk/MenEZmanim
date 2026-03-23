'use client';

import { useEffect, useState } from 'react';
import type { DisplayBreakpoint } from '@zmanim-app/core';

const MOBILE_MAX = 767;
const TABLET_MAX = 1023;

/**
 * Breakpoint for public display boards: orientation-aware.
 * Phone in landscape uses `full` so layouts match large screens.
 */
export function useDisplayBreakpoint(): DisplayBreakpoint {
  const [bp, setBp] = useState<DisplayBreakpoint>('full');

  useEffect(() => {
    const compute = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1920;
      const landscape =
        typeof window !== 'undefined' &&
        window.matchMedia('(orientation: landscape)').matches;

      if (w >= 1024) {
        setBp('full');
        return;
      }
      // Narrow viewports in landscape: treat as full (e.g. phone sideways).
      if (landscape && w < 1024) {
        setBp('full');
        return;
      }
      if (w <= MOBILE_MAX) {
        setBp('mobile');
        return;
      }
      if (w <= TABLET_MAX) {
        setBp('tablet');
        return;
      }
      setBp('full');
    };

    compute();
    window.addEventListener('resize', compute);
    const mq = window.matchMedia('(orientation: landscape)');
    mq.addEventListener('change', compute);
    return () => {
      window.removeEventListener('resize', compute);
      mq.removeEventListener('change', compute);
    };
  }, []);

  return bp;
}

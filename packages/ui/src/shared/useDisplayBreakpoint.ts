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
      if (typeof window === 'undefined') { setBp('full'); return; }

      const w = window.innerWidth;
      const h = window.innerHeight;
      const landscape = w > h;

      if (w >= 1024) {
        setBp('full');
        return;
      }
      // Narrow viewport in landscape (e.g. phone turned sideways): treat as full.
      if (landscape && w < 1024 && w > MOBILE_MAX) {
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
    return () => {
      window.removeEventListener('resize', compute);
    };
  }, []);

  return bp;
}

'use client';

import { useEffect, useState } from 'react';
import { BREAKPOINT_MOBILE_MAX, BREAKPOINT_TABLET_MAX } from './constants';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>('desktop');

  useEffect(() => {
    const mqMobile = window.matchMedia(`(max-width: ${BREAKPOINT_MOBILE_MAX}px)`);
    const mqTablet = window.matchMedia(
      `(min-width: ${BREAKPOINT_MOBILE_MAX + 1}px) and (max-width: ${BREAKPOINT_TABLET_MAX}px)`,
    );

    const compute = () => {
      if (mqMobile.matches) setBp('mobile');
      else if (mqTablet.matches) setBp('tablet');
      else setBp('desktop');
    };

    compute();
    mqMobile.addEventListener('change', compute);
    mqTablet.addEventListener('change', compute);
    return () => {
      mqMobile.removeEventListener('change', compute);
      mqTablet.removeEventListener('change', compute);
    };
  }, []);

  return bp;
}

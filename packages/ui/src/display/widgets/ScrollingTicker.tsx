'use client';

import React from 'react';

export interface ScrollingTickerProps {
  items: string[];
  fontSize: number;
  fontFamily: string;
  color: string;
  /** Separator between announcement titles */
  separator: string;
  /** Text direction; scrolling (if any) comes from the Appearance tab ScrollWrapper */
  textDirection?: 'ltr' | 'rtl';
}

/**
 * Static ticker text. Horizontal/vertical scrolling is applied by `ScrollWrapper` from object appearance settings.
 */
export function ScrollingTicker({
  items,
  fontSize,
  fontFamily,
  color,
  separator,
  textDirection = 'ltr',
}: ScrollingTickerProps) {
  const fullText = items.filter(Boolean).join(` ${separator} `);

  return (
    <div
      dir={textDirection}
      className="wgt-tickerRoot"
      style={{
        width: '100%',
        overflow: 'hidden',
        padding: '8px 0',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          fontSize,
          fontFamily,
          color,
        }}
      >
        {fullText || '\u00a0'}
      </span>
    </div>
  );
}

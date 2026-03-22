'use client';

import React from 'react';
import { getFrameById } from '../shared/frames';

export interface FrameRendererProps {
  frameId?: string | null;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Applies a 9-slice decorative frame via CSS border-image.
 */
export function FrameRenderer({ frameId, children, className, style }: FrameRendererProps) {
  const frame = getFrameById(frameId ?? undefined);
  if (!frame) {
    return (
      <div className={className} style={{ width: '100%', height: '100%', boxSizing: 'border-box', ...style }}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        borderStyle: 'solid',
        borderWidth: 0,
        // Shorthand: slice / width / outset / repeat
        borderImage: `url("${frame.svgDataUri}") ${frame.borderImageSlice} / ${frame.borderImageWidth} / 0 stretch`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

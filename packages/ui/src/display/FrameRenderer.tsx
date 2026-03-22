'use client';

import React from 'react';
import { getFrameById } from '../shared/frames';

export interface FrameRendererProps {
  frameId?: string | null;
  /** Thickness multiplier (1.0 = default). Scales corner and side sizes. */
  thickness?: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

function isCustomFrame(id: string): boolean {
  return id.startsWith('custom:');
}

function parseCustomFrame(id: string): { url: string; slice: number } | undefined {
  if (!id.startsWith('custom:')) return undefined;
  const rest = id.slice(7);
  const lastColon = rest.lastIndexOf(':');
  if (lastColon === -1) return { url: rest, slice: 30 };
  const url = rest.slice(0, lastColon);
  const slice = parseInt(rest.slice(lastColon + 1), 10);
  return { url, slice: isNaN(slice) ? 30 : slice };
}

/**
 * Renders a decorative frame using 8 image pieces (4 corners + 4 sides).
 * Corners stay fixed; sides stretch in one direction only.
 * Custom frames (prefixed with "custom:") use CSS border-image fallback.
 */
export function FrameRenderer({ frameId, thickness = 1, children, className, style }: FrameRendererProps) {
  if (!frameId) {
    return (
      <div className={className} style={{ width: '100%', height: '100%', boxSizing: 'border-box', ...style }}>
        {children}
      </div>
    );
  }

  // Custom frame: CSS border-image fallback
  if (isCustomFrame(frameId)) {
    const custom = parseCustomFrame(frameId);
    if (!custom) {
      return (
        <div className={className} style={{ width: '100%', height: '100%', boxSizing: 'border-box', ...style }}>
          {children}
        </div>
      );
    }
    const bw = Math.round(30 * thickness);
    return (
      <div
        className={className}
        style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          borderStyle: 'solid',
          borderWidth: 0,
          borderImage: `url("${custom.url}") ${custom.slice}% / ${bw}px / 0 stretch`,
          ...style,
        }}
      >
        {children}
      </div>
    );
  }

  // Built-in frame: 8-piece images
  const frame = getFrameById(frameId);
  if (!frame) {
    return (
      <div className={className} style={{ width: '100%', height: '100%', boxSizing: 'border-box', ...style }}>
        {children}
      </div>
    );
  }

  const cs = Math.round(frame.cornerSize * thickness);
  const th = Math.round(frame.sideThickness * thickness);
  const bp = frame.basePath;

  const imgBase: React.CSSProperties = {
    position: 'absolute',
    display: 'block',
    pointerEvents: 'none',
  };

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {/* Top-left corner */}
      <img src={`${bp}/tl.png`} alt="" style={{ ...imgBase, top: 0, left: 0, width: cs, height: cs }} draggable={false} />
      {/* Top side */}
      <img src={`${bp}/t.png`} alt="" style={{ ...imgBase, top: 0, left: cs, right: cs, height: th, width: `calc(100% - ${cs * 2}px)` }} draggable={false} />
      {/* Top-right corner */}
      <img src={`${bp}/tr.png`} alt="" style={{ ...imgBase, top: 0, right: 0, width: cs, height: cs }} draggable={false} />
      {/* Left side */}
      <img src={`${bp}/l.png`} alt="" style={{ ...imgBase, top: cs, left: 0, width: th, height: `calc(100% - ${cs * 2}px)` }} draggable={false} />
      {/* Right side */}
      <img src={`${bp}/r.png`} alt="" style={{ ...imgBase, top: cs, right: 0, width: th, height: `calc(100% - ${cs * 2}px)` }} draggable={false} />
      {/* Bottom-left corner */}
      <img src={`${bp}/bl.png`} alt="" style={{ ...imgBase, bottom: 0, left: 0, width: cs, height: cs }} draggable={false} />
      {/* Bottom side */}
      <img src={`${bp}/b.png`} alt="" style={{ ...imgBase, bottom: 0, left: cs, height: th, width: `calc(100% - ${cs * 2}px)` }} draggable={false} />
      {/* Bottom-right corner */}
      <img src={`${bp}/br.png`} alt="" style={{ ...imgBase, bottom: 0, right: 0, width: cs, height: cs }} draggable={false} />

      {/* Content area, inset by frame thickness */}
      <div style={{ position: 'absolute', top: th, left: th, right: th, bottom: th, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

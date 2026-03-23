'use client';

import React from 'react';

export interface PlainTextProps {
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  direction: 'rtl' | 'ltr';
  verticalAlign: 'top' | 'middle' | 'bottom';
  lineHeight?: number;
}

const verticalAlignMap: Record<PlainTextProps['verticalAlign'], string> = {
  top: 'flex-start',
  middle: 'center',
  bottom: 'flex-end',
};

export function PlainText({
  text,
  fontSize,
  fontFamily,
  color,
  textAlign,
  direction,
  lineHeight: lineHeightProp,
}: PlainTextProps) {
  const lh = lineHeightProp ?? 1.4;
  const lines = text.split('\n');

  return (
    <div
      style={{
        width: '100%',
        padding: 16,
        boxSizing: 'border-box',
      }}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            fontSize,
            fontFamily,
            color,
            textAlign,
            direction,
            lineHeight: lh,
            minHeight: line === '' ? fontSize * 0.5 : undefined,
          }}
        >
          {line || '\u00A0'}
        </div>
      ))}
    </div>
  );
}

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
}: PlainTextProps) {
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
            lineHeight: 1.4,
            minHeight: line === '' ? fontSize * 0.5 : undefined,
          }}
        >
          {line || '\u00A0'}
        </div>
      ))}
    </div>
  );
}

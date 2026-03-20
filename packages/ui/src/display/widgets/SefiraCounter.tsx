'use client';

import React from 'react';

export interface SefiraCounterProps {
  day: number | null;
  formattedHebrew: string;
  fontSize: number;
  textColor: string;
  showEnglish: boolean;
}

export function SefiraCounter({
  day,
  formattedHebrew,
  fontSize,
  textColor,
  showEnglish,
}: SefiraCounterProps) {
  if (day === null) return null;

  const fontFamily = 'system-ui, -apple-system, sans-serif';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily,
        padding: 24,
        boxSizing: 'border-box',
        borderRadius: 8,
      }}
    >
      {/* Hebrew count */}
      <div
        style={{
          fontSize,
          fontWeight: 700,
          color: textColor,
          direction: 'rtl',
          textAlign: 'center',
          lineHeight: 1.4,
        }}
      >
        {formattedHebrew}
      </div>

      {/* English count */}
      {showEnglish && (
        <div
          style={{
            fontSize: fontSize * 0.55,
            color: textColor,
            opacity: 0.7,
            marginTop: fontSize * 0.3,
            textAlign: 'center',
          }}
        >
          Day {day} of the Omer
        </div>
      )}
    </div>
  );
}

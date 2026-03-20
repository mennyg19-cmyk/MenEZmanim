'use client';

import React, { useState, useEffect } from 'react';

export interface DigitalClockProps {
  format24h: boolean;
  showSeconds: boolean;
  showAmPm: boolean;
  fontSize: number;
  fontFamily?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export function DigitalClock({
  format24h,
  showSeconds,
  showAmPm,
  fontSize,
  fontFamily,
  color,
  textAlign,
}: DigitalClockProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = format24h ? time.getHours() : time.getHours() % 12 || 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const ampm = format24h || !showAmPm ? '' : (time.getHours() >= 12 ? ' PM' : ' AM');

  const pad = (n: number) => n.toString().padStart(2, '0');
  const timeStr = `${pad(hours)}:${pad(minutes)}${showSeconds ? ':' + pad(seconds) : ''}${ampm}`;

  return (
    <div
      style={{
        fontSize,
        fontFamily: fontFamily || 'system-ui, -apple-system, sans-serif',
        color: color || '#ffffff',
        textAlign: textAlign || 'center',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {timeStr}
    </div>
  );
}

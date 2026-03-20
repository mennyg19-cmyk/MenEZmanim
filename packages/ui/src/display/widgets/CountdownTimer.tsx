'use client';

import React, { useState, useEffect } from 'react';


export interface CountdownTimerProps {
  targetTime: Date | null;
  label: string;
  labelHebrew: string;
  fontSize: number;
  textColor: string;
  completedText: string;
  language: 'hebrew' | 'english';
}

export function CountdownTimer({
  targetTime,
  label,
  labelHebrew,
  fontSize,
  textColor,
  completedText,
  language,
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!targetTime) {
      setRemaining(null);
      return;
    }

    const update = () => {
      const diff = targetTime.getTime() - Date.now();
      setRemaining(Math.max(0, diff));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  const isRtl = language === 'hebrew';
  const fontFamily = 'system-ui, -apple-system, sans-serif';
  const displayLabel = isRtl ? labelHebrew : label;

  if (!targetTime || remaining === null) {
    return null;
  }

  const isCompleted = remaining <= 0;

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const timeStr = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return (
    <div
      className="wgt-countdown"
      style={{
        width: '100%',
        height: '100%',
        fontFamily,
        direction: isRtl ? 'rtl' : 'ltr',
        padding: 24,
      }}
    >
      {/* Label */}
      <div
        className="wgt-countdownLabel"
        style={{
          fontSize: fontSize * 0.6,
          fontWeight: 600,
          color: textColor,
          opacity: 0.75,
          marginBottom: fontSize * 0.3,
        }}
      >
        {displayLabel}
      </div>

      {/* Countdown or completed text */}
      {isCompleted ? (
        <div
          className="wgt-countdownValue"
          style={{
            fontSize: fontSize * 0.8,
            fontWeight: 700,
            color: textColor,
          }}
        >
          {completedText}
        </div>
      ) : (
        <div
          className="wgt-countdownValue"
          style={{
            fontSize,
            fontWeight: 700,
            color: textColor,
          }}
        >
          {timeStr}
        </div>
      )}
    </div>
  );
}

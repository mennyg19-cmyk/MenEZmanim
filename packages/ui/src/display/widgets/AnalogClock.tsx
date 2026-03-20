'use client';

import React, { useState, useEffect } from 'react';


export interface AnalogClockProps {
  size: number;
  showNumbers: boolean;
  showSeconds: boolean;
  faceColor: string;
  handColor: string;
  numberColor: string;
}

export function AnalogClock({
  size,
  showNumbers,
  showSeconds,
  faceColor,
  handColor,
  numberColor,
}: AnalogClockProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 4;

  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const hourAngle = (hours + minutes / 60) * 30 - 90;
  const minuteAngle = (minutes + seconds / 60) * 6 - 90;
  const secondAngle = seconds * 6 - 90;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const handLine = (angle: number, length: number, width: number, color: string) => {
    const x2 = cx + length * Math.cos(toRad(angle));
    const y2 = cy + length * Math.sin(toRad(angle));
    return (
      <line
        x1={cx}
        y1={cy}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
      />
    );
  };

  const markerLength = radius * 0.08;
  const markerStart = radius * 0.85;
  const numberRadius = radius * 0.72;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Face */}
      <circle cx={cx} cy={cy} r={radius} fill={faceColor} stroke={handColor} strokeWidth={2} />

      {/* Hour markers or numbers */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i + 1) * 30 - 90;
        const rad = toRad(angle);

        if (showNumbers) {
          return (
            <text
              key={i}
              x={cx + numberRadius * Math.cos(rad)}
              y={cy + numberRadius * Math.sin(rad)}
              textAnchor="middle"
              dominantBaseline="central"
              fill={numberColor}
              fontSize={size * 0.1}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={600}
            >
              {i + 1}
            </text>
          );
        }

        const x1 = cx + markerStart * Math.cos(rad);
        const y1 = cy + markerStart * Math.sin(rad);
        const x2 = cx + (markerStart + markerLength) * Math.cos(rad);
        const y2 = cy + (markerStart + markerLength) * Math.sin(rad);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={handColor}
            strokeWidth={i % 3 === 2 ? 3 : 1.5}
            strokeLinecap="round"
          />
        );
      })}

      {/* Minute tick marks */}
      {Array.from({ length: 60 }, (_, i) => {
        if (i % 5 === 0) return null;
        const angle = i * 6 - 90;
        const rad = toRad(angle);
        const tickStart = radius * 0.92;
        const tickEnd = radius * 0.95;
        return (
          <line
            key={`tick-${i}`}
            x1={cx + tickStart * Math.cos(rad)}
            y1={cy + tickStart * Math.sin(rad)}
            x2={cx + tickEnd * Math.cos(rad)}
            y2={cy + tickEnd * Math.sin(rad)}
            stroke={handColor}
            strokeWidth={0.8}
            strokeLinecap="round"
            opacity={0.5}
          />
        );
      })}

      {/* Hands */}
      {handLine(hourAngle, radius * 0.5, size * 0.025, handColor)}
      {handLine(minuteAngle, radius * 0.72, size * 0.016, handColor)}
      {showSeconds && handLine(secondAngle, radius * 0.78, size * 0.008, 'var(--wgt-accent, #c0392b)')}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={size * 0.02} fill={handColor} />
    </svg>
  );
}

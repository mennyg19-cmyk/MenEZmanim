'use client';

import React, { useState, useEffect, useRef } from 'react';


export interface FIDSMinyan {
  name: string;
  hebrewName: string;
  time: string;
  room?: string;
  type: string;
  isNext?: boolean;
}

export interface FIDSBoardProps {
  minyans: FIDSMinyan[];
  rooms?: string[];
  title?: string;
  titleHebrew?: string;
  language?: 'hebrew' | 'english';
  fontSize?: number;
  textColor?: string;
  backgroundColor?: string;
  highlightColor?: string;
  showCountdown?: boolean;
  flipAnimation?: boolean;
}

type MinyanStatus = 'NOW' | 'PASSED' | string;

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(':').map(Number);
  return { hours: h, minutes: m };
}

function getMinutesFromMidnight(hours: number, minutes: number): number {
  return hours * 60 + minutes;
}

function getStatus(
  minyanTime: string,
  nowMinutes: number,
  language: 'hebrew' | 'english',
): MinyanStatus {
  const { hours, minutes } = parseTime(minyanTime);
  const mMinutes = getMinutesFromMidnight(hours, minutes);
  const diff = mMinutes - nowMinutes;

  if (diff < -5) return 'PASSED';
  if (diff <= 0 && diff >= -5) return 'NOW';
  if (diff <= 60) {
    return language === 'hebrew' ? `בעוד ${diff} דק׳` : `in ${diff} min`;
  }
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (m === 0) {
    return language === 'hebrew' ? `בעוד ${h} שע׳` : `in ${h}h`;
  }
  return language === 'hebrew' ? `בעוד ${h}:${m.toString().padStart(2, '0')}` : `in ${h}:${m.toString().padStart(2, '0')}`;
}

function findNextMinyanIndex(
  minyans: FIDSMinyan[],
  nowMinutes: number,
): number {
  for (let i = 0; i < minyans.length; i++) {
    const { hours, minutes } = parseTime(minyans[i].time);
    if (getMinutesFromMidnight(hours, minutes) > nowMinutes) return i;
  }
  return -1;
}

const TYPE_COLORS: Record<string, string> = {
  shacharit: '#FFD54F',
  mincha: '#FF8A65',
  maariv: '#7986CB',
  other: '#A5D6A7',
};

function getTypeColor(type: string): string {
  return TYPE_COLORS[type.toLowerCase()] ?? TYPE_COLORS.other;
}

// -- Flip cell (split-flap display) --

function FlipCell({
  value,
  fontSize,
  textColor,
  backgroundColor,
}: {
  value: string;
  fontSize: number;
  textColor: string;
  backgroundColor: string;
}) {
  const prevRef = useRef(value);
  const [flipping, setFlipping] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (prevRef.current !== value) {
      setFlipping(true);
      const timer = setTimeout(() => {
        setDisplayValue(value);
        setFlipping(false);
        prevRef.current = value;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [value]);

  const cellBase: React.CSSProperties = {
    fontSize,
    fontWeight: 700,
    fontFamily: "'Courier New', 'Consolas', monospace",
    color: textColor,
    backgroundColor,
    padding: '4px 8px',
    minWidth: fontSize * 0.65,
  };

  const halfStyle = (isTop: boolean): React.CSSProperties => ({
    alignItems: isTop ? 'flex-end' : 'flex-start',
  });

  if (!flipping) {
    return <span className="wgt-flipCell" style={cellBase}>{displayValue}</span>;
  }

  return (
    <span className="wgt-flipCell" style={cellBase}>
      <span style={{ visibility: 'hidden' }}>{displayValue}</span>

      {/* Static bottom half — old value */}
      <span className="wgt-flipBottom" style={halfStyle(false)}>
        <span style={{ transform: 'translateY(-50%)' }}>{prevRef.current}</span>
      </span>

      {/* Flipping top half — old value flipping away */}
      <span
        className="wgt-flipTop"
        style={{
          ...halfStyle(true),
          transformOrigin: 'bottom',
          animation: 'fidsFlipTop 0.3s ease-in forwards',
        }}
      >
        <span style={{ transform: 'translateY(50%)' }}>{prevRef.current}</span>
      </span>

      {/* Flipping bottom half — new value flipping in */}
      <span
        className="wgt-flipBottom"
        style={{
          ...halfStyle(false),
          transformOrigin: 'top',
          animation: 'fidsFlipBottom 0.3s 0.15s ease-out forwards',
          transform: 'rotateX(90deg)',
        }}
      >
        <span style={{ transform: 'translateY(-50%)' }}>{value}</span>
      </span>

      {/* Static top half — new value */}
      <span className="wgt-flipTop" style={halfStyle(true)}>
        <span style={{ transform: 'translateY(50%)' }}>{value}</span>
      </span>
    </span>
  );
}

// Keyframes injected once
const FLIP_KEYFRAMES = `
@keyframes fidsFlipTop {
  0%   { transform: rotateX(0deg); }
  100% { transform: rotateX(-90deg); }
}
@keyframes fidsFlipBottom {
  0%   { transform: rotateX(90deg); }
  100% { transform: rotateX(0deg); }
}
`;

let keyframesInjected = false;
function injectKeyframes() {
  if (keyframesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = FLIP_KEYFRAMES;
  document.head.appendChild(style);
  keyframesInjected = true;
}

export function FIDSBoard({
  minyans,
  rooms,
  title,
  titleHebrew,
  language = 'english',
  fontSize = 28,
  textColor = '#E0E0E0',
  backgroundColor = '#1A1A2E',
  highlightColor = '#0F3460',
  showCountdown = true,
  flipAnimation = false,
}: FIDSBoardProps) {
  const [now, setNow] = useState(new Date());
  const isRtl = language === 'hebrew';

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (flipAnimation) injectKeyframes();
  }, [flipAnimation]);

  const nowMinutes = getMinutesFromMidnight(now.getHours(), now.getMinutes());

  const sorted = [...minyans].sort((a, b) => {
    const aT = parseTime(a.time);
    const bT = parseTime(b.time);
    return (
      getMinutesFromMidnight(aT.hours, aT.minutes) -
      getMinutesFromMidnight(bT.hours, bT.minutes)
    );
  });

  const nextIdx = findNextMinyanIndex(sorted, nowMinutes);

  const getName = (m: FIDSMinyan) => (isRtl ? m.hebrewName : m.name);
  const displayTitle = isRtl
    ? titleHebrew ?? title
    : title ?? titleHebrew;

  const headerLabels = isRtl
    ? { time: 'שעה', name: 'מניין', room: 'חדר', status: 'סטטוס' }
    : { time: 'TIME', name: 'MINYAN', room: 'ROOM', status: 'STATUS' };

  const headerCellStyle: React.CSSProperties = {
    fontSize: fontSize * 0.65,
    color: textColor,
    opacity: 0.6,
  };

  const cellStyle = (
    isPassed: boolean,
    isHighlighted: boolean,
  ): React.CSSProperties => ({
    fontSize,
    fontWeight: isHighlighted ? 700 : 400,
    color: isPassed ? 'rgba(255,255,255,0.3)' : textColor,
    fontFamily: "'Courier New', 'Consolas', monospace",
  });

  const renderStatusContent = (status: string) => {
    if (flipAnimation) {
      return (
        <FlipCell
          value={status}
          fontSize={fontSize * 0.75}
          textColor={status === 'NOW' ? '#FFD54F' : textColor}
          backgroundColor="rgba(255,255,255,0.05)"
        />
      );
    }
    return status;
  };

  return (
    <div
      className="wgt-fidsBoard"
      style={{
        width: '100%',
        backgroundColor,
        borderRadius: 8,
        fontFamily: "'Courier New', 'Consolas', monospace",
        direction: isRtl ? 'rtl' : 'ltr',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}
    >
      {displayTitle && (
        <div
          className="wgt-fidsTitleBar"
          style={{
            fontSize: fontSize * 1.1,
            fontWeight: 700,
            color: textColor,
            textTransform: language === 'english' ? 'uppercase' : undefined,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)',
          }}
        >
          {displayTitle}
        </div>
      )}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        }}
      >
        <thead>
          <tr className="wgt-fidsHeaderRow">
            <th className="wgt-fidsHeaderCell" style={{ ...headerCellStyle, width: '18%', textAlign: 'center' }}>
              {headerLabels.time}
            </th>
            <th className="wgt-fidsHeaderCell" style={{ ...headerCellStyle, width: '36%', textAlign: isRtl ? 'right' : 'left' }}>
              {headerLabels.name}
            </th>
            <th className="wgt-fidsHeaderCell" style={{ ...headerCellStyle, width: '18%', textAlign: 'center' }}>
              {headerLabels.room}
            </th>
            <th className="wgt-fidsHeaderCell" style={{ ...headerCellStyle, width: '28%', textAlign: 'center' }}>
              {headerLabels.status}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((minyan, idx) => {
            const status = showCountdown
              ? getStatus(minyan.time, nowMinutes, language)
              : '';
            const isPassed = status === 'PASSED';
            const isHighlighted = idx === nextIdx;
            const typeColor = getTypeColor(minyan.type);

            const rowBg = isHighlighted
              ? highlightColor
              : idx % 2 === 0
                ? 'transparent'
                : 'rgba(255,255,255,0.02)';

            return (
              <tr
                key={`${minyan.name}-${minyan.time}-${idx}`}
                className="wgt-fidsRow"
                style={{ backgroundColor: rowBg }}
              >
                <td
                  className="wgt-fidsCell"
                  style={{
                    ...cellStyle(isPassed, isHighlighted),
                    textAlign: 'center',
                    fontVariantNumeric: 'tabular-nums',
                    direction: 'ltr',
                  }}
                >
                  {flipAnimation ? (
                    <FlipCell
                      value={minyan.time}
                      fontSize={fontSize}
                      textColor={isPassed ? 'rgba(255,255,255,0.3)' : textColor}
                      backgroundColor="rgba(255,255,255,0.05)"
                    />
                  ) : (
                    minyan.time
                  )}
                </td>
                <td
                  className="wgt-fidsCell"
                  style={{
                    ...cellStyle(isPassed, isHighlighted),
                    textAlign: isRtl ? 'right' : 'left',
                  }}
                >
                  <span
                    className="wgt-fidsPassedDot"
                    style={{
                      width: 8,
                      height: 8,
                      backgroundColor: isPassed
                        ? 'rgba(255,255,255,0.15)'
                        : typeColor,
                      marginInlineEnd: 10,
                      verticalAlign: 'middle',
                    }}
                  />
                  {getName(minyan)}
                  {isHighlighted && (
                    <span
                      className="wgt-fidsNextBadge"
                      style={{
                        fontSize: fontSize * 0.5,
                        color: '#1A1A2E',
                        backgroundColor: '#FFD54F',
                      }}
                    >
                      {isRtl ? 'הבא' : 'NEXT'}
                    </span>
                  )}
                </td>
                <td
                  className="wgt-fidsCell"
                  style={{
                    ...cellStyle(isPassed, isHighlighted),
                    textAlign: 'center',
                    fontSize: fontSize * 0.85,
                    opacity: isPassed ? 0.4 : 0.8,
                  }}
                >
                  {minyan.room ?? '—'}
                </td>
                <td
                  className="wgt-fidsCell"
                  style={{
                    ...cellStyle(isPassed, isHighlighted),
                    textAlign: 'center',
                    fontSize: fontSize * 0.85,
                    fontWeight: status === 'NOW' ? 700 : 400,
                    color:
                      status === 'NOW'
                        ? '#FFD54F'
                        : isPassed
                          ? 'rgba(255,255,255,0.3)'
                          : textColor,
                  }}
                >
                  {renderStatusContent(status)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

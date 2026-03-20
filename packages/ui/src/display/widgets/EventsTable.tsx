'use client';

import React from 'react';
import { parseTime12 } from '../../shared/timeUtils';
import { TableColumnLayout, resolveTableProps } from './BaseTable';
import type { BaseTableProps } from './BaseTable';


export interface EventsTableEvent {
  name: string;
  hebrewName: string;
  time: string;
  room?: string;
  isNext?: boolean;
  isCurrent?: boolean;
  isPlaceholder?: boolean;
  placeholderLabel?: string;
  durationMinutes?: number;
}

export interface EmphasisConfig {
  enabled: boolean;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  fontSize?: number;
  /** @deprecated kept for migration */
  currentColor?: string;
  currentBold?: boolean;
  currentItalic?: boolean;
  currentBgColor?: string;
  nextColor?: string;
  nextBold?: boolean;
  nextItalic?: boolean;
  nextBgColor?: string;
}

export interface EventsTableProps extends BaseTableProps {
  events: EventsTableEvent[];
  title?: string;
  fontBold?: boolean;
  fontItalic?: boolean;
  highlightColor?: string;
  /** @deprecated use rowColor2 */
  rowAltBg?: string;
  showRoom?: boolean;
  emphasis?: EmphasisConfig;
  showHeader?: boolean;
  paddingX?: number;
  displayMode?: 'table' | 'list';
  headerBg?: string;
  headerFontSize?: number;
  headerColor?: string;
  headerBorderBottom?: string;
}

function computeEmphasis(events: EventsTableEvent[]): { currentIdx: number; nextIdx: number } {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  let currentIdx = -1;
  let nextIdx = -1;
  const times = events.map((e) => (e.isPlaceholder ? null : parseTime12(e.time)));
  for (let i = 0; i < times.length; i++) {
    const t = times[i];
    if (t === null) continue;
    const dur = events[i].durationMinutes ?? 30;
    if (nowMin >= t && nowMin < t + dur) currentIdx = i;
    if (t > nowMin && nextIdx === -1) nextIdx = i;
  }
  if (currentIdx === -1 && nextIdx === -1 && times.length > 0) {
    for (let i = 0; i < times.length; i++) {
      if (times[i] !== null) { nextIdx = i; break; }
    }
  }
  return { currentIdx, nextIdx };
}

export function EventsTable(props: EventsTableProps) {
  const {
    events, title, fontBold = false, fontItalic = false,
    rowAltBg, showRoom = false, emphasis, showHeader = true,
    paddingX = 0, headerBg, headerFontSize, headerColor: hdrColor,
    headerBorderBottom,
  } = props;

  const {
    isRtl, fontSize, textColor, cellPad, rowColor1, rowColor2: rc2Default,
    cols, columnSplit, columnGap, containerStyle, containerClassName, sepStyle,
  } = resolveTableProps(props);

  const rowColor2 = props.rowColor2 ?? rowAltBg ?? rc2Default;
  const baseWeight = fontBold ? 700 : 400;
  const baseItalic = fontItalic;
  const headerTextColor = hdrColor ?? textColor;
  const hdrFontSize = headerFontSize ?? fontSize * 0.85;
  const hdrBorderBtm = headerBorderBottom ?? '1px solid var(--wgt-separator)';

  const rowHeight = fontSize + cellPad * 2;
  const headerHeight = showHeader ? hdrFontSize + cellPad * 2 + 1 : 0;

  const emEnabled = emphasis?.enabled ?? false;
  const { currentIdx, nextIdx } = emEnabled ? computeEmphasis(events) : { currentIdx: -1, nextIdx: -1 };
  const emphIdx = currentIdx >= 0 ? currentIdx : nextIdx;

  const getName = (event: EventsTableEvent) => isRtl ? event.hebrewName : event.name;

  const getRowStyles = (event: EventsTableEvent, index: number) => {
    if (event.isPlaceholder) return { bg: 'transparent', color: textColor, weight: baseWeight, italic: baseItalic, size: fontSize };
    const isEmph = emEnabled && emphasis && index === emphIdx;
    const bg = index % 2 === 0 ? rowColor1 : rowColor2;
    const color = isEmph && emphasis!.color ? emphasis!.color : textColor;
    const weight = isEmph && emphasis!.bold ? 700 : baseWeight;
    const italic = isEmph && emphasis!.italic ? true : baseItalic;
    const size = isEmph && emphasis!.fontSize ? emphasis!.fontSize : fontSize;
    return { bg, color, weight, italic, size };
  };

  const renderTitle = () => {
    if (!title) return null;
    return (
      <div style={{ padding: `${cellPad * 1.2}px ${paddingX}px`, fontSize: fontSize * 1.2, fontWeight: 700, color: textColor, lineHeight: 1, textAlign: isRtl ? 'right' : 'left', flexShrink: 0 }}>
        {title}
      </div>
    );
  };

  const renderHeader = () => {
    if (!showHeader) return null;
    return (
      <div className="wgt-headerRow" style={{ justifyContent: 'space-between', alignItems: 'center', padding: `${cellPad}px ${paddingX}px`, lineHeight: 1, borderBottom: hdrBorderBtm, backgroundColor: headerBg }}>
        <span className="wgt-headerCell" style={{ fontSize: hdrFontSize, fontWeight: 600, color: headerTextColor, opacity: 0.7, flex: 1, minWidth: 0 }}>
          {isRtl ? 'אירוע' : 'Event'}
        </span>
        {showRoom && (
          <span className="wgt-headerCell" style={{ fontSize: hdrFontSize, fontWeight: 600, color: headerTextColor, opacity: 0.7, flex: 1, textAlign: 'center' }}>
            {isRtl ? 'מקום' : 'Location'}
          </span>
        )}
        <span className="wgt-headerCell" style={{ fontSize: hdrFontSize, fontWeight: 600, color: headerTextColor, opacity: 0.7, flexShrink: 0, marginInlineStart: 8, textAlign: isRtl ? 'left' : 'right', fontVariantNumeric: 'tabular-nums' }}>
          {isRtl ? 'שעה' : 'Time'}
        </span>
      </div>
    );
  };

  const renderRow = (event: EventsTableEvent, index: number) => {
    if (event.isPlaceholder) {
      return (
        <div key={`ph-${index}`} style={{ padding: `${cellPad * 0.5}px ${paddingX}px`, fontSize: fontSize * 0.8, color: textColor, opacity: 0.4, textAlign: 'center', lineHeight: 1 }}>
          {event.placeholderLabel || ''}
        </div>
      );
    }
    const s = getRowStyles(event, index);
    return (
      <div key={`${event.name}-${index}`} className="wgt-dataRow" style={{ justifyContent: 'space-between', padding: `${cellPad}px ${paddingX}px`, lineHeight: 1, backgroundColor: s.bg }}>
        <span className="wgt-dataCell" style={{ fontSize: s.size, fontWeight: s.weight, color: s.color, fontStyle: s.italic ? 'italic' : 'normal', flex: 1, minWidth: 0 }}>
          {getName(event)}
        </span>
        {showRoom && event.room && (
          <span className="wgt-dataCell" style={{ fontSize: s.size * 0.75, color: s.color, opacity: 0.5, fontStyle: s.italic ? 'italic' : 'normal', flex: 1, textAlign: 'center' }}>
            {event.room}
          </span>
        )}
        <span style={{ fontSize: s.size, fontWeight: s.weight, color: s.color, fontStyle: s.italic ? 'italic' : 'normal', fontVariantNumeric: 'tabular-nums', direction: 'ltr', flexShrink: 0, marginInlineStart: 8, textAlign: isRtl ? 'left' : 'right' }}>
          {event.time}
        </span>
      </div>
    );
  };

  return (
    <div className={containerClassName} style={containerStyle}>
      <TableColumnLayout
        items={events}
        cols={cols}
        columnSplit={columnSplit}
        columnGap={columnGap}
        rowHeight={rowHeight}
        headerHeight={headerHeight}
        sepStyle={sepStyle}
        title={renderTitle()}
        renderColumnHeader={renderHeader}
        renderRow={renderRow}
      />
    </div>
  );
}

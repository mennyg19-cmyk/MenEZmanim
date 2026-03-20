'use client';

import React from 'react';
import { TableColumnLayout, resolveTableProps } from './BaseTable';
import type { BaseTableProps } from './BaseTable';


export interface ZmanimTableProps extends BaseTableProps {
  zmanim: Array<{
    label: string;
    time: string | null;
    hebrewLabel: string;
    isHighlighted?: boolean;
  }>;
  title?: string;
  titleHebrew?: string;
  headerColor?: string;
  highlightColor?: string;
  /** @deprecated use rowColor2 */
  rowAltBg?: string;
  compact?: boolean;
  displayMode?: 'table' | 'list';
}

export function ZmanimTable(props: ZmanimTableProps) {
  const {
    zmanim, title, titleHebrew, headerColor = 'var(--wgt-text)',
    highlightColor = '#e8f4f8', rowAltBg, compact = false,
  } = props;

  const {
    isRtl, fontSize, textColor, cellPad: basePad, rowColor1, rowColor2: rc2Default,
    cols, columnSplit, columnGap, containerStyle, containerClassName, sepStyle,
  } = resolveTableProps(props);

  const rowColor2 = props.rowColor2 ?? rowAltBg ?? rc2Default;
  const rowFontSize = compact ? fontSize * 0.9 : fontSize;
  const rowPadding = props.rowPaddingPx ?? (compact ? 6 : basePad);
  const titleFontSize = fontSize * 1.25;
  const rowHeight = rowFontSize + rowPadding * 2;

  const getLabel = (zman: ZmanimTableProps['zmanim'][0]) =>
    isRtl ? zman.hebrewLabel : zman.label;

  const getRowBg = (zman: ZmanimTableProps['zmanim'][0], index: number) => {
    if (zman.isHighlighted) return highlightColor;
    return index % 2 === 0 ? rowColor1 : rowColor2;
  };

  const renderTitle = () => {
    if (!title && !titleHebrew) return null;
    return (
      <div style={{ padding: `${rowPadding * 1.5}px ${rowPadding}px`, fontSize: titleFontSize, fontWeight: 700, color: headerColor, lineHeight: 1, textAlign: isRtl ? 'right' : 'left', direction: isRtl ? 'rtl' : 'ltr', flexShrink: 0 }}>
        {isRtl ? titleHebrew ?? title : title ?? titleHebrew}
      </div>
    );
  };

  const renderRow = (zman: ZmanimTableProps['zmanim'][0], index: number) => (
    <div key={`${zman.label}-${index}`} className="wgt-dataRow" style={{ justifyContent: 'space-between', padding: rowPadding, fontSize: rowFontSize, lineHeight: 1, color: textColor, backgroundColor: getRowBg(zman, index) }}>
      <span className="wgt-dataCell" style={{ textAlign: isRtl ? 'right' : 'left', direction: isRtl ? 'rtl' : 'ltr', flex: 1, minWidth: 0 }}>
        {getLabel(zman)}
      </span>
      <span style={{ textAlign: isRtl ? 'left' : 'right', direction: 'ltr', flexShrink: 0, marginInlineStart: 8, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
        {zman.time ?? '—'}
      </span>
    </div>
  );

  return (
    <div className={containerClassName} style={containerStyle}>
      <TableColumnLayout
        items={zmanim}
        cols={cols}
        columnSplit={columnSplit}
        columnGap={columnGap}
        rowHeight={rowHeight}
        headerHeight={0}
        sepStyle={sepStyle}
        title={renderTitle()}
        renderRow={renderRow}
      />
    </div>
  );
}

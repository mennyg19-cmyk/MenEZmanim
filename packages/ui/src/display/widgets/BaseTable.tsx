'use client';

import React, { useRef, useState, useEffect } from 'react';
import { buildColumnData } from '../../shared/tableUtils';
import { DEFAULT_FONT_FAMILY } from '../../shared/constants';


export interface BaseTableProps {
  language?: 'hebrew' | 'english';
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  rowPaddingPx?: number;
  columns?: number;
  columnSplit?: 'even' | 'fill';
  columnGap?: number;
  rowColor1?: string;
  rowColor2?: string;
  showBorder?: boolean;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  columnSeparator?: boolean;
  columnSeparatorColor?: string;
  columnSeparatorWidth?: number;
}

interface UseColumnLayoutOptions {
  itemCount: number;
  cols: number;
  columnSplit: 'even' | 'fill';
  rowHeight: number;
  headerHeight: number;
}

export function useColumnLayout({ itemCount, cols, columnSplit, rowHeight, headerHeight }: UseColumnLayoutOptions) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [fillPerCol, setFillPerCol] = useState<number | null>(null);

  useEffect(() => {
    if (cols <= 1 || columnSplit !== 'fill') { setFillPerCol(null); return; }
    const el = bodyRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.clientHeight;
      if (h > 0) {
        const available = h - headerHeight;
        const perCol = Math.max(1, Math.floor(available / rowHeight));
        setFillPerCol(perCol);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cols, columnSplit, rowHeight, headerHeight]);

  return { bodyRef, fillPerCol };
}

export function resolveTableProps(props: BaseTableProps) {
  const {
    language = 'english',
    fontSize = 24,
    fontFamily = DEFAULT_FONT_FAMILY,
    textColor = 'var(--wgt-text)',
    rowPaddingPx,
    columns = 1,
    columnSplit = 'fill',
    columnGap = 0,
    rowColor1: rc1,
    rowColor2: rc2,
    showBorder = false,
    borderColor = 'var(--wgt-separator)',
    borderWidth = 1,
    borderRadius = 0,
    columnSeparator = false,
    columnSeparatorColor = 'var(--wgt-separator)',
    columnSeparatorWidth = 1,
  } = props;

  const isRtl = language === 'hebrew';
  const cellPad = rowPaddingPx ?? 10;
  const rowColor1 = rc1 ?? 'transparent';
  const rowColor2 = rc2 ?? 'rgba(0,0,0,0.025)';
  const cols = Math.max(1, Math.min(4, columns));
  const hasBorder = showBorder || borderWidth > 0;
  const sepStyle = columnSeparator ? `${columnSeparatorWidth}px solid ${columnSeparatorColor}` : undefined;

  const containerStyle: React.CSSProperties = {
    width: '100%',
    fontFamily,
    direction: isRtl ? 'rtl' : 'ltr',
    border: hasBorder ? `${borderWidth}px solid ${borderColor}` : 'none',
    borderRadius: hasBorder ? borderRadius : 0,
  };

  const containerClassName = "wgt-tableContainer";

  return {
    isRtl, fontSize, fontFamily, textColor, cellPad,
    rowColor1, rowColor2, cols, columnSplit, columnGap,
    containerStyle, containerClassName, sepStyle,
  };
}

interface TableColumnLayoutProps<T> {
  items: T[];
  cols: number;
  columnSplit: 'even' | 'fill';
  columnGap: number;
  rowHeight: number;
  headerHeight: number;
  sepStyle?: string;
  title?: React.ReactNode;
  renderColumnHeader?: () => React.ReactNode;
  renderRow: (item: T, index: number) => React.ReactNode;
}

export function TableColumnLayout<T>({
  items, cols, columnSplit, columnGap, rowHeight, headerHeight,
  sepStyle, title, renderColumnHeader, renderRow,
}: TableColumnLayoutProps<T>) {
  const { bodyRef, fillPerCol } = useColumnLayout({
    itemCount: items.length, cols, columnSplit, rowHeight, headerHeight,
  });

  const columnData = buildColumnData(items, cols, columnSplit, fillPerCol);

  return (
    <>
      {title}
      <div ref={bodyRef} className="wgt-tableColumns" style={{ gap: columnGap }}>
        {columnData.map((colItems, ci) => (
          <div key={ci} className="wgt-tableColumn" style={{ minWidth: 0, borderInlineEnd: ci < columnData.length - 1 ? sepStyle : undefined }}>
            {renderColumnHeader?.()}
            {colItems.map((item, i) => renderRow(item, i))}
          </div>
        ))}
      </div>
    </>
  );
}

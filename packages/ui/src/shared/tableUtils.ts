export function splitEven<T>(items: T[], cols: number): T[][] {
  const result: T[][] = [];
  const perCol = Math.ceil(items.length / cols);
  for (let i = 0; i < cols; i++) {
    result.push(items.slice(i * perCol, (i + 1) * perCol));
  }
  return result;
}

export function splitFill<T>(items: T[], cols: number, fillPerCol: number): T[][] {
  const columnData: T[][] = [];
  let offset = 0;
  for (let c = 0; c < cols; c++) {
    columnData.push(items.slice(offset, offset + fillPerCol));
    offset += fillPerCol;
  }
  if (offset < items.length) {
    const last = columnData[columnData.length - 1];
    columnData[columnData.length - 1] = [...last, ...items.slice(offset)];
  }
  return columnData;
}

export function buildColumnData<T>(
  items: T[],
  cols: number,
  columnSplit: 'even' | 'fill',
  fillPerCol: number | null,
): T[][] {
  if (cols <= 1) return [items];
  if (columnSplit === 'even') return splitEven(items, cols);
  if (fillPerCol !== null && fillPerCol > 0) return splitFill(items, cols, fillPerCol);
  return splitEven(items, cols);
}

export interface CsvExportOptions {
  delimiter: ',' | '\t' | ';';
  includeHeaders: boolean;
  encoding: 'utf-8' | 'utf-8-bom';
}

const DEFAULT_OPTIONS: CsvExportOptions = {
  delimiter: ',',
  includeHeaders: true,
  encoding: 'utf-8',
};

function escapeCsvField(field: string, delimiter: string): string {
  const str = String(field ?? '');
  const needsQuotes =
    str.includes(delimiter) ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r');
  if (needsQuotes) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateCsv(
  data: any[],
  columns: Array<{ key: string; header: string }>,
  options?: Partial<CsvExportOptions>,
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { delimiter, includeHeaders, encoding } = opts;

  const headerRow = columns
    .map((c) => escapeCsvField(c.header, delimiter))
    .join(delimiter);

  const dataRows = data.map((row) =>
    columns
      .map((c) => escapeCsvField(String(row[c.key] ?? ''), delimiter))
      .join(delimiter),
  );

  const lines = includeHeaders ? [headerRow, ...dataRows] : dataRows;
  const csv = lines.join('\r\n');

  if (encoding === 'utf-8-bom') {
    const BOM = '\uFEFF';
    return BOM + csv;
  }
  return csv;
}

export function generateZmanimCsv(
  days: Array<{
    date: string;
    hebrewDate: string;
    zmanim: Record<string, string>;
  }>,
  options?: Partial<CsvExportOptions>,
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  if (days.length === 0) {
    return opts.encoding === 'utf-8-bom' ? '\uFEFF' : '';
  }

  const zmanKeys = Object.keys(days[0].zmanim);
  const columns: Array<{ key: string; header: string }> = [
    { key: 'date', header: 'Date' },
    { key: 'hebrewDate', header: 'Hebrew Date' },
    ...zmanKeys.map((k) => ({ key: `zman_${k}`, header: k })),
  ];

  const data = days.map((d) => {
    const row: Record<string, string> = {
      date: d.date,
      hebrewDate: d.hebrewDate,
    };
    for (const k of zmanKeys) {
      row[`zman_${k}`] = d.zmanim[k] ?? '';
    }
    return row;
  });

  return generateCsv(data, columns, opts);
}

export function generateYahrzeitCsv(
  entries: Array<{
    hebrewName: string;
    englishName?: string;
    hebrewDate: string;
    civilDate?: string;
  }>,
  options?: Partial<CsvExportOptions>,
): string {
  const columns: Array<{ key: string; header: string }> = [
    { key: 'hebrewName', header: 'Hebrew Name' },
    { key: 'englishName', header: 'English Name' },
    { key: 'hebrewDate', header: 'Hebrew Date' },
    { key: 'civilDate', header: 'Civil Date' },
  ];

  const data = entries.map((e) => ({
    hebrewName: e.hebrewName,
    englishName: e.englishName ?? '',
    hebrewDate: e.hebrewDate,
    civilDate: e.civilDate ?? '',
  }));

  return generateCsv(data, columns, options);
}

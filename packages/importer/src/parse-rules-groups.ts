import * as fs from 'fs';

export interface BZSScheduleGroup {
  name: string;
  enabled: boolean;
  color: string;       // CSS hex color
  foreColor: string;   // CSS hex color
  id: string;
  dateInfo: string;
  order: number;
}

/**
 * Converts a .NET ARGB color integer to CSS hex color.
 * Negative values are 32-bit signed integers; we extract RGB (lower 24 bits).
 */
function netColorToHex(value: string): string {
  const num = parseInt(value, 10);
  if (isNaN(num) || value.trim() === '') return '#000000';
  const rgb = (num >>> 0) & 0x00ffffff;
  return '#' + rgb.toString(16).padStart(6, '0');
}

export function parseRulesGroups(filePath: string): BZSScheduleGroup[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  const groups: BZSScheduleGroup[] = [];

  // Line 1: table name (skip)
  // Line 2: column names
  // Line 3: column types (skip)
  // Line 4+: data rows
  if (lines.length < 4) return groups;

  const headers = lines[1].split('\t').map((h) => h.trim());
  const col = (name: string): number => headers.indexOf(name);

  for (let i = 3; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') continue;

    const values = line.split('\t');
    const get = (colName: string): string => {
      const idx = col(colName);
      return idx >= 0 ? (values[idx] ?? '').trim() : '';
    };

    const enableStr = get('Enable');
    const orderStr = get('Order');

    groups.push({
      name: get('Name'),
      enabled: enableStr === 'True',
      color: netColorToHex(get('Color')),
      foreColor: netColorToHex(get('ForeColor')),
      id: get('ID'),
      dateInfo: get('DateInfo'),
      order: orderStr ? parseFloat(orderStr) || 0 : 0,
    });
  }

  return groups;
}

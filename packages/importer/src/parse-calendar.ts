import * as fs from 'fs';

export interface BZSCalendarEntry {
  julianDay: number;
  groupId: string;
}

/**
 * Parses a CalendarFile.dat file.
 *
 * Format:
 *   Line 1: `<Table Name:>Cal`
 *   Line 2: Tab-separated column headers (JD, Group)
 *   Line 3: Tab-separated column types (String, String)
 *   Line 4+: Tab-separated data rows
 */
export function parseCalendarFile(filePath: string): BZSCalendarEntry[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  const entries: BZSCalendarEntry[] = [];

  if (lines.length < 4) return entries;

  const headers = lines[1].split('\t').map((h) => h.trim());
  const jdCol = headers.indexOf('JD');
  const groupCol = headers.indexOf('Group');

  for (let i = 3; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') continue;

    const values = line.split('\t');
    const jdStr = jdCol >= 0 ? (values[jdCol] ?? '') : '';
    const jd = parseInt(jdStr, 10);
    if (isNaN(jd)) continue;

    entries.push({
      julianDay: jd,
      groupId: groupCol >= 0 ? (values[groupCol] ?? '').trim() : '',
    });
  }

  return entries;
}

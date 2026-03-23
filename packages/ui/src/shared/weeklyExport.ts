/**
 * Multi-week schedule export.
 *
 * Generates a CSV table of events across N weeks with parsha headers,
 * customizable axis orientation, and date display options.
 */

import { downloadCsv } from './csvImportExport';

export interface WeeklyExportConfig {
  /** Number of weeks to export */
  weeks: number;
  /** Group IDs to include (empty = all) */
  groupIds: string[];
  /** Which axis has the parsha/week: 'columns' (X) or 'rows' (Y) */
  parshaAxis: 'columns' | 'rows';
  /** Where event names appear: 'left' or 'right' (only matters when parshaAxis='columns') */
  eventNamesPosition: 'left' | 'right';
  /** Show the Gregorian date alongside the parsha */
  showDate: boolean;
  /** Which day to show as the date for each week */
  dateDay: 'sunday' | 'shabbos';
  /** Start date (defaults to next Sunday) */
  startDate?: string;
}

export interface WeekData {
  /** Parsha name (Hebrew or English) */
  parsha: string;
  /** Gregorian date string for the chosen day */
  date: string;
  /** Map of event name → computed time string */
  eventTimes: Record<string, string>;
}

export interface ExportableEvent {
  name: string;
  id: string;
}

function escapeCsvField(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function rowToCsv(fields: string[]): string {
  return fields.map(escapeCsvField).join(',');
}

/**
 * Build the CSV content from week data.
 */
export function buildWeeklyExportCsv(
  config: WeeklyExportConfig,
  weeks: WeekData[],
  eventNames: string[],
): string {
  const lines: string[] = [];

  if (config.parshaAxis === 'columns') {
    // Weeks as columns, events as rows
    const headerRow = config.eventNamesPosition === 'left'
      ? ['Event', ...weeks.map((w) => config.showDate ? `${w.parsha} (${w.date})` : w.parsha)]
      : [...weeks.map((w) => config.showDate ? `${w.parsha} (${w.date})` : w.parsha), 'Event'];

    lines.push(rowToCsv(headerRow));

    for (const evName of eventNames) {
      const times = weeks.map((w) => w.eventTimes[evName] ?? '');
      const row = config.eventNamesPosition === 'left'
        ? [evName, ...times]
        : [...times, evName];
      lines.push(rowToCsv(row));
    }
  } else {
    // Weeks as rows, events as columns
    const headerRow = ['Parsha', ...(config.showDate ? ['Date'] : []), ...eventNames];
    lines.push(rowToCsv(headerRow));

    for (const w of weeks) {
      const times = eventNames.map((evName) => w.eventTimes[evName] ?? '');
      const row = [w.parsha, ...(config.showDate ? [w.date] : []), ...times];
      lines.push(rowToCsv(row));
    }
  }

  return lines.join('\n');
}

export function downloadWeeklyExport(
  config: WeeklyExportConfig,
  weeks: WeekData[],
  eventNames: string[],
): void {
  const csv = buildWeeklyExportCsv(config, weeks, eventNames);
  downloadCsv(csv, `schedule-export-${config.weeks}wk-${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * Get the next occurrence of a given day of week from a start date.
 * dayOfWeek: 0=Sunday, 6=Saturday
 */
export function getNextDayOfWeek(from: Date, dayOfWeek: number): Date {
  const d = new Date(from);
  const diff = (dayOfWeek - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + (diff === 0 ? 0 : diff));
  return d;
}

export function formatDateYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDateDisplay(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

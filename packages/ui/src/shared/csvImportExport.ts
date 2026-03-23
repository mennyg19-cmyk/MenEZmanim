/**
 * CSV import / export for Groups and Events (MinyanSchedule).
 *
 * The sample files show every possible column with realistic example data
 * so users can see exactly how to fill them in.
 */

import type { VisibilityCondition, VisibilityRule } from '@zmanim-app/core';

// ── Types (mirrors store-types) ──────────────────────────────────────

export interface CsvGroup {
  id: string;
  name: string;
  nameHebrew: string;
  color: string;
  sortOrder: number;
  active: boolean;
}

export interface CsvSchedule {
  id: string;
  name: string;
  type: string;
  groupId?: string;
  timeMode?: 'fixed' | 'dynamic';
  fixedTime?: string;
  baseZman?: string;
  offset?: number;
  roundTo?: number;
  roundMode?: 'nearest' | 'before' | 'after';
  limitBefore?: string;
  limitAfter?: string;
  durationMinutes?: number;
  daysActive?: boolean[];
  visibilityRules?: VisibilityRule[];
  room?: string;
  sortOrder?: number;
  isPlaceholder?: boolean;
  placeholderLabel?: string;
}

// ── CSV helpers ──────────────────────────────────────────────────────

function escapeCsvField(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function rowToCsv(fields: string[]): string {
  return fields.map(escapeCsvField).join(',');
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

function parseCsvText(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (vals[idx] ?? '').trim();
    });
    rows.push(row);
  }
  return rows;
}

// ── Days helpers ─────────────────────────────────────────────────────

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Shabbos'];

function daysToString(days?: boolean[]): string {
  if (!days || days.length < 7) return DAY_NAMES.join(';');
  return days.map((d, i) => d ? DAY_NAMES[i] : '').filter(Boolean).join(';');
}

function parseDays(val: string): boolean[] | undefined {
  if (!val || val.toLowerCase() === 'all') return [true, true, true, true, true, true, true];
  const lower = val.toLowerCase();
  return DAY_NAMES.map((d) => lower.includes(d.toLowerCase()));
}

// ── Visibility rules helpers ─────────────────────────────────────────

function rulesToString(rules?: VisibilityRule[]): string {
  if (!rules || rules.length === 0) return '';
  return rules.map((r) => `${r.show ? 'show' : 'hide'}:${r.condition}`).join(';');
}

function parseRules(val: string): VisibilityRule[] {
  if (!val) return [];
  return val.split(';').map((part) => {
    const [action, condition] = part.trim().split(':');
    return {
      show: action?.toLowerCase() !== 'hide',
      condition: (condition ?? 'weekday') as VisibilityCondition,
    };
  }).filter((r) => r.condition);
}

// ── GROUPS ───────────────────────────────────────────────────────────

const GROUP_HEADERS = ['id', 'name', 'nameHebrew', 'color', 'sortOrder', 'active'];

const SAMPLE_GROUPS: CsvGroup[] = [
  { id: 'group-main', name: 'Main Minyan', nameHebrew: 'מנין ראשי', color: '#3b82f6', sortOrder: 0, active: true },
  { id: 'group-early', name: 'Early Minyan', nameHebrew: 'מנין ותיקין', color: '#10b981', sortOrder: 1, active: true },
  { id: 'group-late', name: 'Late Minyan', nameHebrew: 'מנין מאוחר', color: '#f59e0b', sortOrder: 2, active: true },
  { id: 'group-youth', name: 'Youth Minyan', nameHebrew: 'מנין נוער', color: '#8b5cf6', sortOrder: 3, active: false },
];

function groupToRow(g: CsvGroup): string[] {
  return [g.id, g.name, g.nameHebrew, g.color, String(g.sortOrder), g.active ? 'TRUE' : 'FALSE'];
}

export function generateGroupsSampleCsv(): string {
  const lines = [
    '# GROUPS IMPORT — Fill in your groups below. Delete the sample rows and add your own.',
    '# id: unique identifier (leave blank to auto-generate)',
    '# name: English name',
    '# nameHebrew: Hebrew name',
    '# color: hex color (e.g. #3b82f6)',
    '# sortOrder: display order (0 = first)',
    '# active: TRUE or FALSE',
    '',
    rowToCsv(GROUP_HEADERS),
    ...SAMPLE_GROUPS.map((g) => rowToCsv(groupToRow(g))),
  ];
  return lines.join('\n');
}

export function parseGroupsCsv(text: string): CsvGroup[] {
  const cleaned = text.split('\n').filter((l) => !l.trimStart().startsWith('#')).join('\n');
  const rows = parseCsvText(cleaned);
  return rows.map((r, i) => ({
    id: r.id || `group-import-${Date.now()}-${i}`,
    name: r.name || 'Unnamed Group',
    nameHebrew: r.nameHebrew || r.name || 'קבוצה',
    color: r.color || '#3b82f6',
    sortOrder: parseInt(r.sortOrder) || i,
    active: r.active?.toUpperCase() !== 'FALSE',
  }));
}

export function exportGroupsCsv(groups: CsvGroup[]): string {
  const lines = [
    rowToCsv(GROUP_HEADERS),
    ...groups.map((g) => rowToCsv(groupToRow(g))),
  ];
  return lines.join('\n');
}

// ── EVENTS (SCHEDULES) ──────────────────────────────────────────────

const EVENT_HEADERS = [
  'id', 'name', 'type', 'groupId',
  'timeMode', 'fixedTime', 'baseZman', 'offset',
  'roundTo', 'roundMode', 'limitBefore', 'limitAfter',
  'durationMinutes', 'days', 'visibilityRules',
  'room', 'sortOrder', 'isPlaceholder', 'placeholderLabel',
];

const SAMPLE_EVENTS: CsvSchedule[] = [
  {
    id: 'ev-shacharit-main', name: 'Shacharis', type: 'Shacharit', groupId: 'group-main',
    timeMode: 'fixed', fixedTime: '07:00',
    daysActive: [true, true, true, true, true, true, false],
    room: 'Main Sanctuary', sortOrder: 0,
  },
  {
    id: 'ev-shacharit-shabbos', name: 'Shacharis Shabbos', type: 'Shacharit', groupId: 'group-main',
    timeMode: 'fixed', fixedTime: '08:30',
    daysActive: [false, false, false, false, false, false, true],
    visibilityRules: [{ condition: 'shabbos', show: true }],
    room: 'Main Sanctuary', sortOrder: 1,
  },
  {
    id: 'ev-vasikin', name: 'Vasikin', type: 'Shacharit', groupId: 'group-early',
    timeMode: 'dynamic', baseZman: 'netz', offset: -30, roundTo: 5, roundMode: 'before',
    limitBefore: '05:00', limitAfter: '07:00',
    daysActive: [true, true, true, true, true, true, true],
    room: 'Beis Medrash', sortOrder: 2,
  },
  {
    id: 'ev-mincha', name: 'Mincha', type: 'Mincha', groupId: 'group-main',
    timeMode: 'dynamic', baseZman: 'shkia', offset: -15, roundTo: 5, roundMode: 'before',
    daysActive: [true, true, true, true, true, false, false],
    visibilityRules: [{ condition: 'weekday', show: true }],
    room: 'Main Sanctuary', sortOrder: 3, durationMinutes: 15,
  },
  {
    id: 'ev-mincha-erev-shabbos', name: 'Mincha Erev Shabbos', type: 'Mincha', groupId: 'group-main',
    timeMode: 'dynamic', baseZman: 'shkia', offset: -20, roundTo: 5, roundMode: 'before',
    daysActive: [false, false, false, false, false, true, false],
    visibilityRules: [{ condition: 'erev_shabbos', show: true }],
    room: 'Main Sanctuary', sortOrder: 4,
  },
  {
    id: 'ev-maariv', name: 'Maariv', type: 'Maariv', groupId: 'group-main',
    timeMode: 'dynamic', baseZman: 'tzeit', offset: 0, roundTo: 5, roundMode: 'nearest',
    daysActive: [true, true, true, true, true, true, true],
    visibilityRules: [{ condition: 'dst_on', show: true }],
    room: 'Main Sanctuary', sortOrder: 5,
  },
  {
    id: 'ev-maariv-winter', name: 'Maariv (Winter)', type: 'Maariv', groupId: 'group-late',
    timeMode: 'fixed', fixedTime: '20:00',
    daysActive: [true, true, true, true, true, false, false],
    visibilityRules: [{ condition: 'dst_off', show: true }],
    room: 'Main Sanctuary', sortOrder: 6,
  },
  {
    id: 'ev-spacer', name: '', type: 'Other', groupId: 'group-main',
    isPlaceholder: true, placeholderLabel: '--- Shiurim ---',
    daysActive: [true, true, true, true, true, true, true],
    sortOrder: 7,
  },
  {
    id: 'ev-daf-yomi', name: 'Daf Yomi', type: 'Other', groupId: 'group-main',
    timeMode: 'fixed', fixedTime: '06:00',
    daysActive: [true, true, true, true, true, true, true],
    visibilityRules: [{ condition: 'fast_day', show: false }],
    room: 'Beis Medrash', sortOrder: 8, durationMinutes: 45,
  },
];

function eventToRow(ev: CsvSchedule): string[] {
  return [
    ev.id,
    ev.name,
    ev.type,
    ev.groupId ?? '',
    ev.timeMode ?? '',
    ev.fixedTime ?? '',
    ev.baseZman ?? '',
    ev.offset != null ? String(ev.offset) : '',
    ev.roundTo != null ? String(ev.roundTo) : '',
    ev.roundMode ?? '',
    ev.limitBefore ?? '',
    ev.limitAfter ?? '',
    ev.durationMinutes != null ? String(ev.durationMinutes) : '',
    daysToString(ev.daysActive),
    rulesToString(ev.visibilityRules),
    ev.room ?? '',
    ev.sortOrder != null ? String(ev.sortOrder) : '',
    ev.isPlaceholder ? 'TRUE' : '',
    ev.placeholderLabel ?? '',
  ];
}

export function generateEventsSampleCsv(): string {
  const lines = [
    '# EVENTS IMPORT — Fill in your davening times / events below. Delete sample rows and add your own.',
    '# id: unique identifier (leave blank to auto-generate)',
    '# name: event name (e.g. Shacharis)',
    '# type: Shacharit | Mincha | Maariv | Other',
    '# groupId: must match a group id from the Groups sheet/import (leave blank for no group)',
    '# timeMode: fixed | dynamic',
    '# fixedTime: HH:MM in 24h format (for fixed mode)',
    '# baseZman: alos | netz | sofZmanShma | chatzos | minchaGedola | minchaKetana | plag | shkia | tzeit (for dynamic mode)',
    '# offset: minutes before (-) or after (+) the zman (for dynamic mode)',
    '# roundTo: round to nearest N minutes: 1 | 5 | 10 | 15 | 30 | 60',
    '# roundMode: nearest | before | after',
    '# limitBefore: earliest allowed time HH:MM (e.g. 05:00)',
    '# limitAfter: latest allowed time HH:MM (e.g. 20:00)',
    '# durationMinutes: how long the event lasts (optional)',
    '# days: semicolon-separated active days: Sun;Mon;Tue;Wed;Thu;Fri;Shabbos (or "all")',
    '# visibilityRules: semicolon-separated rules like show:weekday;hide:fast_day',
    '#   conditions: weekday | shabbos | chol_hamoed | yom_tov | fast_day | erev_shabbos | erev_chag | erev_pesach | chanukah | behab | rosh_chodesh | purim | dst_on | dst_off',
    '# room: room / location name (optional)',
    '# sortOrder: display order (0 = first)',
    '# isPlaceholder: TRUE for spacer/divider rows (optional)',
    '# placeholderLabel: label for spacer rows (optional)',
    '',
    rowToCsv(EVENT_HEADERS),
    ...SAMPLE_EVENTS.map((ev) => rowToCsv(eventToRow(ev))),
  ];
  return lines.join('\n');
}

export function parseEventsCsv(text: string): CsvSchedule[] {
  const cleaned = text.split('\n').filter((l) => !l.trimStart().startsWith('#')).join('\n');
  const rows = parseCsvText(cleaned);
  return rows.map((r, i) => {
    const isPlaceholder = r.isPlaceholder?.toUpperCase() === 'TRUE';
    const timeMode = (r.timeMode as 'fixed' | 'dynamic') || (r.baseZman ? 'dynamic' : 'fixed');
    return {
      id: r.id || `sched-import-${Date.now()}-${i}`,
      name: r.name || (isPlaceholder ? '' : 'Imported Event'),
      type: r.type || 'Other',
      groupId: r.groupId || undefined,
      timeMode,
      fixedTime: r.fixedTime || undefined,
      baseZman: r.baseZman || undefined,
      offset: r.offset ? parseInt(r.offset) : undefined,
      roundTo: r.roundTo ? parseInt(r.roundTo) : undefined,
      roundMode: (r.roundMode as 'nearest' | 'before' | 'after') || undefined,
      limitBefore: r.limitBefore || undefined,
      limitAfter: r.limitAfter || undefined,
      durationMinutes: r.durationMinutes ? parseInt(r.durationMinutes) : undefined,
      daysActive: parseDays(r.days ?? ''),
      visibilityRules: parseRules(r.visibilityRules ?? ''),
      room: r.room || undefined,
      sortOrder: r.sortOrder ? parseInt(r.sortOrder) : i,
      isPlaceholder,
      placeholderLabel: r.placeholderLabel || undefined,
    };
  });
}

export function exportEventsCsv(events: CsvSchedule[]): string {
  const lines = [
    rowToCsv(EVENT_HEADERS),
    ...events.map((ev) => rowToCsv(eventToRow(ev))),
  ];
  return lines.join('\n');
}

// ── Download helper ──────────────────────────────────────────────────

export function downloadCsv(content: string, filename: string): void {
  const bom = '\uFEFF';
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

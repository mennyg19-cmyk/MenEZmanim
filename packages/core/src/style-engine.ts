import { JewishCalendar } from 'kosher-zmanim';
import { ScheduleConfig, ScheduleContext, isScheduleActive } from './scheduler';

/** Public display layout bucket (orientation-aware). */
export type DisplayBreakpoint = 'mobile' | 'tablet' | 'full';

export type ScreenScheduleBreakpoint = DisplayBreakpoint | 'all';

export type DayType =
  | 'weekday'
  | 'shabbos'
  | 'erev_shabbos'
  | 'erev_yom_tov'
  | 'yom_tov'
  | 'chol_hamoed'
  | 'rosh_chodesh'
  | 'erev_pesach'
  | 'chanukah'
  | 'yom_kippur'
  | 'fast_day'
  | 'purim';

export const DAY_TYPE_OPTIONS: { value: DayType; label: string }[] = [
  { value: 'weekday', label: 'Weekday' },
  { value: 'shabbos', label: 'Shabbos' },
  { value: 'erev_shabbos', label: 'Erev Shabbos' },
  { value: 'erev_yom_tov', label: 'Erev Yom Tov' },
  { value: 'yom_tov', label: 'Yom Tov' },
  { value: 'chol_hamoed', label: 'Chol HaMoed' },
  { value: 'rosh_chodesh', label: 'Rosh Chodesh' },
  { value: 'erev_pesach', label: 'Erev Pesach' },
  { value: 'chanukah', label: 'Chanukah' },
  { value: 'yom_kippur', label: 'Yom Kippur' },
  { value: 'fast_day', label: 'Fast day' },
  { value: 'purim', label: 'Purim' },
];

export type StyleScheduleRule =
  | { type: 'default' }
  | {
      type: 'hebrew_date_range';
      startMonth: number;
      startDay: number;
      endMonth: number;
      endDay: number;
    }
  | {
      type: 'gregorian_date_range';
      startMonth: number;
      startDay: number;
      endMonth: number;
      endDay: number;
    }
  | { type: 'hebrew_month'; month: number }
  | { type: 'gregorian_month'; month: number }
  | { type: 'day_of_week'; days: number[] }
  | { type: 'day_type'; dayType: DayType }
  | { type: 'week_of_month'; week: number };

export interface ScreenStyleSchedule {
  id: string;
  styleId: string;
  breakpoint: ScreenScheduleBreakpoint;
  rules: StyleScheduleRule[];
  priority: number;
}

export enum DisplayObjectType {
  ZMANIM_TABLE = 'ZMANIM_TABLE',
  JEWISH_INFO = 'JEWISH_INFO',
  DIGITAL_CLOCK = 'DIGITAL_CLOCK',
  ANALOG_CLOCK = 'ANALOG_CLOCK',
  PLAIN_TEXT = 'PLAIN_TEXT',
  RICH_TEXT = 'RICH_TEXT',
  MEDIA_VIEWER = 'MEDIA_VIEWER',
  EVENTS_TABLE = 'EVENTS_TABLE',
  YAHRZEIT_DISPLAY = 'YAHRZEIT_DISPLAY',
  SCROLLING_TICKER = 'SCROLLING_TICKER',
  FIDS_BOARD = 'FIDS_BOARD',
  SEFIRA_COUNTER = 'SEFIRA_COUNTER',
  COUNTDOWN_TIMER = 'COUNTDOWN_TIMER',
  DATE_PICKER = 'DATE_PICKER',
}

export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FontStyle {
  family: string;
  size: number;
  bold: boolean;
  italic: boolean;
  color: string;
}

export interface DisplayObject {
  id: string;
  type: DisplayObjectType;
  name: string;
  position: Position;
  zIndex: number;
  font: FontStyle;
  backgroundColor: string;
  language: 'hebrew' | 'english' | 'yiddish';
  content: Record<string, any>;
  scheduleRules?: ScheduleConfig;
  scheduleGroupVisibility?: Record<string, boolean>;
  visible: boolean;
}

export interface StyleActivationRule {
  type: 'hebrew_date_range' | 'gregorian_date_range' | 'default';
  startMonth?: number;
  startDay?: number;
  endMonth?: number;
  endDay?: number;
}

export type CanvasBackgroundMode = 'solid' | 'gradient' | 'texture' | 'image';

export interface DisplayStyle {
  id: string;
  name: string;
  backgroundImage?: string;
  backgroundColor: string;
  /** When set, controls how the canvas is filled. If omitted, inferred from backgroundImage. */
  backgroundMode?: CanvasBackgroundMode;
  /** CSS gradient for canvas when backgroundMode is gradient */
  backgroundGradient?: string;
  /** Built-in texture id when backgroundMode is texture */
  backgroundTexture?: string;
  /** Decorative frame id for the full canvas (9-slice border) */
  backgroundFrameId?: string | null;
  /** Frame thickness multiplier (default 1.0) */
  backgroundFrameThickness?: number | null;
  canvasWidth: number;
  canvasHeight: number;
  objects: DisplayObject[];
  /**
   * Legacy: global style activation. Prefer `Screen.styleSchedules` for when a style applies per screen.
   * Kept for backward compatibility and `getActiveStyle` fallback.
   */
  activationRules: StyleActivationRule[];
  sortOrder: number;
}

export type DisplayNameOverrides = Record<string, {
  english?: string;
  hebrew?: string;
}>;

function gregorianDayOfYear(month: number, day: number): number {
  const daysInMonth = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let total = 0;
  for (let m = 1; m < month; m++) {
    total += daysInMonth[m];
  }
  return total + day;
}

function hebrewOrdinal(month: number, day: number): number {
  const ORDER: Record<number, number> = {
    7: 1,   // Tishrei
    8: 2,   // Cheshvan
    9: 3,   // Kislev
    10: 4,  // Teves
    11: 5,  // Shevat
    12: 6,  // Adar / Adar I
    13: 7,  // Adar II
    1: 8,   // Nissan
    2: 9,   // Iyar
    3: 10,  // Sivan
    4: 11,  // Tammuz
    5: 12,  // Av
    6: 13,  // Elul
  };
  return (ORDER[month] ?? month) * 100 + day;
}

function isGregorianRangeActive(
  rule: StyleActivationRule,
  gregMonth: number,
  gregDay: number,
): boolean {
  if (
    rule.startMonth === undefined || rule.startDay === undefined ||
    rule.endMonth === undefined || rule.endDay === undefined
  ) {
    return false;
  }

  const current = gregorianDayOfYear(gregMonth, gregDay);
  const start = gregorianDayOfYear(rule.startMonth, rule.startDay);
  const end = gregorianDayOfYear(rule.endMonth, rule.endDay);

  if (start <= end) {
    return current >= start && current <= end;
  }
  return current >= start || current <= end;
}

function isHebrewRangeActive(
  rule: StyleActivationRule,
  jewishMonth: number,
  jewishDay: number,
): boolean {
  if (
    rule.startMonth === undefined || rule.startDay === undefined ||
    rule.endMonth === undefined || rule.endDay === undefined
  ) {
    return false;
  }

  const current = hebrewOrdinal(jewishMonth, jewishDay);
  const start = hebrewOrdinal(rule.startMonth, rule.startDay);
  const end = hebrewOrdinal(rule.endMonth, rule.endDay);

  if (start <= end) {
    return current >= start && current <= end;
  }
  return current >= start || current <= end;
}

function isGregorianDateRangeMatch(
  startMonth: number,
  startDay: number,
  endMonth: number,
  endDay: number,
  gregMonth: number,
  gregDay: number,
): boolean {
  const current = gregorianDayOfYear(gregMonth, gregDay);
  const start = gregorianDayOfYear(startMonth, startDay);
  const end = gregorianDayOfYear(endMonth, endDay);
  if (start <= end) {
    return current >= start && current <= end;
  }
  return current >= start || current <= end;
}

function isHebrewDateRangeMatch(
  startMonth: number,
  startDay: number,
  endMonth: number,
  endDay: number,
  jewishMonth: number,
  jewishDay: number,
): boolean {
  const current = hebrewOrdinal(jewishMonth, jewishDay);
  const start = hebrewOrdinal(startMonth, startDay);
  const end = hebrewOrdinal(endMonth, endDay);
  if (start <= end) {
    return current >= start && current <= end;
  }
  return current >= start || current <= end;
}

function weekOfMonthFromDate(d: Date): number {
  return Math.floor((d.getDate() - 1) / 7) + 1;
}

/**
 * Evaluate calendar day-type conditions for screen style scheduling.
 * Uses kosher-zmanim JewishCalendar (1=Nissan … 12=Adar, 13=Adar II).
 */
export function evaluateDayType(dayType: DayType, date: Date, jCal: JewishCalendar): boolean {
  const dow = date.getDay();
  const m = jCal.getJewishMonth();
  const day = jCal.getJewishDayOfMonth();

  switch (dayType) {
    case 'weekday':
      return dow >= 0 && dow <= 4 && !jCal.isYomTov() && !jCal.isCholHamoed();
    case 'shabbos':
      return dow === 6;
    case 'erev_shabbos':
      return dow === 5;
    case 'erev_yom_tov':
      return jCal.isErevYomTov();
    case 'yom_tov':
      return jCal.isYomTov();
    case 'chol_hamoed':
      return jCal.isCholHamoed();
    case 'rosh_chodesh':
      return jCal.isRoshChodesh();
    case 'erev_pesach':
      return m === 1 && day === 14;
    case 'chanukah':
      return jCal.isChanukah();
    case 'yom_kippur':
      return m === 7 && day === 10;
    case 'fast_day':
      return jCal.isTaanis();
    case 'purim':
      return (
        (m === 12 && (day === 14 || day === 15)) ||
        (m === 13 && (day === 14 || day === 15))
      );
    default:
      return false;
  }
}

export function evaluateStyleScheduleRule(rule: StyleScheduleRule, date: Date, jCal: JewishCalendar): boolean {
  const gregMonth = date.getMonth() + 1;
  const gregDay = date.getDate();
  const jewishMonth = jCal.getJewishMonth();
  const jewishDay = jCal.getJewishDayOfMonth();

  switch (rule.type) {
    case 'default':
      return true;
    case 'gregorian_date_range':
      return isGregorianDateRangeMatch(
        rule.startMonth,
        rule.startDay,
        rule.endMonth,
        rule.endDay,
        gregMonth,
        gregDay,
      );
    case 'hebrew_date_range':
      return isHebrewDateRangeMatch(
        rule.startMonth,
        rule.startDay,
        rule.endMonth,
        rule.endDay,
        jewishMonth,
        jewishDay,
      );
    case 'gregorian_month':
      return gregMonth === rule.month;
    case 'hebrew_month':
      return jewishMonth === rule.month;
    case 'day_of_week':
      return rule.days.includes(date.getDay());
    case 'day_type':
      return evaluateDayType(rule.dayType, date, jCal);
    case 'week_of_month':
      return weekOfMonthFromDate(date) === rule.week;
    default:
      return false;
  }
}

/** All rules in an entry must match (AND). Empty rules never match. */
export function evaluateStyleScheduleRules(rules: StyleScheduleRule[], date: Date): boolean {
  if (rules.length === 0) return false;
  const jCal = new JewishCalendar(date);
  return rules.every((r) => evaluateStyleScheduleRule(r, date, jCal));
}

export function parseScreenStyleSchedulesJson(raw: string | null | undefined): ScreenStyleSchedule[] | null {
  if (raw == null || raw === '') return null;
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return null;
    return v as ScreenStyleSchedule[];
  } catch {
    return null;
  }
}

function styleActivationRuleToScheduleRule(rule: StyleActivationRule): StyleScheduleRule | null {
  if (rule.type === 'default') return { type: 'default' };
  if (rule.type === 'gregorian_date_range' &&
    rule.startMonth != null && rule.startDay != null && rule.endMonth != null && rule.endDay != null) {
    return {
      type: 'gregorian_date_range',
      startMonth: rule.startMonth,
      startDay: rule.startDay,
      endMonth: rule.endMonth,
      endDay: rule.endDay,
    };
  }
  if (rule.type === 'hebrew_date_range' &&
    rule.startMonth != null && rule.startDay != null && rule.endMonth != null && rule.endDay != null) {
    return {
      type: 'hebrew_date_range',
      startMonth: rule.startMonth,
      startDay: rule.startDay,
      endMonth: rule.endMonth,
      endDay: rule.endDay,
    };
  }
  return null;
}

/**
 * Build effective screen schedules: DB JSON, or migrate from legacy assignedStyleId + style activation rules.
 */
export function resolveScreenStyleSchedules(
  styleSchedulesJson: string | null | undefined,
  assignedStyleId: string | null | undefined,
  styles: DisplayStyle[],
): ScreenStyleSchedule[] {
  const parsed = parseScreenStyleSchedulesJson(styleSchedulesJson);
  if (parsed && parsed.length > 0) {
    return parsed;
  }

  if (!assignedStyleId) {
    return [];
  }

  const style = styles.find((s) => s.id === assignedStyleId);
  const rules = style?.activationRules ?? [{ type: 'default' as const }];
  const specific = rules.filter((r) => r.type !== 'default');
  const hasDefault = rules.some((r) => r.type === 'default');

  const out: ScreenStyleSchedule[] = [];
  let p = 0;
  for (const ar of specific) {
    const sr = styleActivationRuleToScheduleRule(ar);
    if (sr && sr.type !== 'default') {
      out.push({
        id: `mig-${assignedStyleId}-${p}`,
        styleId: assignedStyleId,
        breakpoint: 'all',
        rules: [sr],
        priority: p++,
      });
    }
  }
  if (hasDefault) {
    out.push({
      id: `mig-${assignedStyleId}-def`,
      styleId: assignedStyleId,
      breakpoint: 'all',
      rules: [{ type: 'default' }],
      priority: p,
    });
  }
  if (out.length === 0) {
    out.push({
      id: `mig-${assignedStyleId}-fallback`,
      styleId: assignedStyleId,
      breakpoint: 'all',
      rules: [{ type: 'default' }],
      priority: 0,
    });
  }
  return out;
}

export function orderedScreenSchedulesForBreakpoint(
  schedules: ScreenStyleSchedule[],
  breakpoint: DisplayBreakpoint,
): ScreenStyleSchedule[] {
  const specific = schedules
    .filter((s) => s.breakpoint === breakpoint)
    .sort((a, b) => a.priority - b.priority);
  const allBp = schedules
    .filter((s) => s.breakpoint === 'all')
    .sort((a, b) => a.priority - b.priority);
  return [...specific, ...allBp];
}

function isStyleActiveForDate(
  style: DisplayStyle,
  gregMonth: number,
  gregDay: number,
  jewishMonth: number,
  jewishDay: number,
): 'match' | 'default' | 'none' {
  let hasDefault = false;
  let hasSpecific = false;

  for (const rule of style.activationRules) {
    if (rule.type === 'default') {
      hasDefault = true;
      continue;
    }

    hasSpecific = true;
    if (rule.type === 'gregorian_date_range' && isGregorianRangeActive(rule, gregMonth, gregDay)) {
      return 'match';
    }
    if (rule.type === 'hebrew_date_range' && isHebrewRangeActive(rule, jewishMonth, jewishDay)) {
      return 'match';
    }
  }

  if (!hasSpecific && hasDefault) return 'default';
  if (hasDefault) return 'default';
  return 'none';
}

export function getActiveStyle(
  styles: DisplayStyle[],
  date: Date,
  _inIsrael: boolean,
): DisplayStyle | null {
  if (styles.length === 0) return null;

  const jCal = new JewishCalendar(date);
  const gregMonth = date.getMonth() + 1;
  const gregDay = date.getDate();
  const jewishMonth = jCal.getJewishMonth();
  const jewishDay = jCal.getJewishDayOfMonth();

  const sorted = [...styles].sort((a, b) => a.sortOrder - b.sortOrder);

  let defaultStyle: DisplayStyle | null = null;

  for (const style of sorted) {
    const result = isStyleActiveForDate(style, gregMonth, gregDay, jewishMonth, jewishDay);
    if (result === 'match') return style;
    if (result === 'default' && defaultStyle === null) {
      defaultStyle = style;
    }
  }

  return defaultStyle;
}

export function getVisibleObjects(
  style: DisplayStyle,
  context: ScheduleContext,
): DisplayObject[] {
  return style.objects.filter(obj => {
    if (!obj.visible) return false;

    if (obj.scheduleRules && obj.scheduleRules.rules.length > 0) {
      if (!isScheduleActive(obj.scheduleRules, context)) return false;
    }

    if (obj.scheduleGroupVisibility) {
      const entries = Object.entries(obj.scheduleGroupVisibility);
      if (entries.length > 0) {
        const hasActiveVisibleGroup = entries.some(
          ([groupId, shouldShow]) => shouldShow && context.activeGroupIds.has(groupId),
        );
        if (!hasActiveVisibleGroup) return false;
      }
    }

    return true;
  });
}

export function sortObjectsByLayer(objects: DisplayObject[]): DisplayObject[] {
  return [...objects].sort((a, b) => a.zIndex - b.zIndex);
}

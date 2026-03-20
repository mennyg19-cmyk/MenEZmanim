import { JewishCalendar } from 'kosher-zmanim';

export type ScheduleRuleType =
  | 'gregorian_range'
  | 'hebrew_range'
  | 'day_of_week'
  | 'time_range'
  | 'dst_aware'
  | 'zman_trigger'
  | 'group_trigger'
  | 'recurring'
  | 'one_time'
  | 'always';

export interface GregorianRangeRule {
  type: 'gregorian_range';
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  startYear?: number;
  endYear?: number;
}

export interface HebrewRangeRule {
  type: 'hebrew_range';
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  startYear?: number;
  endYear?: number;
}

export interface DayOfWeekRule {
  type: 'day_of_week';
  mask: string;
}

export interface TimeRangeRule {
  type: 'time_range';
  startTime: string;
  endTime: string;
}

export interface DstAwareRule {
  type: 'dst_aware';
  showDuring: 'dst' | 'standard' | 'both';
}

export interface ZmanTriggerRule {
  type: 'zman_trigger';
  zmanType: string;
  offsetMinutes: number;
  showBefore: boolean;
}

export interface GroupTriggerRule {
  type: 'group_trigger';
  groupIds: string[];
  showWhenActive: boolean;
}

export interface RecurringRule {
  type: 'recurring';
  frequency: 'daily' | 'weekly' | 'monthly_gregorian' | 'monthly_hebrew' | 'yearly_gregorian' | 'yearly_hebrew';
  interval: number;
  dayOfMonth?: number;
  monthOfYear?: number;
}

export interface OneTimeRule {
  type: 'one_time';
  date: string;
}

export interface AlwaysRule {
  type: 'always';
}

export type ScheduleRule =
  | GregorianRangeRule | HebrewRangeRule | DayOfWeekRule | TimeRangeRule
  | DstAwareRule | ZmanTriggerRule | GroupTriggerRule | RecurringRule
  | OneTimeRule | AlwaysRule;

export interface ScheduleConfig {
  rules: ScheduleRule[];
  combineMode: 'all' | 'any';
}

export interface ScheduleContext {
  currentTime: Date;
  zmanimTimes: Map<string, Date | null>;
  activeGroupIds: Set<string>;
  isDST: boolean;
  jewishDate: { year: number; month: number; day: number };
  timezone: string;
}

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(':').map(Number);
  return { hours: h, minutes: m };
}

function toMinutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function gregorianDayOfYear(month: number, day: number): number {
  const daysInMonth = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let total = 0;
  for (let m = 1; m < month; m++) {
    total += daysInMonth[m];
  }
  return total + day;
}

/**
 * Linearize a Hebrew month/day into a comparable integer.
 * kosher-zmanim uses 1=Nissan..12=Adar, 13=Adar II.
 * The Jewish year starts at Tishrei (month 7). We remap so
 * Tishrei=1, Cheshvan=2, ... Elul=12/13 for comparison.
 */
function hebrewOrdinal(month: number, day: number): number {
  const ORDER: Record<number, number> = {
    7: 1,   // Tishrei
    8: 2,   // Cheshvan
    9: 3,   // Kislev
    10: 4,  // Teves
    11: 5,  // Shevat
    12: 6,  // Adar (or Adar I in leap year)
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

function evaluateGregorianRange(rule: GregorianRangeRule, ctx: ScheduleContext): boolean {
  const d = ctx.currentTime;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();

  if (rule.startYear !== undefined && year < rule.startYear) return false;
  if (rule.endYear !== undefined && year > rule.endYear) return false;

  const current = gregorianDayOfYear(month, day);
  const start = gregorianDayOfYear(rule.startMonth, rule.startDay);
  const end = gregorianDayOfYear(rule.endMonth, rule.endDay);

  if (start <= end) {
    return current >= start && current <= end;
  }
  // Wraps around year boundary (e.g., Nov-Feb)
  return current >= start || current <= end;
}

function evaluateHebrewRange(rule: HebrewRangeRule, ctx: ScheduleContext): boolean {
  const { year, month, day } = ctx.jewishDate;

  if (rule.startYear !== undefined && year < rule.startYear) return false;
  if (rule.endYear !== undefined && year > rule.endYear) return false;

  const current = hebrewOrdinal(month, day);
  const start = hebrewOrdinal(rule.startMonth, rule.startDay);
  const end = hebrewOrdinal(rule.endMonth, rule.endDay);

  if (start <= end) {
    return current >= start && current <= end;
  }
  return current >= start || current <= end;
}

function evaluateDayOfWeek(rule: DayOfWeekRule, ctx: ScheduleContext): boolean {
  const dayIndex = ctx.currentTime.getDay(); // 0=Sunday
  if (rule.mask.length !== 7) return false;
  return rule.mask[dayIndex] === '1';
}

function evaluateTimeRange(rule: TimeRangeRule, ctx: ScheduleContext): boolean {
  const current = toMinutesSinceMidnight(ctx.currentTime);
  const start = parseTime(rule.startTime);
  const end = parseTime(rule.endTime);
  const startMin = start.hours * 60 + start.minutes;
  const endMin = end.hours * 60 + end.minutes;

  if (startMin <= endMin) {
    return current >= startMin && current <= endMin;
  }
  // Crosses midnight (e.g., 23:00 - 02:00)
  return current >= startMin || current <= endMin;
}

function evaluateDstAware(rule: DstAwareRule, ctx: ScheduleContext): boolean {
  if (rule.showDuring === 'both') return true;
  if (rule.showDuring === 'dst') return ctx.isDST;
  return !ctx.isDST;
}

function evaluateZmanTrigger(rule: ZmanTriggerRule, ctx: ScheduleContext): boolean {
  const zmanTime = ctx.zmanimTimes.get(rule.zmanType);
  if (!zmanTime) return false;

  const adjustedZman = new Date(zmanTime.getTime() + rule.offsetMinutes * 60_000);
  if (rule.showBefore) {
    return ctx.currentTime.getTime() < adjustedZman.getTime();
  }
  return ctx.currentTime.getTime() >= adjustedZman.getTime();
}

function evaluateGroupTrigger(rule: GroupTriggerRule, ctx: ScheduleContext): boolean {
  const anyActive = rule.groupIds.some(id => ctx.activeGroupIds.has(id));
  return rule.showWhenActive ? anyActive : !anyActive;
}

function evaluateRecurring(rule: RecurringRule, ctx: ScheduleContext): boolean {
  const d = ctx.currentTime;

  switch (rule.frequency) {
    case 'daily':
      return true;

    case 'weekly': {
      const dayOfWeek = d.getDay();
      return dayOfWeek % (rule.interval || 1) === 0;
    }

    case 'monthly_gregorian': {
      const targetDay = rule.dayOfMonth ?? 1;
      if (d.getDate() !== targetDay) return false;
      if (rule.interval <= 1) return true;
      const month = d.getMonth();
      return month % rule.interval === 0;
    }

    case 'monthly_hebrew': {
      const targetDay = rule.dayOfMonth ?? 1;
      if (ctx.jewishDate.day !== targetDay) return false;
      if (rule.interval <= 1) return true;
      return (ctx.jewishDate.month - 1) % rule.interval === 0;
    }

    case 'yearly_gregorian': {
      const targetMonth = rule.monthOfYear ?? 1;
      const targetDay = rule.dayOfMonth ?? 1;
      return (d.getMonth() + 1) === targetMonth && d.getDate() === targetDay;
    }

    case 'yearly_hebrew': {
      const targetMonth = rule.monthOfYear ?? 7; // default Tishrei
      const targetDay = rule.dayOfMonth ?? 1;
      return ctx.jewishDate.month === targetMonth && ctx.jewishDate.day === targetDay;
    }
  }

  return false;
}

function evaluateOneTime(rule: OneTimeRule, ctx: ScheduleContext): boolean {
  const target = new Date(rule.date);
  const d = ctx.currentTime;
  return (
    d.getFullYear() === target.getFullYear() &&
    d.getMonth() === target.getMonth() &&
    d.getDate() === target.getDate()
  );
}

function evaluateRule(rule: ScheduleRule, ctx: ScheduleContext): boolean {
  switch (rule.type) {
    case 'gregorian_range': return evaluateGregorianRange(rule, ctx);
    case 'hebrew_range': return evaluateHebrewRange(rule, ctx);
    case 'day_of_week': return evaluateDayOfWeek(rule, ctx);
    case 'time_range': return evaluateTimeRange(rule, ctx);
    case 'dst_aware': return evaluateDstAware(rule, ctx);
    case 'zman_trigger': return evaluateZmanTrigger(rule, ctx);
    case 'group_trigger': return evaluateGroupTrigger(rule, ctx);
    case 'recurring': return evaluateRecurring(rule, ctx);
    case 'one_time': return evaluateOneTime(rule, ctx);
    case 'always': return true;
  }
}

export function isScheduleActive(config: ScheduleConfig, context: ScheduleContext): boolean {
  if (config.rules.length === 0) {
    return true;
  }

  if (config.combineMode === 'all') {
    return config.rules.every(rule => evaluateRule(rule, context));
  }
  return config.rules.some(rule => evaluateRule(rule, context));
}

// ── Visibility condition evaluation for events ─────────────

export type VisibilityCondition =
  | 'weekday' | 'shabbos' | 'chol_hamoed' | 'yom_tov'
  | 'fast_day' | 'erev_shabbos' | 'erev_chag' | 'erev_pesach'
  | 'chanukah' | 'behab' | 'rosh_chodesh' | 'purim'
  | 'dst_on' | 'dst_off';

export interface VisibilityRule {
  condition: VisibilityCondition;
  show: boolean;
}

export function evaluateVisibilityCondition(
  condition: VisibilityCondition,
  date: Date,
  isDST: boolean,
): boolean {
  const jCal = new JewishCalendar(date);
  const dow = date.getDay(); // 0=Sun..6=Sat

  switch (condition) {
    case 'weekday':
      return dow >= 0 && dow <= 4 && !jCal.isYomTov() && !jCal.isCholHamoed();
    case 'shabbos':
      return dow === 6;
    case 'chol_hamoed':
      return jCal.isCholHamoed();
    case 'yom_tov':
      return jCal.isYomTov();
    case 'fast_day':
      return jCal.isTaanis();
    case 'erev_shabbos':
      return dow === 5;
    case 'erev_chag':
      return jCal.isErevYomTov();
    case 'erev_pesach': {
      return jCal.getJewishMonth() === 1 && jCal.getJewishDayOfMonth() === 14;
    }
    case 'chanukah':
      return jCal.isChanukah();
    case 'behab': {
      const month = jCal.getJewishMonth();
      const day = jCal.getJewishDayOfMonth();
      const isMC = (month === 8 || month === 2); // Cheshvan or Iyar
      if (!isMC) return false;
      return (dow === 1 || dow === 4) && day >= 1 && day <= 21;
    }
    case 'rosh_chodesh':
      return jCal.isRoshChodesh();
    case 'purim': {
      const month = jCal.getJewishMonth();
      const day = jCal.getJewishDayOfMonth();
      return (month === 12 && day === 14) || (month === 12 && day === 15) || (month === 13 && day === 14) || (month === 13 && day === 15);
    }
    case 'dst_on':
      return isDST;
    case 'dst_off':
      return !isDST;
  }
}

export function evaluateVisibilityRules(
  rules: VisibilityRule[],
  date: Date,
  isDST: boolean,
): boolean {
  if (rules.length === 0) return true;
  for (const rule of rules) {
    const conditionMet = evaluateVisibilityCondition(rule.condition, date, isDST);
    if (conditionMet && !rule.show) return false;
    if (!conditionMet && rule.show) return false;
  }
  return true;
}

export const VISIBILITY_CONDITIONS: { value: VisibilityCondition; label: string; labelHe: string }[] = [
  { value: 'weekday', label: 'Weekday', labelHe: 'יום חול' },
  { value: 'shabbos', label: 'Shabbos', labelHe: 'שבת' },
  { value: 'chol_hamoed', label: 'Chol HaMoed', labelHe: 'חול המועד' },
  { value: 'yom_tov', label: 'Yom Tov (Chag)', labelHe: 'יום טוב' },
  { value: 'fast_day', label: 'Fast Day', labelHe: 'תענית' },
  { value: 'erev_shabbos', label: 'Erev Shabbos', labelHe: 'ערב שבת' },
  { value: 'erev_chag', label: 'Erev Chag', labelHe: 'ערב חג' },
  { value: 'erev_pesach', label: 'Erev Pesach', labelHe: 'ערב פסח' },
  { value: 'chanukah', label: 'Chanukah', labelHe: 'חנוכה' },
  { value: 'behab', label: 'BaHaB Days', labelHe: 'בה"ב' },
  { value: 'rosh_chodesh', label: 'Rosh Chodesh', labelHe: 'ראש חודש' },
  { value: 'purim', label: 'Purim', labelHe: 'פורים' },
  { value: 'dst_on', label: 'DST (Summer Time)', labelHe: 'שעון קיץ' },
  { value: 'dst_off', label: 'Standard Time (Winter)', labelHe: 'שעון חורף' },
];

export function buildScheduleContext(
  date: Date,
  timezone: string,
  zmanimTimes: Map<string, Date | null>,
  activeGroupIds: Set<string>,
): ScheduleContext {
  const jCal = new JewishCalendar(date);

  const jan1 = new Date(date.getFullYear(), 0, 1);
  const jul1 = new Date(date.getFullYear(), 6, 1);
  const stdOffset = Math.max(jan1.getTimezoneOffset(), jul1.getTimezoneOffset());
  const isDST = date.getTimezoneOffset() < stdOffset;

  return {
    currentTime: date,
    zmanimTimes,
    activeGroupIds,
    isDST,
    jewishDate: {
      year: jCal.getJewishYear(),
      month: jCal.getJewishMonth(),
      day: jCal.getJewishDayOfMonth(),
    },
    timezone,
  };
}

import { JewishCalendar } from 'kosher-zmanim';
import { ScheduleConfig, ScheduleContext, isScheduleActive } from './scheduler';

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
  backgroundFrameId?: string;
  canvasWidth: number;
  canvasHeight: number;
  objects: DisplayObject[];
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

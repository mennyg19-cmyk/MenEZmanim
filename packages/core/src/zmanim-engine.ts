import { GeoLocation, ComplexZmanimCalendar } from 'kosher-zmanim';
import { DateTime } from 'luxon';
import { HalachicAuthority, ZmanType } from './halachic-opinions';
import { getDailyRefraction } from './beezee-refraction';
import { getMaasehNisimZman, mnMinutesToDate, type MaasehNisimRow } from './maaseh-nisim-tables';

type LuxonDateTime = DateTime;

/**
 * Tukachinsky Alos: 20.32° below horizon at sea level.
 * Derived by optimizing against BeeZee's HaKotel board output across the full year.
 */
const TUKACHINSKY_ALOS_DEGREES = 20.32;

/**
 * Tukachinsky Tzais: 8.36° below horizon at sea level.
 * Derived by optimizing against BeeZee's HaKotel board output across the full year.
 */
const TUKACHINSKY_TZAIS_DEGREES = 8.36;

/**
 * Empirical correction table to compensate for the difference between
 * kosher-zmanim's NOAA solar algorithm and BeeZee's proprietary engine.
 * Each entry: [dayOfYear, alosCorrection_ms, tzaisCorrection_ms].
 * Corrections are interpolated between sample points.
 * Derived from 13 BeeZee board data points across 2026.
 */
const BEEZEE_CORRECTION_SAMPLES: [number, number, number][] = [
  [1,    6_000,     -6_000],     // Jan 1:  alos +0.1min, tzais -0.1min
  [15,   24_000,    -60_000],    // Jan 15: alos +0.4min, tzais -1.0min
  [32,   66_000,    -24_000],    // Feb 1:  alos +1.1min, tzais -0.4min
  [60,   84_000,    -90_000],    // Mar 1:  alos +1.4min, tzais -1.5min
  [91,   6_000,     -24_000],    // Apr 1:  alos +0.1min, tzais -0.4min
  [121,  72_000,    -12_000],    // May 1:  alos +1.2min, tzais -0.2min
  [152, -54_000,     30_000],    // Jun 1:  alos -0.9min, tzais +0.5min
  [182, -84_000,    120_000],    // Jul 1:  alos -1.4min, tzais +2.0min
  [213,-168_000,    198_000],    // Aug 1:  alos -2.8min, tzais +3.3min
  [244,-144_000,    144_000],    // Sep 1:  alos -2.4min, tzais +2.4min
  [274, -48_000,     78_000],    // Oct 1:  alos -0.8min, tzais +1.3min
  [305,  18_000,     48_000],    // Nov 1:  alos +0.3min, tzais +0.8min
  [335,  24_000,    -24_000],    // Dec 1:  alos +0.4min, tzais -0.4min
];

function interpolateCorrection(doy: number, index: 0 | 1): number {
  const samples = BEEZEE_CORRECTION_SAMPLES;
  const corrIdx = index + 1; // 1=alos, 2=tzais

  for (let i = 0; i < samples.length - 1; i++) {
    if (doy >= samples[i][0] && doy <= samples[i + 1][0]) {
      const range = samples[i + 1][0] - samples[i][0];
      const t = (doy - samples[i][0]) / range;
      return samples[i][corrIdx] + t * (samples[i + 1][corrIdx] - samples[i][corrIdx]);
    }
  }
  // Wrap around: after last sample, interpolate to first sample of next year
  const last = samples[samples.length - 1];
  const first = samples[0];
  const range = (365 - last[0]) + first[0];
  const t = doy > last[0] ? (doy - last[0]) / range : (doy + 365 - last[0]) / range;
  return last[corrIdx] + t * (first[corrIdx] - last[corrIdx]);
}

function dayOfYear(date: Date): number {
  const jan1 = new Date(date.getFullYear(), 0, 1);
  return Math.floor((date.getTime() - jan1.getTime()) / 86_400_000) + 1;
}

export interface ZmanimLocation {
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  inIsrael: boolean;
}

export interface ZmanLimits {
  earliest?: string;
  latest?: string;
  roundTo?: number;
  offset?: number;
}

export interface ZmanConfig {
  type: ZmanType;
  authority: HalachicAuthority;
  degreesBelow?: number;
  fixedMinutes?: number;
  limits?: ZmanLimits;
}

export interface ZmanimConfig {
  location: ZmanimLocation;
  zmanim: ZmanConfig[];
  candleLightingMinutes: number;
  ateretTorahSunsetOffset?: number;
}

export interface ZmanResult {
  type: ZmanType;
  time: Date | null;
  label: string;
  hebrewLabel: string;
  authority: HalachicAuthority;
  originalTime?: Date | null;
}

export type ZmanimResult = ZmanResult[];

export const ENGLISH_LABELS: Record<ZmanType, string> = {
  [ZmanType.ALOS]: 'Alos Hashachar',
  [ZmanType.ALOS_TUKACHINSKY]: 'Alos Hashachar',
  [ZmanType.MISHEYAKIR]: 'Misheyakir',
  [ZmanType.MISHEYAKIR_TUKACHINSKY]: 'Misheyakir',
  [ZmanType.HANETZ]: 'Hanetz Hachama',
  [ZmanType.HANETZ_TUKACHINSKY]: 'Hanetz Hachama',
  [ZmanType.SOF_ZMAN_SHMA]: "Sof Zman Shema GR\"A",
  [ZmanType.SOF_ZMAN_SHMA_TUKACHINSKY]: "Sof Zman Shema GR\"A",
  [ZmanType.SOF_ZMAN_SHMA_MGA]: "Sof Zman Shema M\"A",
  [ZmanType.SOF_ZMAN_SHMA_MGA_TUKACHINSKY]: "Sof Zman Shema M\"A",
  [ZmanType.SOF_ZMAN_TEFILLAH]: "Sof Zman Tefillah GR\"A",
  [ZmanType.SOF_ZMAN_TEFILLAH_TUKACHINSKY]: "Sof Zman Tefillah GR\"A",
  [ZmanType.SOF_ZMAN_TEFILLAH_MGA]: "Sof Zman Tefillah M\"A",
  [ZmanType.SOF_ZMAN_TEFILLAH_MGA_TUKACHINSKY]: "Sof Zman Tefillah M\"A",
  [ZmanType.CHATZOS]: 'Chatzos HaYom',
  [ZmanType.MINCHA_GEDOLAH]: 'Mincha Gedolah',
  [ZmanType.MINCHA_GEDOLAH_TUKACHINSKY]: 'Mincha Gedolah',
  [ZmanType.MINCHA_KETANAH]: 'Mincha Ketanah',
  [ZmanType.MINCHA_KETANAH_TUKACHINSKY]: 'Mincha Ketanah',
  [ZmanType.PLAG_HAMINCHA]: 'Plag HaMincha',
  [ZmanType.PLAG_HAMINCHA_TUKACHINSKY]: 'Plag HaMincha',
  [ZmanType.SHKIAH]: 'Shkiah',
  [ZmanType.SHKIAH_TUKACHINSKY]: 'Shkiah',
  [ZmanType.TZAIS]: 'Tzais HaKochavim',
  [ZmanType.TZAIS_TUKACHINSKY]: 'Tzais HaKochavim',
  [ZmanType.CHATZOS_HALAILA]: 'Chatzos HaLaila',
  [ZmanType.CANDLE_LIGHTING]: 'Candle Lighting',
  [ZmanType.HAVDALAH]: 'Havdalah',
  [ZmanType.RABBEINU_TAM_END]: 'Rabbeinu Tam',
  [ZmanType.RABBEINU_TAM_TUKACHINSKY]: 'Rabbeinu Tam',
};

export const HEBREW_LABELS: Record<ZmanType, string> = {
  [ZmanType.ALOS]: 'עלות השחר',
  [ZmanType.ALOS_TUKACHINSKY]: 'עלות השחר',
  [ZmanType.MISHEYAKIR]: 'משיכיר',
  [ZmanType.MISHEYAKIR_TUKACHINSKY]: 'משיכיר',
  [ZmanType.HANETZ]: 'הנץ החמה',
  [ZmanType.HANETZ_TUKACHINSKY]: 'הנץ החמה',
  [ZmanType.SOF_ZMAN_SHMA]: 'סוף זמן ק"ש גר"א',
  [ZmanType.SOF_ZMAN_SHMA_TUKACHINSKY]: 'סוף זמן ק"ש גר"א',
  [ZmanType.SOF_ZMAN_SHMA_MGA]: 'סוף זמן ק"ש מג"א',
  [ZmanType.SOF_ZMAN_SHMA_MGA_TUKACHINSKY]: 'סוף זמן ק"ש מג"א',
  [ZmanType.SOF_ZMAN_TEFILLAH]: 'סוף זמן תפילה גר"א',
  [ZmanType.SOF_ZMAN_TEFILLAH_TUKACHINSKY]: 'סוף זמן תפילה גר"א',
  [ZmanType.SOF_ZMAN_TEFILLAH_MGA]: 'סוף זמן תפילה מג"א',
  [ZmanType.SOF_ZMAN_TEFILLAH_MGA_TUKACHINSKY]: 'סוף זמן תפילה מג"א',
  [ZmanType.CHATZOS]: 'חצות היום',
  [ZmanType.MINCHA_GEDOLAH]: 'מנחה גדולה',
  [ZmanType.MINCHA_GEDOLAH_TUKACHINSKY]: 'מנחה גדולה',
  [ZmanType.MINCHA_KETANAH]: 'מנחה קטנה',
  [ZmanType.MINCHA_KETANAH_TUKACHINSKY]: 'מנחה קטנה',
  [ZmanType.PLAG_HAMINCHA]: 'פלג המנחה',
  [ZmanType.PLAG_HAMINCHA_TUKACHINSKY]: 'פלג המנחה',
  [ZmanType.SHKIAH]: 'שקיעה',
  [ZmanType.SHKIAH_TUKACHINSKY]: 'שקיעה',
  [ZmanType.TZAIS]: 'צאת הכוכבים',
  [ZmanType.TZAIS_TUKACHINSKY]: 'צאת הכוכבים',
  [ZmanType.CHATZOS_HALAILA]: 'חצות הלילה',
  [ZmanType.CANDLE_LIGHTING]: 'הדלקת נרות',
  [ZmanType.HAVDALAH]: 'הבדלה',
  [ZmanType.RABBEINU_TAM_END]: 'רבינו תם',
  [ZmanType.RABBEINU_TAM_TUKACHINSKY]: 'רבינו תם',
};

function toJsDate(dt: LuxonDateTime | null): Date | null {
  if (!dt) return null;
  return dt.toJSDate();
}

function parseTimeLimit(timeStr: string, referenceDate: Date): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const d = new Date(referenceDate);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function roundToMinutes(date: Date, roundTo: number): Date {
  const ms = roundTo * 60_000;
  return new Date(Math.round(date.getTime() / ms) * ms);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export class ZmanimEngine {
  private geoLocation: GeoLocation;
  private config: ZmanimConfig;
  private cache: Map<string, ZmanimResult>;

  constructor(config: ZmanimConfig) {
    this.config = config;
    this.cache = new Map();

    const { name, latitude, longitude, timezone } = config.location;
    // Regular zmanim use sea-level sunrise/sunset (elevation=0),
    // matching BeeZee's behavior. Elevation is only relevant for
    // Tukachinsky-specific degree-based calculations via getSeaLevelCal().
    this.geoLocation = new GeoLocation(name, latitude, longitude, 0, timezone);
  }

  getZmanimForDate(date: Date): ZmanimResult {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const cached = this.cache.get(key);
    if (cached) return cached;

    const results: ZmanimResult = this.config.zmanim.map((zmanConfig) => {
      const rawTime = this.getSingleZman(date, zmanConfig);
      const result = this.applyLimits(rawTime, zmanConfig.limits, date);

      return {
        type: zmanConfig.type,
        time: result,
        label: ENGLISH_LABELS[zmanConfig.type] ?? zmanConfig.type,
        hebrewLabel: HEBREW_LABELS[zmanConfig.type] ?? zmanConfig.type,
        authority: zmanConfig.authority,
        originalTime: result?.getTime() !== rawTime?.getTime() ? rawTime : undefined,
      };
    });

    this.cache.set(key, results);
    return results;
  }

  getSingleZman(date: Date, zmanConfig: ZmanConfig): Date | null {
    const luxonDate = DateTime.fromJSDate(date, { zone: this.config.location.timezone });
    const calendar = new ComplexZmanimCalendar(this.geoLocation);
    calendar.setDate(luxonDate);

    // Do NOT set useElevation on the main calendar — regular zmanim use sea-level
    // sunrise/sunset (matching BeeZee's behavior). Elevation is only used for
    // Tukachinsky-specific calculations via getTukachinskyBoundaries().

    if (this.config.candleLightingMinutes) {
      calendar.setCandleLightingOffset(this.config.candleLightingMinutes);
    }
    if (this.config.ateretTorahSunsetOffset != null) {
      calendar.setAteretTorahSunsetOffset(this.config.ateretTorahSunsetOffset);
    }

    const { type, authority, degreesBelow, fixedMinutes } = zmanConfig;

    return toJsDate(this.resolveZman(calendar, type, authority, degreesBelow, fixedMinutes, date));
  }

  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Map from Tukachinsky ZmanType to Maaseh Nisim fields.
   * Only base times (sunrise, sunset, chatzos, misheyakir) come from the table.
   * All derived zmanim (GRA, MGA, plag, etc.) are calculated algorithmically
   * using these base times + degree-based Alos/Tzais to match BeeZee's board.
   */
  private static readonly TUK_MN_FIELD: Partial<Record<ZmanType, keyof MaasehNisimRow>> = {
    [ZmanType.MISHEYAKIR_TUKACHINSKY]: 'tzitzit',
    [ZmanType.HANETZ_TUKACHINSKY]: 'sunrise',
    [ZmanType.SHKIAH_TUKACHINSKY]: 'shkiah',
  };

  /**
   * Try to resolve a Tukachinsky zman from the Maaseh Nisim lookup tables.
   * Returns null if the date/zman is not in the table.
   */
  private resolveTukFromTable(type: ZmanType, date: Date): LuxonDateTime | null {
    const field = ZmanimEngine.TUK_MN_FIELD[type];
    if (!field) return null;

    const month = date.getMonth() + 1;
    const day = date.getDate();
    const row = getMaasehNisimZman(month, day);
    if (!row) return null;

    const minutes = row[field];
    if (typeof minutes !== 'number' || isNaN(minutes)) return null;

    const jsDate = mnMinutesToDate(minutes, date, this.config.location.timezone);
    return DateTime.fromJSDate(jsDate);
  }

  /**
   * Get a sea-level calendar for degree-based Alos/Tzais calculations.
   * BeeZee's HaKotel config uses sea level (no elevation) for these.
   */
  private getSeaLevelCal(date: Date): ComplexZmanimCalendar {
    const { latitude, longitude, timezone, name } = this.config.location;
    const geo = new GeoLocation(name, latitude, longitude, 0, timezone);
    const cal = new ComplexZmanimCalendar(geo);
    cal.setDate(DateTime.fromJSDate(date, { zone: timezone }));
    return cal;
  }

  /**
   * Get a calendar with full elevation for sunset-related calculations.
   * BeeZee uses elevation-adjusted sunset for regular shkiah (machmir for Shabbat).
   */
  private getElevationCal(date: Date): ComplexZmanimCalendar {
    const { latitude, longitude, elevation, timezone, name } = this.config.location;
    const geo = new GeoLocation(name, latitude, longitude, elevation, timezone);
    const cal = new ComplexZmanimCalendar(geo);
    cal.setDate(DateTime.fromJSDate(date, { zone: timezone }));
    return cal;
  }

  /**
   * Get MN-based sunrise and sunset as Luxon DateTimes for a given date.
   * Falls back to the calendar's computed values if MN data isn't available.
   */
  private getMnBoundaries(cal: ComplexZmanimCalendar, date?: Date): {
    mnSr: LuxonDateTime | null;
    mnSs: LuxonDateTime | null;
    mnChatz: LuxonDateTime | null;
  } {
    if (date) {
      const mn = getMaasehNisimZman(date.getMonth() + 1, date.getDate());
      if (mn) {
        const tz = this.config.location.timezone;
        return {
          mnSr: DateTime.fromJSDate(mnMinutesToDate(mn.sunrise, date, tz)),
          mnSs: DateTime.fromJSDate(mnMinutesToDate(mn.shkiah, date, tz)),
          mnChatz: DateTime.fromJSDate(mnMinutesToDate(mn.chatzos, date, tz)),
        };
      }
    }
    return { mnSr: null, mnSs: null, mnChatz: null };
  }

  private resolveZman(
    cal: ComplexZmanimCalendar,
    type: ZmanType,
    authority: HalachicAuthority,
    degreesBelow?: number,
    fixedMinutes?: number,
    date?: Date,
  ): LuxonDateTime | null {
    // For Tukachinsky base zmanim (misheyakir, sunrise, sunset), use MN tables
    if (date && ZmanimEngine.TUK_MN_FIELD[type]) {
      const tableResult = this.resolveTukFromTable(type, date);
      if (tableResult) return tableResult;
    }

    const { tukSr, tukSs } = this.getTukachinskyBoundaries(cal, date);

    switch (type) {
      case ZmanType.ALOS:
        return this.resolveAlos(cal, authority, degreesBelow, fixedMinutes);
      case ZmanType.ALOS_TUKACHINSKY: {
        if (date) {
          const slCal = this.getSeaLevelCal(date);
          const raw = slCal.getSunriseOffsetByDegrees(90 + TUKACHINSKY_ALOS_DEGREES);
          if (raw) {
            const corr = interpolateCorrection(dayOfYear(date), 0);
            return raw.plus({ milliseconds: corr });
          }
          return raw;
        }
        return cal.getSunriseOffsetByDegrees(90 + TUKACHINSKY_ALOS_DEGREES);
      }
      case ZmanType.MISHEYAKIR:
        return this.resolveMisheyakir(cal, authority, degreesBelow);
      case ZmanType.MISHEYAKIR_TUKACHINSKY:
        return cal.getMisheyakir11Point5Degrees();
      case ZmanType.HANETZ:
        return cal.getSunrise();
      case ZmanType.HANETZ_TUKACHINSKY:
        return tukSr ?? cal.getSunrise();

      case ZmanType.SOF_ZMAN_SHMA:
        return this.resolveSofZmanShma(cal, HalachicAuthority.GRA);
      case ZmanType.SOF_ZMAN_SHMA_TUKACHINSKY: {
        const { mnSr, mnSs } = this.getMnBoundaries(cal, date);
        return this.resolveGraTukachinsky(cal, 3, mnSr ?? tukSr, mnSs ?? tukSs);
      }
      case ZmanType.SOF_ZMAN_SHMA_MGA:
        return this.resolveSofZmanShma(cal, HalachicAuthority.MAGEN_AVRAHAM);
      case ZmanType.SOF_ZMAN_SHMA_MGA_TUKACHINSKY:
        return this.resolveMgaTukachinsky(cal, 3, date);

      case ZmanType.SOF_ZMAN_TEFILLAH:
        return this.resolveSofZmanTefillah(cal, HalachicAuthority.GRA);
      case ZmanType.SOF_ZMAN_TEFILLAH_TUKACHINSKY: {
        const { mnSr, mnSs } = this.getMnBoundaries(cal, date);
        return this.resolveGraTukachinsky(cal, 4, mnSr ?? tukSr, mnSs ?? tukSs);
      }
      case ZmanType.SOF_ZMAN_TEFILLAH_MGA:
        return this.resolveSofZmanTefillah(cal, HalachicAuthority.MAGEN_AVRAHAM);
      case ZmanType.SOF_ZMAN_TEFILLAH_MGA_TUKACHINSKY:
        return this.resolveMgaTukachinsky(cal, 4, date);

      case ZmanType.CHATZOS:
        return cal.getChatzos();

      case ZmanType.MINCHA_GEDOLAH:
        return this.resolveMinchaGedolah(cal, HalachicAuthority.GRA);
      case ZmanType.MINCHA_GEDOLAH_TUKACHINSKY: {
        const { mnSr, mnSs, mnChatz } = this.getMnBoundaries(cal, date);
        const chatzos = mnChatz ?? cal.getChatzos();
        const sr = mnSr ?? tukSr ?? cal.getSunrise();
        const ss = mnSs ?? tukSs ?? cal.getSunset();
        if (!chatzos || !sr || !ss) return chatzos ? chatzos.plus({ minutes: 30 }) : null;
        const graDayMs = ss.toMillis() - sr.toMillis();
        const halfShaah = graDayMs / 24;
        const mg30 = chatzos.plus({ minutes: 30 });
        const mgSh = chatzos.plus({ milliseconds: halfShaah });
        return mg30.toMillis() > mgSh.toMillis() ? mg30 : mgSh;
      }

      case ZmanType.MINCHA_KETANAH:
        return this.resolveMinchaKetanah(cal, HalachicAuthority.GRA);
      case ZmanType.MINCHA_KETANAH_TUKACHINSKY: {
        const { mnSr, mnSs } = this.getMnBoundaries(cal, date);
        return this.resolveGraTukachinsky(cal, 9.5, mnSr ?? tukSr, mnSs ?? tukSs);
      }

      case ZmanType.PLAG_HAMINCHA:
        return this.resolvePlagHamincha(cal, HalachicAuthority.GRA);
      case ZmanType.PLAG_HAMINCHA_TUKACHINSKY: {
        const { mnSr, mnSs } = this.getMnBoundaries(cal, date);
        return this.resolveGraTukachinsky(cal, 10.75, mnSr ?? tukSr, mnSs ?? tukSs);
      }

      case ZmanType.SHKIAH: {
        if (date && this.config.location.elevation > 0) {
          return this.getElevationCal(date).getSunset();
        }
        return cal.getSunset();
      }
      case ZmanType.SHKIAH_TUKACHINSKY:
        return tukSs ?? cal.getSunset();
      case ZmanType.TZAIS:
        return this.resolveTzais(cal, authority, degreesBelow, fixedMinutes);
      case ZmanType.TZAIS_TUKACHINSKY: {
        if (date) {
          const slCal = this.getSeaLevelCal(date);
          const raw = slCal.getSunsetOffsetByDegrees(90 + TUKACHINSKY_TZAIS_DEGREES);
          if (raw) {
            const corr = interpolateCorrection(dayOfYear(date), 1);
            return raw.plus({ milliseconds: corr });
          }
          return raw;
        }
        return cal.getSunsetOffsetByDegrees(90 + TUKACHINSKY_TZAIS_DEGREES);
      }
      case ZmanType.CHATZOS_HALAILA:
        return cal.getSolarMidnight();
      case ZmanType.CANDLE_LIGHTING:
        return cal.getCandleLighting();
      case ZmanType.HAVDALAH:
        return this.resolveTzais(cal, authority, degreesBelow, fixedMinutes);
      case ZmanType.RABBEINU_TAM_END: {
        const sunset = cal.getSeaLevelSunset();
        return sunset ? sunset.plus({ minutes: 72 }) : null;
      }
      case ZmanType.RABBEINU_TAM_TUKACHINSKY: {
        const mnShkiah = date ? this.resolveTukFromTable(ZmanType.SHKIAH_TUKACHINSKY, date) : null;
        const ss = mnShkiah ?? tukSs ?? cal.getSunset();
        return ss ? ss.plus({ minutes: 72 }) : null;
      }
      default:
        return null;
    }
  }

  private resolveAlos(
    cal: ComplexZmanimCalendar,
    authority: HalachicAuthority,
    degreesBelow?: number,
    fixedMinutes?: number,
  ): LuxonDateTime | null {
    switch (authority) {
      case HalachicAuthority.TUKACHINSKY:
        return cal.getSunriseOffsetByDegrees(90 + 16.1);
      case HalachicAuthority.BAAL_HATANYA:
      case HalachicAuthority.SHULCHAN_ARUCH_HARAV:
        return cal.getAlosBaalHatanya();
      case HalachicAuthority.FIXED_MINUTES:
        if (fixedMinutes != null) {
          const sunrise = cal.getSeaLevelSunrise();
          return sunrise ? sunrise.minus({ minutes: fixedMinutes }) : null;
        }
        return cal.getAlos72();
      case HalachicAuthority.YEREIM:
        return cal.getSunriseOffsetByDegrees(90 + (degreesBelow ?? 16.1));
      case HalachicAuthority.GRA:
      case HalachicAuthority.MAGEN_AVRAHAM:
      case HalachicAuthority.MISHNA_BERURA:
      default:
        if (degreesBelow != null) {
          return cal.getSunriseOffsetByDegrees(90 + degreesBelow);
        }
        return cal.getAlos72();
    }
  }

  private resolveMisheyakir(
    cal: ComplexZmanimCalendar,
    authority: HalachicAuthority,
    degreesBelow?: number,
  ): LuxonDateTime | null {
    if (degreesBelow != null) {
      return cal.getSunriseOffsetByDegrees(90 + degreesBelow);
    }
    switch (authority) {
      case HalachicAuthority.TUKACHINSKY:
        return cal.getMisheyakir11Point5Degrees();
      default:
        return cal.getMisheyakir11Degrees();
    }
  }

  private resolveShaosFromBoundaries(
    start: LuxonDateTime | null,
    end: LuxonDateTime | null,
    shaos: number,
  ): LuxonDateTime | null {
    if (!start || !end) return null;
    const dayMs = end.toMillis() - start.toMillis();
    const shaahMs = dayMs / 12;
    return start.plus({ milliseconds: shaahMs * shaos });
  }

  /**
   * Compute Tukachinsky sunrise/sunset using BeeZee's daily-varying refraction + elevation angle.
   * The refraction value changes throughout the year based on Earth-Sun distance,
   * which affects the sun's apparent angular radius.
   */
  private getTukachinskyBoundaries(cal: ComplexZmanimCalendar, date?: Date): {
    tukSr: LuxonDateTime | null;
    tukSs: LuxonDateTime | null;
  } {
    const elev = this.config.location.elevation;
    if (elev <= 0) {
      return { tukSr: null, tukSs: null };
    }
    const EARTH_RADIUS = 6371000;
    const elevAngle = Math.acos(EARTH_RADIUS / (EARTH_RADIUS + elev)) * (180 / Math.PI);

    const refDate = date ?? new Date();
    const refraction = getDailyRefraction(refDate.getMonth() + 1, refDate.getDate());

    const totalAngle = 90 + refraction + elevAngle;
    return {
      tukSr: cal.getSunriseOffsetByDegrees(totalAngle),
      tukSs: cal.getSunsetOffsetByDegrees(totalAngle),
    };
  }

  /** GRA Tukachinsky: shaos zmaniyos from Tuk sunrise to Tuk sunset */
  private resolveGraTukachinsky(
    cal: ComplexZmanimCalendar,
    shaos: number,
    tukSr?: LuxonDateTime | null,
    tukSs?: LuxonDateTime | null,
  ): LuxonDateTime | null {
    const sunrise = tukSr ?? cal.getSunrise();
    const sunset = tukSs ?? cal.getSunset();
    return this.resolveShaosFromBoundaries(sunrise, sunset, shaos);
  }

  /**
   * MGA Tukachinsky: shaos zmaniyos from Alos (20.32° sea level) to Chatzos,
   * counted as 6 half-day shaos (matching BeeZee's RelHoursForDay=6).
   * Uses MN-based chatzos when available for accuracy.
   */
  private resolveMgaTukachinsky(
    cal: ComplexZmanimCalendar,
    shaos: number,
    date?: Date,
  ): LuxonDateTime | null {
    let alos: LuxonDateTime | null;
    if (date) {
      const slCal = this.getSeaLevelCal(date);
      alos = slCal.getSunriseOffsetByDegrees(90 + TUKACHINSKY_ALOS_DEGREES);
      if (alos) {
        const corr = interpolateCorrection(dayOfYear(date), 0);
        alos = alos.plus({ milliseconds: corr });
      }
    } else {
      alos = cal.getSunriseOffsetByDegrees(90 + TUKACHINSKY_ALOS_DEGREES);
    }

    const { mnChatz } = this.getMnBoundaries(cal, date);
    const chatzos = mnChatz ?? cal.getChatzos();

    if (!alos || !chatzos) return null;
    const halfDayMs = chatzos.toMillis() - alos.toMillis();
    const shaahMs = halfDayMs / 6;
    return alos.plus({ milliseconds: shaahMs * shaos });
  }

  private resolveSofZmanShma(
    cal: ComplexZmanimCalendar,
    authority: HalachicAuthority,
  ): LuxonDateTime | null {
    switch (authority) {
      case HalachicAuthority.MAGEN_AVRAHAM:
        return cal.getSofZmanShmaMGA();
      case HalachicAuthority.BAAL_HATANYA:
      case HalachicAuthority.SHULCHAN_ARUCH_HARAV:
        return cal.getSofZmanShmaBaalHatanya();
      case HalachicAuthority.GRA:
      case HalachicAuthority.MISHNA_BERURA:
      default:
        return cal.getSofZmanShmaGRA();
    }
  }

  private resolveSofZmanTefillah(
    cal: ComplexZmanimCalendar,
    authority: HalachicAuthority,
  ): LuxonDateTime | null {
    switch (authority) {
      case HalachicAuthority.MAGEN_AVRAHAM:
        return cal.getSofZmanTfilaMGA();
      case HalachicAuthority.BAAL_HATANYA:
      case HalachicAuthority.SHULCHAN_ARUCH_HARAV:
        return cal.getSofZmanTfilaBaalHatanya();
      case HalachicAuthority.GRA:
      case HalachicAuthority.MISHNA_BERURA:
      default:
        return cal.getSofZmanTfilaGRA();
    }
  }

  private resolveMinchaGedolah(
    cal: ComplexZmanimCalendar,
    authority: HalachicAuthority,
  ): LuxonDateTime | null {
    switch (authority) {
      case HalachicAuthority.BAAL_HATANYA:
      case HalachicAuthority.SHULCHAN_ARUCH_HARAV:
        return cal.getMinchaGedolaBaalHatanya();
      default:
        return cal.getMinchaGedola();
    }
  }

  private resolveMinchaKetanah(
    cal: ComplexZmanimCalendar,
    authority: HalachicAuthority,
  ): LuxonDateTime | null {
    switch (authority) {
      case HalachicAuthority.BAAL_HATANYA:
      case HalachicAuthority.SHULCHAN_ARUCH_HARAV: {
        const sunrise = cal.getSeaLevelSunrise();
        const sunset = cal.getSeaLevelSunset();
        return cal.getMinchaKetana(sunrise, sunset);
      }
      default: {
        const sunrise = cal.getSeaLevelSunrise();
        const sunset = cal.getSeaLevelSunset();
        return cal.getMinchaKetana(sunrise, sunset);
      }
    }
  }

  private resolvePlagHamincha(
    cal: ComplexZmanimCalendar,
    authority: HalachicAuthority,
  ): LuxonDateTime | null {
    switch (authority) {
      case HalachicAuthority.BAAL_HATANYA:
      case HalachicAuthority.SHULCHAN_ARUCH_HARAV:
        return cal.getPlagHaminchaBaalHatanya();
      default: {
        const sunrise = cal.getSeaLevelSunrise();
        const sunset = cal.getSeaLevelSunset();
        return cal.getPlagHamincha(sunrise, sunset);
      }
    }
  }

  private resolveTzais(
    cal: ComplexZmanimCalendar,
    authority: HalachicAuthority,
    degreesBelow?: number,
    fixedMinutes?: number,
  ): LuxonDateTime | null {
    switch (authority) {
      case HalachicAuthority.TUKACHINSKY:
        return cal.getTzaisGeonim8Point5Degrees();
      case HalachicAuthority.ATERET_TORAH:
        return cal.getTzaisAteretTorah();
      case HalachicAuthority.BAAL_HATANYA:
      case HalachicAuthority.SHULCHAN_ARUCH_HARAV:
        return cal.getTzaisBaalHatanya();
      case HalachicAuthority.RABBEINU_TAM:
        return cal.getTzais72();
      case HalachicAuthority.FIXED_MINUTES:
        if (fixedMinutes != null) {
          const sunset = cal.getSeaLevelSunset();
          return sunset ? sunset.plus({ minutes: fixedMinutes }) : null;
        }
        return cal.getTzais72();
      case HalachicAuthority.YEREIM:
        return cal.getSunsetOffsetByDegrees(90 + (degreesBelow ?? 8.5));
      case HalachicAuthority.GRA:
      case HalachicAuthority.MAGEN_AVRAHAM:
      case HalachicAuthority.MISHNA_BERURA:
      default:
        if (degreesBelow != null) {
          return cal.getSunsetOffsetByDegrees(90 + degreesBelow);
        }
        return cal.getTzais72();
    }
  }

  private applyLimits(
    rawTime: Date | null,
    limits: ZmanLimits | undefined,
    referenceDate: Date,
  ): Date | null {
    if (!rawTime || !limits) return rawTime;

    let adjusted = new Date(rawTime.getTime());

    if (limits.offset) {
      adjusted = addMinutes(adjusted, limits.offset);
    }

    if (limits.roundTo && limits.roundTo > 0) {
      adjusted = roundToMinutes(adjusted, limits.roundTo);
    }

    if (limits.earliest) {
      const earliest = parseTimeLimit(limits.earliest, referenceDate);
      if (adjusted < earliest) adjusted = earliest;
    }

    if (limits.latest) {
      const latest = parseTimeLimit(limits.latest, referenceDate);
      if (adjusted > latest) adjusted = latest;
    }

    return adjusted;
  }
}

import {
  JewishCalendar,
  HebrewDateFormatter,
  YomiCalculator,
  YerushalmiYomiCalculator,
  Daf,
  JewishDate,
  Parsha,
} from 'kosher-zmanim';

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface JewishDateInfo {
  year: number;
  month: number;
  day: number;
  monthName: string;
  monthNameHebrew: string;
  dayOfWeek: number;
  dayOfWeekHebrew: string;
  formattedHebrew: string;
  formattedEnglish: string;
  isLeapYear: boolean;
}

export interface DafYomiInfo {
  masechta: string;
  masechtaHebrew: string;
  daf: number;
  formatted: string;
  formattedHebrew: string;
}

export interface HolidayInfo {
  name: string;
  nameHebrew: string;
  isYomTov: boolean;
  isAssurBemelacha: boolean;
  isCholHamoed: boolean;
  isTaanis: boolean;
  isRoshChodesh: boolean;
  isChanukah: boolean;
  chanukahDay: number;
  isPurim: boolean;
  isErev: boolean;
  hasCandleLighting: boolean;
}

export interface OmerInfo {
  day: number;
  formattedHebrew: string;
  formattedEnglish: string;
}

export interface TefilahRulesInfo {
  mashivHaruach: boolean;
  moridHatal: boolean;
  veseinTalUmatar: boolean;
  veseinBeracha: boolean;
  yaalehVeyavo: boolean;
  alHanissim: boolean;
  hallel: 'full' | 'half' | 'none';
  tachanun: boolean;
  sefirahCount: number | null;
  isShabbos: boolean;
  isMukafChoma: boolean;
}

export interface ParshaInfo {
  parsha: string;
  parshaHebrew: string;
  upcoming: string;
  upcomingHebrew: string;
  specialShabbos: string | null;
  specialShabbosHebrew: string | null;
}

// ── Engine ──────────────────────────────────────────────────────────────────

export class CalendarEngine {
  private inIsrael: boolean;
  private hebrewFormatter: HebrewDateFormatter;
  private englishFormatter: HebrewDateFormatter;

  constructor(inIsrael: boolean = false) {
    this.inIsrael = inIsrael;
    this.hebrewFormatter = new HebrewDateFormatter();
    this.hebrewFormatter.setHebrewFormat(true);
    this.englishFormatter = new HebrewDateFormatter();
    this.englishFormatter.setHebrewFormat(false);
  }

  private createCalendar(date: Date): JewishCalendar {
    const cal = new JewishCalendar(date);
    cal.setInIsrael(this.inIsrael);
    return cal;
  }

  // ── Jewish Date ───────────────────────────────────────────────────────

  getJewishDate(date: Date): JewishDateInfo {
    const cal = this.createCalendar(date);
    return {
      year: cal.getJewishYear(),
      month: cal.getJewishMonth(),
      day: cal.getJewishDayOfMonth(),
      monthName: this.englishFormatter.formatMonth(cal),
      monthNameHebrew: this.hebrewFormatter.formatMonth(cal),
      dayOfWeek: cal.getDayOfWeek(),
      dayOfWeekHebrew: this.hebrewFormatter.formatDayOfWeek(cal),
      formattedHebrew: this.hebrewFormatter.format(cal),
      formattedEnglish: this.englishFormatter.format(cal),
      isLeapYear: cal.isJewishLeapYear(),
    };
  }

  // ── Parsha ────────────────────────────────────────────────────────────

  getParsha(date: Date): ParshaInfo {
    const cal = this.createCalendar(date);

    const parshaEnum: Parsha = cal.getParsha();
    const parsha = parshaEnum !== Parsha.NONE
      ? (this.englishFormatter.formatParsha(parshaEnum) || '')
      : '';
    const parshaHebrew = parshaEnum !== Parsha.NONE
      ? (this.hebrewFormatter.formatParsha(parshaEnum) || '')
      : '';

    // Manual upcoming parsha: create a fresh JewishCalendar for the next Shabbos
    // instead of using cal.getUpcomingParsha() which has a clone bug in kosher-zmanim v0.9.0
    let upcoming = '';
    let upcomingHebrew = '';
    const dow = cal.getDayOfWeek(); // 1=Sun..7=Sat
    let daysToShabbos = dow === 7 ? 7 : (7 - dow);
    for (let attempt = 0; attempt < 4; attempt++) {
      const shabbosDate = new Date(date);
      shabbosDate.setDate(shabbosDate.getDate() + daysToShabbos);
      const shabbosCal = this.createCalendar(shabbosDate);
      const upEnum: Parsha = shabbosCal.getParsha();
      if (upEnum !== Parsha.NONE) {
        upcoming = this.englishFormatter.formatParsha(upEnum) || '';
        upcomingHebrew = this.hebrewFormatter.formatParsha(upEnum) || '';
        break;
      }
      daysToShabbos += 7;
    }

    const specialEnum = cal.getSpecialShabbos();
    let specialShabbos: string | null = null;
    let specialShabbosHebrew: string | null = null;
    if (specialEnum !== Parsha.NONE) {
      specialShabbos = this.englishFormatter.formatParsha(specialEnum) || null;
      specialShabbosHebrew = this.hebrewFormatter.formatParsha(specialEnum) || null;
      if (specialShabbos === '') specialShabbos = null;
      if (specialShabbosHebrew === '') specialShabbosHebrew = null;
    }

    return {
      parsha,
      parshaHebrew,
      upcoming,
      upcomingHebrew,
      specialShabbos,
      specialShabbosHebrew,
    };
  }

  // ── Daf Yomi ──────────────────────────────────────────────────────────

  getDafYomi(date: Date): DafYomiInfo {
    try {
      const cal = this.createCalendar(date);
      const daf: Daf = YomiCalculator.getDafYomiBavli(cal);

      return {
        masechta: daf.getMasechtaTransliterated(),
        masechtaHebrew: daf.getMasechta(),
        daf: daf.getDaf(),
        formatted: this.englishFormatter.formatDafYomiBavli(daf),
        formattedHebrew: this.hebrewFormatter.formatDafYomiBavli(daf),
      };
    } catch {
      return {
        masechta: '',
        masechtaHebrew: '',
        daf: 0,
        formatted: '',
        formattedHebrew: '',
      };
    }
  }

  // ── Holiday ───────────────────────────────────────────────────────────

  getHoliday(date: Date): HolidayInfo {
    const cal = this.createCalendar(date);

    let name = '';
    let nameHebrew = '';

    try {
      const yomTovIndex = cal.getYomTovIndex();
      if (yomTovIndex !== -1) {
        name = this.englishFormatter.formatYomTov(cal) || '';
        nameHebrew = this.hebrewFormatter.formatYomTov(cal) || '';
      }
    } catch {
      // some dates may not have a yom tov name
    }

    try {
      if (cal.isRoshChodesh()) {
        const rcEnglish = this.englishFormatter.formatRoshChodesh(cal) || '';
        const rcHebrew = this.hebrewFormatter.formatRoshChodesh(cal) || '';
        if (name && rcEnglish) {
          name = `${name} / ${rcEnglish}`;
          nameHebrew = `${nameHebrew} / ${rcHebrew}`;
        } else if (rcEnglish) {
          name = rcEnglish;
          nameHebrew = rcHebrew;
        }
      }
    } catch {
      // formatRoshChodesh may fail
    }

    let chanukahDay = 0;
    try {
      const cd = cal.getDayOfChanukah();
      chanukahDay = cd === -1 ? 0 : cd;
    } catch {
      // not chanukah
    }

    return {
      name,
      nameHebrew,
      isYomTov: cal.isYomTov(),
      isAssurBemelacha: cal.isAssurBemelacha(),
      isCholHamoed: cal.isCholHamoed(),
      isTaanis: cal.isTaanis(),
      isRoshChodesh: cal.isRoshChodesh(),
      isChanukah: cal.isChanukah(),
      chanukahDay,
      isPurim: cal.isPurim(),
      isErev: cal.isErevYomTov(),
      hasCandleLighting: cal.hasCandleLighting(),
    };
  }

  // ── Omer ──────────────────────────────────────────────────────────────

  getOmer(date: Date): OmerInfo | null {
    const cal = this.createCalendar(date);
    const day = cal.getDayOfOmer();
    if (day === -1) return null;

    return {
      day,
      formattedHebrew: this.hebrewFormatter.formatOmer(cal),
      formattedEnglish: this.englishFormatter.formatOmer(cal),
    };
  }

  // ── Tefilah Rules ─────────────────────────────────────────────────────

  getTefilahRules(date: Date): TefilahRulesInfo {
    const cal = this.createCalendar(date);

    const jewishMonth = cal.getJewishMonth();
    const jewishDay = cal.getJewishDayOfMonth();
    const dayOfWeek = cal.getDayOfWeek();
    const isShabbos = dayOfWeek === 7;

    const mashivHaruach = this.isMashivHaruach(jewishMonth, jewishDay);
    const moridHatal = !mashivHaruach;

    const veseinTalUmatar = this.isVeseinTalUmatar(cal, jewishMonth, jewishDay, date);
    const veseinBeracha = !veseinTalUmatar;

    const yaalehVeyavo = cal.isRoshChodesh() || cal.isCholHamoed() || cal.isYomTovAssurBemelacha();

    const alHanissim = cal.isChanukah() || cal.isPurim();

    const hallel = this.determineHallel(cal, jewishMonth, jewishDay);

    const tachanun = this.shouldSayTachanun(cal, jewishMonth, jewishDay, dayOfWeek);

    const omerDay = cal.getDayOfOmer();
    const sefirahCount = omerDay === -1 ? null : omerDay;

    return {
      mashivHaruach,
      moridHatal,
      veseinTalUmatar,
      veseinBeracha,
      yaalehVeyavo,
      alHanissim,
      hallel,
      tachanun,
      sefirahCount,
      isShabbos,
      isMukafChoma: cal.getIsMukafChoma(),
    };
  }

  /**
   * Mashiv haruach is said from Shmini Atzeres musaf (22 Tishrei) until first day of Pesach musaf (15 Nissan).
   * We approximate: from 22 Tishrei through 14 Nissan inclusive.
   */
  private isMashivHaruach(month: number, day: number): boolean {
    if (month === JewishDate.TISHREI && day >= 22) return true;
    if (month === JewishDate.CHESHVAN || month === JewishDate.KISLEV ||
        month === JewishDate.TEVES || month === JewishDate.SHEVAT ||
        month === JewishDate.ADAR || month === JewishDate.ADAR_II) return true;
    if (month === JewishDate.NISSAN && day < 15) return true;
    return false;
  }

  /**
   * Vesein Tal Umatar:
   * - In Israel: from 7 Cheshvan until 14 Nissan (erev Pesach).
   * - Outside Israel: from December 4 (or 5 in year before Gregorian leap year) until 14 Nissan.
   */
  private isVeseinTalUmatar(
    cal: JewishCalendar,
    jewishMonth: number,
    jewishDay: number,
    date: Date,
  ): boolean {
    if (jewishMonth === JewishDate.NISSAN && jewishDay >= 15) return false;
    if (cal.isPesach()) return false;

    if (this.inIsrael) {
      if (jewishMonth === JewishDate.CHESHVAN && jewishDay >= 7) return true;
      if (jewishMonth === JewishDate.KISLEV || jewishMonth === JewishDate.TEVES ||
          jewishMonth === JewishDate.SHEVAT || jewishMonth === JewishDate.ADAR ||
          jewishMonth === JewishDate.ADAR_II) return true;
      if (jewishMonth === JewishDate.NISSAN && jewishDay < 15) return true;
      return false;
    }

    // Outside Israel: from Dec 4/5 to Pesach
    const gregYear = date.getFullYear();
    const nextYear = gregYear + 1;
    const isNextGregorianLeapYear = (nextYear % 4 === 0 && nextYear % 100 !== 0) || nextYear % 400 === 0;
    const startDay = isNextGregorianLeapYear ? 5 : 4;
    const startDate = new Date(gregYear, 11, startDay); // December startDay

    if (date >= startDate) return true;

    // If we're in Jan-April, check if we started last December
    if (date.getMonth() < 3) {
      const prevGregYear = gregYear - 1;
      const isCurrentGregorianLeapYear = (gregYear % 4 === 0 && gregYear % 100 !== 0) || gregYear % 400 === 0;
      const prevStartDay = isCurrentGregorianLeapYear ? 5 : 4;
      const prevStartDate = new Date(prevGregYear, 11, prevStartDay);
      if (date >= prevStartDate) {
        if (jewishMonth === JewishDate.NISSAN && jewishDay >= 15) return false;
        return true;
      }
    }

    return false;
  }

  private determineHallel(cal: JewishCalendar, month: number, day: number): 'full' | 'half' | 'none' {
    // Full Hallel
    if (cal.isChanukah()) return 'full';
    if (cal.isShavuos()) return 'full';
    if (month === JewishDate.NISSAN && (day === 15 || (day === 16 && !this.inIsrael))) return 'full';
    if (cal.isSuccos() && !cal.isCholHamoedSuccos() && !cal.isHoshanaRabba()) return 'full';
    if (cal.isCholHamoedSuccos() || cal.isHoshanaRabba()) return 'full';
    if (cal.isShminiAtzeres() || cal.isSimchasTorah()) return 'full';

    // Half Hallel
    if (cal.isRoshChodesh()) return 'half';
    if (cal.isCholHamoedPesach()) return 'half';
    if (month === JewishDate.NISSAN && day >= 17 && day <= 22) return 'half';
    if (month === JewishDate.NISSAN && (day === 21 || (day === 22 && !this.inIsrael))) return 'half';

    return 'none';
  }

  private shouldSayTachanun(
    cal: JewishCalendar,
    month: number,
    day: number,
    dayOfWeek: number,
  ): boolean {
    if (dayOfWeek === 7) return false; // Shabbos
    if (cal.isYomTov()) return false;
    if (cal.isCholHamoed()) return false;
    if (cal.isRoshChodesh()) return false;
    if (cal.isChanukah()) return false;
    if (cal.isPurim()) return false;
    if (cal.isTishaBav()) return false;
    if (cal.isErevYomTov()) return false;

    // Tu B'Shvat
    if (month === JewishDate.SHEVAT && day === 15) return false;
    // Purim Katan (14-15 Adar I in leap year)
    if (month === JewishDate.ADAR && cal.isJewishLeapYear() && (day === 14 || day === 15)) return false;
    // Lag Ba'Omer
    if (month === JewishDate.IYAR && day === 18) return false;
    // Tu B'Av
    if (month === JewishDate.AV && day === 15) return false;
    // Erev Rosh Chodesh
    if (cal.isErevRoshChodesh()) return false;
    // Isru Chag
    if (cal.isIsruChag()) return false;
    // Entire month of Nissan
    if (month === JewishDate.NISSAN) return false;
    // Yom Haatzmaut, Yom Yerushalayim
    if (month === JewishDate.IYAR && (day === 5 || day === 28)) return false;
    // Shushan Purim
    const yomTovIndex = cal.getYomTovIndex();
    if (yomTovIndex === JewishCalendar.SHUSHAN_PURIM) return false;
    // Pesach Sheni
    if (month === JewishDate.IYAR && day === 14) return false;

    return true;
  }

  // ── Aggregate ─────────────────────────────────────────────────────────

  getAllInfo(date: Date): {
    date: JewishDateInfo;
    parsha: ParshaInfo;
    dafYomi: DafYomiInfo;
    holiday: HolidayInfo;
    omer: OmerInfo | null;
    tefilah: TefilahRulesInfo;
  } {
    return {
      date: this.getJewishDate(date),
      parsha: this.getParsha(date),
      dafYomi: this.getDafYomi(date),
      holiday: this.getHoliday(date),
      omer: this.getOmer(date),
      tefilah: this.getTefilahRules(date),
    };
  }
}

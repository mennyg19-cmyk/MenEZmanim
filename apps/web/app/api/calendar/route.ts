import { NextRequest } from 'next/server';
import {
  JewishCalendar,
  HebrewDateFormatter,
  YomiCalculator,
  Parsha,
} from 'kosher-zmanim';
import { json, error, options } from '../_lib/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const dateParam = searchParams.get('date');
    const date = dateParam ? new Date(dateParam) : new Date();

    if (isNaN(date.getTime())) {
      return error('Invalid date parameter', 400);
    }

    const inIsrael = searchParams.get('inIsrael') !== 'false';
    const cal = new JewishCalendar(date);
    cal.setInIsrael(inIsrael);

    const heFmt = new HebrewDateFormatter();
    heFmt.setHebrewFormat(true);
    const enFmt = new HebrewDateFormatter();
    enFmt.setHebrewFormat(false);

    // Jewish Date
    const jewishDate = {
      year: cal.getJewishYear(),
      month: cal.getJewishMonth(),
      day: cal.getJewishDayOfMonth(),
      monthName: enFmt.formatMonth(cal),
      monthNameHebrew: heFmt.formatMonth(cal),
      dayOfWeek: cal.getDayOfWeek(),
      dayOfWeekHebrew: heFmt.formatDayOfWeek(cal),
      formattedHebrew: heFmt.format(cal),
      formattedEnglish: enFmt.format(cal),
      isLeapYear: cal.isJewishLeapYear(),
    };

    // Parsha — avoid getUpcomingParsha() due to clone bug in kosher-zmanim v0.9.0
    const parshaEnum = cal.getParsha();
    const parshaEn = parshaEnum !== Parsha.NONE ? (enFmt.formatParsha(parshaEnum) || '') : '';
    const parshaHe = parshaEnum !== Parsha.NONE ? (heFmt.formatParsha(parshaEnum) || '') : '';

    let upcomingEn = '';
    let upcomingHe = '';
    const dow = cal.getDayOfWeek();
    let daysToShabbos = dow === 7 ? 7 : (7 - dow);
    for (let i = 0; i < 4; i++) {
      const sd = new Date(date);
      sd.setDate(sd.getDate() + daysToShabbos);
      const sc = new JewishCalendar(sd);
      sc.setInIsrael(inIsrael);
      const up = sc.getParsha();
      if (up !== Parsha.NONE) {
        upcomingEn = enFmt.formatParsha(up) || '';
        upcomingHe = heFmt.formatParsha(up) || '';
        break;
      }
      daysToShabbos += 7;
    }

    const specialEnum = cal.getSpecialShabbos();
    let specialShabbos: string | null = null;
    let specialShabbosHebrew: string | null = null;
    if (specialEnum !== Parsha.NONE) {
      specialShabbos = enFmt.formatParsha(specialEnum) || null;
      specialShabbosHebrew = heFmt.formatParsha(specialEnum) || null;
    }

    const parsha = {
      parsha: parshaEn,
      parshaHebrew: parshaHe,
      upcoming: upcomingEn,
      upcomingHebrew: upcomingHe,
      specialShabbos,
      specialShabbosHebrew,
    };

    // Holiday
    let holidayName = '';
    let holidayNameHe = '';
    const yomTovIndex = cal.getYomTovIndex();
    if (yomTovIndex !== -1) {
      holidayName = enFmt.formatYomTov(cal) || '';
      holidayNameHe = heFmt.formatYomTov(cal) || '';
    }
    if (cal.isRoshChodesh()) {
      const rcEn = enFmt.formatRoshChodesh(cal) || '';
      const rcHe = heFmt.formatRoshChodesh(cal) || '';
      holidayName = holidayName ? `${holidayName} / ${rcEn}` : rcEn;
      holidayNameHe = holidayNameHe ? `${holidayNameHe} / ${rcHe}` : rcHe;
    }
    const chanukahDay = cal.getDayOfChanukah();
    const holiday = {
      name: holidayName,
      nameHebrew: holidayNameHe,
      isYomTov: cal.isYomTov(),
      isAssurBemelacha: cal.isAssurBemelacha(),
      isCholHamoed: cal.isCholHamoed(),
      isTaanis: cal.isTaanis(),
      isRoshChodesh: cal.isRoshChodesh(),
      isChanukah: cal.isChanukah(),
      chanukahDay: chanukahDay === -1 ? 0 : chanukahDay,
      isPurim: cal.isPurim(),
      isErev: cal.isErevYomTov(),
      hasCandleLighting: cal.hasCandleLighting(),
    };

    // Omer
    const omerDay = cal.getDayOfOmer();
    const omer = omerDay === -1 ? null : {
      day: omerDay,
      formattedHebrew: heFmt.formatOmer(cal),
      formattedEnglish: enFmt.formatOmer(cal),
    };

    // Daf Yomi
    let dafYomi = null;
    try {
      const daf = YomiCalculator.getDafYomiBavli(cal);
      dafYomi = {
        masechta: daf.getMasechtaTransliterated(),
        masechtaHebrew: daf.getMasechta(),
        daf: daf.getDaf(),
        formatted: enFmt.formatDafYomiBavli(daf),
        formattedHebrew: heFmt.formatDafYomiBavli(daf),
      };
    } catch (_e) {
      dafYomi = { masechta: '', masechtaHebrew: '', daf: 0, formatted: '', formattedHebrew: '' };
    }

    // Tefilah (simplified)
    const tefilah = {
      mashivHaruach: true,
      moridHatal: false,
      veseinTalUmatar: inIsrael,
      veseinBeracha: !inIsrael,
      yaalehVeyavo: cal.isRoshChodesh() || cal.isCholHamoed(),
      alHanissim: cal.isChanukah() || cal.isPurim(),
      hallel: cal.isChanukah() ? 'full' : cal.isRoshChodesh() ? 'half' : 'none',
      tachanun: !cal.isYomTov() && !cal.isCholHamoed() && !cal.isRoshChodesh() && !cal.isChanukah() && cal.getDayOfWeek() !== 7,
      sefirahCount: omerDay === -1 ? null : omerDay,
      isShabbos: cal.getDayOfWeek() === 7,
      isMukafChoma: cal.getIsMukafChoma(),
    };

    return json({
      date: date.toISOString(),
      jewishDate,
      parsha,
      holiday,
      omer,
      dafYomi,
      tefilah,
    });
  } catch (err) {
    console.error('Calendar API error:', err);
    return error('Failed to compute calendar info', 500);
  }
}

export async function OPTIONS() {
  return options();
}

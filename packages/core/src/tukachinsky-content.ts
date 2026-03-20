export interface TukachinskyNote {
  hebrewMonth: number; // 1=Nissan … 7=Tishrei … 12=Adar (13=Adar II in leap year)
  hebrewDay: number;
  category: 'minhag' | 'tefillah' | 'halacha' | 'seasonal';
  noteHebrew: string;
  noteEnglish: string;
  source?: string;
}

export const TUKACHINSKY_NOTES: TukachinskyNote[] = [
  // ── Tishrei (7) ──────────────────────────────────────────────
  {
    hebrewMonth: 7, hebrewDay: 1,
    category: 'tefillah',
    noteHebrew: 'ראש השנה — אין אומרים תחנון מר״ה עד אחרי יו״כ',
    noteEnglish: 'Rosh Hashana — No Tachanun from Rosh Hashana through after Yom Kippur',
    source: 'לוח א״י, תשרי',
  },
  {
    hebrewMonth: 7, hebrewDay: 1,
    category: 'minhag',
    noteHebrew: 'תקיעת שופר — מאה קולות. מנהג ירושלים: תוקעים גם בישיבה',
    noteEnglish: 'Shofar blowing — 100 blasts. Jerusalem custom: blow also while seated',
    source: 'לוח א״י, הל׳ ר״ה',
  },
  {
    hebrewMonth: 7, hebrewDay: 2,
    category: 'minhag',
    noteHebrew: 'ראש השנה יום שני — פרי חדש לשהחיינו בלילה',
    noteEnglish: 'Rosh Hashana second day — new fruit for Shehecheyanu at night',
    source: 'שו״ע או״ח תר׳ ס״א',
  },
  {
    hebrewMonth: 7, hebrewDay: 3,
    category: 'halacha',
    noteHebrew: 'צום גדליה — תענית ציבור',
    noteEnglish: 'Fast of Gedaliah — public fast day',
    source: 'שו״ע או״ח תקמ״ט',
  },
  {
    hebrewMonth: 7, hebrewDay: 10,
    category: 'tefillah',
    noteHebrew: 'יום כיפור — כל נדרי, חמש תפילות, נעילה',
    noteEnglish: 'Yom Kippur — Kol Nidrei, five tefillos, Neilah',
    source: 'לוח א״י, יו״כ',
  },
  {
    hebrewMonth: 7, hebrewDay: 10,
    category: 'halacha',
    noteHebrew: 'חמישה עינויים: אכילה, שתיה, רחיצה, סיכה, נעילת הסנדל',
    noteEnglish: 'Five afflictions: eating, drinking, washing, anointing, leather shoes',
    source: 'יומא עג:',
  },
  {
    hebrewMonth: 7, hebrewDay: 15,
    category: 'tefillah',
    noteHebrew: 'סוכות — הלל שלם, הושענות, ניסוך המים',
    noteEnglish: 'Sukkos — Full Hallel, Hoshanot, water libation',
    source: 'לוח א״י, סוכות',
  },
  {
    hebrewMonth: 7, hebrewDay: 15,
    category: 'minhag',
    noteHebrew: 'נוהגים לישון בסוכה בא״י. אושפיזין: אברהם אבינו',
    noteEnglish: 'Custom to sleep in sukkah in Eretz Yisrael. Ushpizin: Avraham Avinu',
    source: 'לוח א״י',
  },
  {
    hebrewMonth: 7, hebrewDay: 21,
    category: 'tefillah',
    noteHebrew: 'הושענא רבה — שבע הקפות, חיבוט ערבה',
    noteEnglish: 'Hoshana Rabbah — seven hakafot, beating the aravah',
    source: 'שו״ע או״ח תרס״ד',
  },
  {
    hebrewMonth: 7, hebrewDay: 22,
    category: 'tefillah',
    noteHebrew: 'שמיני עצרת — מתחילים משיב הרוח ומוריד הגשם במוסף',
    noteEnglish: 'Shmini Atzeres — Begin Mashiv HaRuach U\'Morid HaGeshem at Mussaf',
    source: 'לוח א״י, שמע״צ',
  },
  {
    hebrewMonth: 7, hebrewDay: 22,
    category: 'tefillah',
    noteHebrew: 'תפילת גשם — אומרים תפילת גשם במוסף',
    noteEnglish: 'Tefillas Geshem — recite the prayer for rain at Mussaf',
    source: 'שו״ע או״ח קי״ד',
  },
  {
    hebrewMonth: 7, hebrewDay: 22,
    category: 'minhag',
    noteHebrew: 'שמחת תורה בא״י — הקפות וסיום התורה',
    noteEnglish: 'Simchas Torah in Eretz Yisrael — Hakafot and completion of the Torah',
    source: 'לוח א״י',
  },

  // ── Cheshvan (8) ──────────────────────────────────────────────
  {
    hebrewMonth: 8, hebrewDay: 7,
    category: 'tefillah',
    noteHebrew: 'מתחילים ״ותן טל ומטר לברכה״ בערבית (בא״י)',
    noteEnglish: 'Begin reciting V\'sein Tal U\'Matar in Maariv (in Eretz Yisrael)',
    source: 'שו״ע או״ח קי״ז',
  },
  {
    hebrewMonth: 8, hebrewDay: 1,
    category: 'tefillah',
    noteHebrew: 'ראש חודש חשון — יעלה ויבוא, חצי הלל',
    noteEnglish: 'Rosh Chodesh Cheshvan — Ya\'aleh V\'Yavo, Half Hallel',
    source: 'שו״ע או״ח תכ״ב',
  },

  // ── Kislev (9) ──────────────────────────────────────────────
  {
    hebrewMonth: 9, hebrewDay: 1,
    category: 'tefillah',
    noteHebrew: 'ראש חודש כסלו — יעלה ויבוא, חצי הלל',
    noteEnglish: 'Rosh Chodesh Kislev — Ya\'aleh V\'Yavo, Half Hallel',
    source: 'שו״ע או״ח תכ״ב',
  },
  {
    hebrewMonth: 9, hebrewDay: 25,
    category: 'tefillah',
    noteHebrew: 'חנוכה — הלל שלם, על הנסים, הדלקת נרות',
    noteEnglish: 'Chanukah — Full Hallel, Al HaNissim, candle lighting',
    source: 'שו״ע או״ח תר״ע—תרפ״ב',
  },
  {
    hebrewMonth: 9, hebrewDay: 25,
    category: 'minhag',
    noteHebrew: 'מנהג ירושלים: מדליקים בפתח הבית מבחוץ',
    noteEnglish: 'Jerusalem custom: light at the doorway outside the home',
    source: 'לוח א״י, חנוכה',
  },
  {
    hebrewMonth: 9, hebrewDay: 25,
    category: 'halacha',
    noteHebrew: 'אין תחנון כל ימי חנוכה (כ״ה כסלו — ב׳ טבת)',
    noteEnglish: 'No Tachanun throughout Chanukah (25 Kislev — 2 Teves)',
    source: 'שו״ע או״ח תרפ״ג',
  },

  // ── Teves (10) ──────────────────────────────────────────────
  {
    hebrewMonth: 10, hebrewDay: 2,
    category: 'tefillah',
    noteHebrew: 'יום אחרון של חנוכה — זאת חנוכה. הלל שלם',
    noteEnglish: 'Last day of Chanukah — Zos Chanukah. Full Hallel',
    source: 'לוח א״י',
  },
  {
    hebrewMonth: 10, hebrewDay: 10,
    category: 'halacha',
    noteHebrew: 'עשרה בטבת — תענית ציבור, צום על מצור ירושלים',
    noteEnglish: 'Tenth of Teves — public fast, commemorating siege of Jerusalem',
    source: 'שו״ע או״ח תק״נ',
  },

  // ── Shevat (11) ──────────────────────────────────────────────
  {
    hebrewMonth: 11, hebrewDay: 1,
    category: 'tefillah',
    noteHebrew: 'ראש חודש שבט — יעלה ויבוא, חצי הלל',
    noteEnglish: 'Rosh Chodesh Shevat — Ya\'aleh V\'Yavo, Half Hallel',
    source: 'שו״ע או״ח תכ״ב',
  },
  {
    hebrewMonth: 11, hebrewDay: 15,
    category: 'minhag',
    noteHebrew: 'ט״ו בשבט — ראש השנה לאילנות. אוכלים פירות א״י',
    noteEnglish: 'Tu B\'Shvat — New Year for trees. Eat fruits of Eretz Yisrael',
    source: 'לוח א״י, שבט',
  },
  {
    hebrewMonth: 11, hebrewDay: 15,
    category: 'tefillah',
    noteHebrew: 'אין אומרים תחנון בט״ו בשבט',
    noteEnglish: 'No Tachanun on Tu B\'Shvat',
    source: 'משנ״ב תקע״ב',
  },

  // ── Adar (12) ──────────────────────────────────────────────
  {
    hebrewMonth: 12, hebrewDay: 1,
    category: 'tefillah',
    noteHebrew: 'ראש חודש אדר — יעלה ויבוא, חצי הלל. משנכנס אדר מרבין בשמחה',
    noteEnglish: 'Rosh Chodesh Adar — Ya\'aleh V\'Yavo, Half Hallel. Increase joy in Adar',
    source: 'תענית כט.',
  },
  {
    hebrewMonth: 12, hebrewDay: 13,
    category: 'halacha',
    noteHebrew: 'תענית אסתר — תענית ציבור לפני פורים',
    noteEnglish: 'Fast of Esther — public fast before Purim',
    source: 'שו״ע או״ח תרפ״ו',
  },
  {
    hebrewMonth: 12, hebrewDay: 14,
    category: 'tefillah',
    noteHebrew: 'פורים — מגילה, על הנסים, משלוח מנות ומתנות לאביונים',
    noteEnglish: 'Purim — Megillah, Al HaNissim, Mishloach Manos, Matanos La\'evyonim',
    source: 'שו״ע או״ח תרצ״ג—תרצ״ד',
  },
  {
    hebrewMonth: 12, hebrewDay: 14,
    category: 'minhag',
    noteHebrew: 'אין אומרים תחנון בי״ד וט״ו אדר',
    noteEnglish: 'No Tachanun on 14th and 15th of Adar',
    source: 'שו״ע או״ח תרצ״ז',
  },
  {
    hebrewMonth: 12, hebrewDay: 15,
    category: 'minhag',
    noteHebrew: 'שושן פורים — פורים בירושלים המוקפת חומה',
    noteEnglish: 'Shushan Purim — Purim in walled cities (Jerusalem)',
    source: 'שו״ע או״ח תרפ״ח',
  },

  // ── Nissan (1) ──────────────────────────────────────────────
  {
    hebrewMonth: 1, hebrewDay: 1,
    category: 'tefillah',
    noteHebrew: 'ראש חודש ניסן — אין אומרים תחנון כל חודש ניסן',
    noteEnglish: 'Rosh Chodesh Nissan — No Tachanun the entire month of Nissan',
    source: 'שו״ע או״ח תכ״ט',
  },
  {
    hebrewMonth: 1, hebrewDay: 14,
    category: 'halacha',
    noteHebrew: 'ערב פסח — בדיקת חמץ (בליל י״ד), ביעור חמץ, תענית בכורות',
    noteEnglish: 'Erev Pesach — Bedikas Chametz (night of 14th), burning chametz, fast of firstborn',
    source: 'שו״ע או״ח תל״א, תע״ב',
  },
  {
    hebrewMonth: 1, hebrewDay: 15,
    category: 'tefillah',
    noteHebrew: 'פסח — הלל שלם (לילה ראשון וביום), יעלה ויבוא',
    noteEnglish: 'Pesach — Full Hallel (first night and day), Ya\'aleh V\'Yavo',
    source: 'שו״ע או״ח תפ״ז',
  },
  {
    hebrewMonth: 1, hebrewDay: 15,
    category: 'tefillah',
    noteHebrew: 'מפסיקים ״ותן טל ומטר״ — אומרים ״ותן ברכה״',
    noteEnglish: 'Stop reciting V\'sein Tal U\'Matar — say V\'sein Beracha',
    source: 'שו״ע או״ח קי״ז',
  },
  {
    hebrewMonth: 1, hebrewDay: 15,
    category: 'tefillah',
    noteHebrew: 'תפילת טל — במוסף ראשון של פסח. מפסיקים משיב הרוח, מתחילים מוריד הטל',
    noteEnglish: 'Tefillas Tal — at first Mussaf of Pesach. Stop Mashiv HaRuach, begin Morid HaTal',
    source: 'לוח א״י, פסח',
  },
  {
    hebrewMonth: 1, hebrewDay: 16,
    category: 'tefillah',
    noteHebrew: 'חול המועד פסח — חצי הלל, יעלה ויבוא',
    noteEnglish: 'Chol HaMoed Pesach — Half Hallel, Ya\'aleh V\'Yavo',
    source: 'שו״ע או״ח תצ״ ס״ד',
  },
  {
    hebrewMonth: 1, hebrewDay: 16,
    category: 'seasonal',
    noteHebrew: 'מתחילים ספירת העומר מליל ט״ז ניסן',
    noteEnglish: 'Begin counting Sefiras HaOmer from the night of 16 Nissan',
    source: 'שו״ע או״ח תפ״ט',
  },
  {
    hebrewMonth: 1, hebrewDay: 21,
    category: 'tefillah',
    noteHebrew: 'שביעי של פסח — שירת הים. הלל שלם בא״י',
    noteEnglish: 'Seventh day of Pesach — Shiras HaYam. Full Hallel in Eretz Yisrael',
    source: 'לוח א״י',
  },

  // ── Iyar (2) ──────────────────────────────────────────────
  {
    hebrewMonth: 2, hebrewDay: 1,
    category: 'tefillah',
    noteHebrew: 'ראש חודש אייר — יעלה ויבוא, חצי הלל',
    noteEnglish: 'Rosh Chodesh Iyar — Ya\'aleh V\'Yavo, Half Hallel',
    source: 'שו״ע או״ח תכ״ב',
  },
  {
    hebrewMonth: 2, hebrewDay: 14,
    category: 'halacha',
    noteHebrew: 'פסח שני — אין אומרים תחנון',
    noteEnglish: 'Pesach Sheini — No Tachanun',
    source: 'לוח א״י, אייר',
  },
  {
    hebrewMonth: 2, hebrewDay: 18,
    category: 'minhag',
    noteHebrew: 'ל״ג בעומר — אין אומרים תחנון. מותר להסתפר ולשמוע מוזיקה',
    noteEnglish: 'Lag B\'Omer — No Tachanun. Haircuts and music permitted',
    source: 'שו״ע או״ח תצ״ג',
  },
  {
    hebrewMonth: 2, hebrewDay: 18,
    category: 'minhag',
    noteHebrew: 'מנהג ירושלים: עולים לקבר רשב״י במירון',
    noteEnglish: 'Jerusalem custom: pilgrimage to the grave of Rashbi in Meron',
    source: 'לוח א״י',
  },

  // ── Sivan (3) ──────────────────────────────────────────────
  {
    hebrewMonth: 3, hebrewDay: 1,
    category: 'tefillah',
    noteHebrew: 'ראש חודש סיון — יעלה ויבוא, חצי הלל',
    noteEnglish: 'Rosh Chodesh Sivan — Ya\'aleh V\'Yavo, Half Hallel',
    source: 'שו״ע או״ח תכ״ב',
  },
  {
    hebrewMonth: 3, hebrewDay: 6,
    category: 'tefillah',
    noteHebrew: 'שבועות — חג מתן תורתנו. הלל שלם, יעלה ויבוא, אקדמות',
    noteEnglish: 'Shavuos — Festival of the Giving of the Torah. Full Hallel, Ya\'aleh V\'Yavo, Akdamus',
    source: 'שו״ע או״ח תצ״ד',
  },
  {
    hebrewMonth: 3, hebrewDay: 6,
    category: 'minhag',
    noteHebrew: 'מנהג אכילת מאכלי חלב בשבועות. תיקון ליל שבועות',
    noteEnglish: 'Custom of eating dairy on Shavuos. All-night Torah study (Tikkun)',
    source: 'רמ״א או״ח תצ״ד',
  },
  {
    hebrewMonth: 3, hebrewDay: 6,
    category: 'tefillah',
    noteHebrew: 'אין אומרים תחנון מר״ח סיון עד י״ב סיון (שבעת ימי תשלומין)',
    noteEnglish: 'No Tachanun from Rosh Chodesh Sivan through 12 Sivan (Tashlumim days)',
    source: 'לוח א״י, סיון',
  },

  // ── Tammuz (4) ──────────────────────────────────────────────
  {
    hebrewMonth: 4, hebrewDay: 1,
    category: 'tefillah',
    noteHebrew: 'ראש חודש תמוז — יעלה ויבוא, חצי הלל',
    noteEnglish: 'Rosh Chodesh Tammuz — Ya\'aleh V\'Yavo, Half Hallel',
    source: 'שו״ע או״ח תכ״ב',
  },
  {
    hebrewMonth: 4, hebrewDay: 17,
    category: 'halacha',
    noteHebrew: 'שבעה עשר בתמוז — תענית ציבור. תחילת ימי בין המצרים',
    noteEnglish: '17th of Tammuz — public fast. Beginning of the Three Weeks',
    source: 'שו״ע או״ח תקמ״ט',
  },
  {
    hebrewMonth: 4, hebrewDay: 17,
    category: 'seasonal',
    noteHebrew: 'מתחילים ימי בין המצרים — אין שומעים מוזיקה, אין נושאים נשים',
    noteEnglish: 'Three Weeks begin — no music, no weddings',
    source: 'שו״ע או״ח תקנ״א',
  },

  // ── Av (5) ──────────────────────────────────────────────
  {
    hebrewMonth: 5, hebrewDay: 1,
    category: 'seasonal',
    noteHebrew: 'ראש חודש אב — תחילת תשעת הימים. ממעטים בשמחה',
    noteEnglish: 'Rosh Chodesh Av — beginning of the Nine Days. Decrease joy',
    source: 'שו״ע או״ח תקנ״א',
  },
  {
    hebrewMonth: 5, hebrewDay: 1,
    category: 'halacha',
    noteHebrew: 'תשעת הימים — אין אוכלים בשר ואין שותים יין (חוץ משבת)',
    noteEnglish: 'Nine Days — no meat or wine (except Shabbos)',
    source: 'שו״ע או״ח תקנ״א ס״ט',
  },
  {
    hebrewMonth: 5, hebrewDay: 9,
    category: 'halacha',
    noteHebrew: 'תשעה באב — תענית ציבור. חמישה עינויים כיו״כ',
    noteEnglish: 'Tisha B\'Av — public fast. Five afflictions like Yom Kippur',
    source: 'שו״ע או״ח תקנ״ב—תקנ״ז',
  },
  {
    hebrewMonth: 5, hebrewDay: 9,
    category: 'tefillah',
    noteHebrew: 'קריאת קינות. אין מניחים תפילין בשחרית, מניחים במנחה',
    noteEnglish: 'Recite Kinnos. No tefillin at Shacharis; put on at Mincha',
    source: 'שו״ע או״ח תקנ״ה',
  },
  {
    hebrewMonth: 5, hebrewDay: 15,
    category: 'minhag',
    noteHebrew: 'ט״ו באב — אין אומרים תחנון. יום שמחה',
    noteEnglish: 'Tu B\'Av — No Tachanun. Day of joy',
    source: 'תענית ל:',
  },

  // ── Elul (6) ──────────────────────────────────────────────
  {
    hebrewMonth: 6, hebrewDay: 1,
    category: 'tefillah',
    noteHebrew: 'ראש חודש אלול — מתחילים לתקוע שופר בשחרית',
    noteEnglish: 'Rosh Chodesh Elul — begin blowing shofar at Shacharis',
    source: 'שו״ע או״ח תקפ״א',
  },
  {
    hebrewMonth: 6, hebrewDay: 1,
    category: 'minhag',
    noteHebrew: 'מתחילים לומר ל״ד מזמור ״לדוד ה׳ אורי״ עד הושענא רבה',
    noteEnglish: 'Begin reciting Psalm 27 "L\'Dovid Hashem Ori" until Hoshana Rabbah',
    source: 'לוח א״י, אלול',
  },
  {
    hebrewMonth: 6, hebrewDay: 25,
    category: 'seasonal',
    noteHebrew: 'סליחות — מנהג ספרד/ירושלים: מתחילים סליחות מר״ח אלול',
    noteEnglish: 'Selichos — Sefardi/Jerusalem custom: Selichos from Rosh Chodesh Elul',
    source: 'לוח א״י, אלול',
  },
  {
    hebrewMonth: 6, hebrewDay: 29,
    category: 'tefillah',
    noteHebrew: 'ערב ראש השנה — סליחות מיוחדות. אין תוקעים שופר',
    noteEnglish: 'Erev Rosh Hashana — special Selichos. No shofar blowing',
    source: 'שו״ע או״ח תקפ״א',
  },

  // ── Sefira period notes (cross-month) ──────────────────────
  {
    hebrewMonth: 1, hebrewDay: 17,
    category: 'seasonal',
    noteHebrew: 'ימי ספירת העומר — מנהגי אבלות: אין תספורת, אין נישואין',
    noteEnglish: 'Sefira period — mourning customs: no haircuts, no weddings',
    source: 'שו״ע או״ח תצ״ג',
  },

  // ── Additional Shabbos notes ───────────────────────────────
  {
    hebrewMonth: 7, hebrewDay: 15,
    category: 'seasonal',
    noteHebrew: 'שבת חול המועד סוכות — קוראים קהלת',
    noteEnglish: 'Shabbos Chol HaMoed Sukkos — read Koheles (Ecclesiastes)',
    source: 'לוח א״י, סוכות',
  },
  {
    hebrewMonth: 1, hebrewDay: 15,
    category: 'seasonal',
    noteHebrew: 'שבת חול המועד פסח — קוראים שיר השירים',
    noteEnglish: 'Shabbos Chol HaMoed Pesach — read Shir HaShirim (Song of Songs)',
    source: 'לוח א״י, פסח',
  },
  {
    hebrewMonth: 3, hebrewDay: 6,
    category: 'seasonal',
    noteHebrew: 'קוראים מגילת רות בשבועות',
    noteEnglish: 'Read Megillas Ruth on Shavuos',
    source: 'לוח א״י, שבועות',
  },

  // ── Vesein Tal Umatar for chutz la'aretz ──────────────────
  {
    hebrewMonth: 8, hebrewDay: 7,
    category: 'seasonal',
    noteHebrew: 'בא״י שואלים טל ומטר מז׳ חשון. בחו״ל מתחילים ס׳ יום אחרי תקופת תשרי',
    noteEnglish: 'In Eretz Yisrael ask for rain from 7 Cheshvan. In chutz la\'aretz 60 days after Tekufas Tishrei',
    source: 'שו״ע או״ח קי״ז',
  },

  // ── Rosh Chodesh general ──────────────────────────────────
  {
    hebrewMonth: 4, hebrewDay: 1,
    category: 'tefillah',
    noteHebrew: 'ראש חודש — מוסף, חצי הלל, יעלה ויבוא. אין תחנון',
    noteEnglish: 'Rosh Chodesh — Mussaf, Half Hallel, Ya\'aleh V\'Yavo. No Tachanun',
    source: 'שו״ע או״ח תכ״ב',
  },

  // ── Shabbos general notes ─────────────────────────────────
  {
    hebrewMonth: 7, hebrewDay: 10,
    category: 'seasonal',
    noteHebrew: 'שבת שובה — השבת שבין ר״ה ליו״כ. דרשת שבת שובה',
    noteEnglish: 'Shabbos Shuva — Shabbos between Rosh Hashana and Yom Kippur. Special drasha',
    source: 'לוח א״י, תשרי',
  },

  // ── Additional seasonal ───────────────────────────────────
  {
    hebrewMonth: 5, hebrewDay: 1,
    category: 'tefillah',
    noteHebrew: 'ראש חודש אב — יעלה ויבוא, חצי הלל',
    noteEnglish: 'Rosh Chodesh Av — Ya\'aleh V\'Yavo, Half Hallel',
    source: 'שו״ע או״ח תכ״ב',
  },
  {
    hebrewMonth: 6, hebrewDay: 1,
    category: 'tefillah',
    noteHebrew: 'ראש חודש אלול — יעלה ויבוא, חצי הלל',
    noteEnglish: 'Rosh Chodesh Elul — Ya\'aleh V\'Yavo, Half Hallel',
    source: 'שו״ע או״ח תכ״ב',
  },
  {
    hebrewMonth: 10, hebrewDay: 1,
    category: 'tefillah',
    noteHebrew: 'ראש חודש טבת — יעלה ויבוא, חצי הלל. עדיין בתוך חנוכה',
    noteEnglish: 'Rosh Chodesh Teves — Ya\'aleh V\'Yavo, Half Hallel. Still within Chanukah',
    source: 'שו״ע או״ח תכ״ב',
  },
  {
    hebrewMonth: 1, hebrewDay: 1,
    category: 'tefillah',
    noteHebrew: 'ראש חודש ניסן — יעלה ויבוא, חצי הלל',
    noteEnglish: 'Rosh Chodesh Nissan — Ya\'aleh V\'Yavo, Half Hallel',
    source: 'שו״ע או״ח תכ״ב',
  },
];

export function getNotesForDate(month: number, day: number): TukachinskyNote[] {
  return TUKACHINSKY_NOTES.filter(
    (note) => note.hebrewMonth === month && note.hebrewDay === day,
  );
}

/**
 * Return notes whose date falls within a range.
 * Handles wrap-around when startMonth > endMonth (e.g. Elul → Cheshvan).
 */
export function getNotesForPeriod(
  startMonth: number,
  startDay: number,
  endMonth: number,
  endDay: number,
): TukachinskyNote[] {
  const wraps = startMonth > endMonth || (startMonth === endMonth && startDay > endDay);

  return TUKACHINSKY_NOTES.filter((note) => {
    const m = note.hebrewMonth;
    const d = note.hebrewDay;

    if (wraps) {
      // Range crosses Adar→Nissan boundary (month 12/13 → 1)
      const afterStart = m > startMonth || (m === startMonth && d >= startDay);
      const beforeEnd = m < endMonth || (m === endMonth && d <= endDay);
      return afterStart || beforeEnd;
    }

    const afterStart = m > startMonth || (m === startMonth && d >= startDay);
    const beforeEnd = m < endMonth || (m === endMonth && d <= endDay);
    return afterStart && beforeEnd;
  });
}

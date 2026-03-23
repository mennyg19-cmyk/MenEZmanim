/**
 * Default demo content (matches former in-memory web store).
 */
import type { DisplayStyle } from '@zmanim-app/core';

export const DEMO_ORG_ID = 'default';
export const DEMO_ORG_SLUG = 'demo';

/**
 * Polished demo layout — 1920×1080 with framed boxes, analog clock header,
 * weekday schedule, shabbat schedule, announcements, date/parsha, zmanim, shiurim.
 * Uses a dark navy solid background with gold-classic frames on each box.
 */
export const DEMO_DISPLAY_STYLE: DisplayStyle = {
  id: 'default-style',
  name: 'Default Style',
  backgroundColor: '#1a1a2e',
  backgroundMode: 'solid',
  canvasWidth: 1920,
  canvasHeight: 1080,
  objects: [
    // ── Header bar ──
    {
      id: 'header-bar',
      type: 'PLAIN_TEXT' as never,
      name: 'Header Bar',
      position: { x: 0, y: 0, width: 1920, height: 90 },
      zIndex: 5,
      font: { family: 'David Libre, serif', size: 42, bold: true, italic: false, color: '#f5e6c8' },
      backgroundColor: '#16213e',
      language: 'hebrew',
      content: { text: 'קהילת בית הכנסת', textAlign: 'center', verticalAlign: 'middle' },
      visible: true,
    },
    // ── Analog Clock (top-left) ──
    {
      id: 'analog-clock',
      type: 'ANALOG_CLOCK' as never,
      name: 'Analog Clock',
      position: { x: 20, y: 5, width: 80, height: 80 },
      zIndex: 15,
      font: { family: 'David Libre, serif', size: 14, bold: false, italic: false, color: '#f5e6c8' },
      backgroundColor: 'transparent',
      language: 'english',
      content: { showNumbers: true, showSeconds: true, faceColor: '#16213e', handColor: '#d4a843', numberColor: '#f5e6c8' },
      visible: true,
    },
    // ── Digital Clock (top-right) ──
    {
      id: 'digital-clock',
      type: 'DIGITAL_CLOCK' as never,
      name: 'Digital Clock',
      position: { x: 1620, y: 5, width: 290, height: 80 },
      zIndex: 15,
      font: { family: 'David Libre, serif', size: 48, bold: false, italic: false, color: '#d4a843' },
      backgroundColor: 'transparent',
      language: 'english',
      content: { format24h: false, showSeconds: true, showAmPm: true },
      visible: true,
    },
    // ── Jewish Date & Parsha (top-center, below header) ──
    {
      id: 'jewish-info',
      type: 'JEWISH_INFO' as never,
      name: 'Date & Parsha',
      position: { x: 560, y: 100, width: 800, height: 55 },
      zIndex: 10,
      font: { family: 'David Libre, serif', size: 28, bold: true, italic: false, color: '#f5e6c8' },
      backgroundColor: '#16213e',
      language: 'hebrew',
      content: {
        showItems: { date: true, parsha: true, holiday: true, dayOfWeek: true },
        layout: 'horizontal',
        horizontalSeparator: '  ~  ',
        frameId: 'gold-classic',
        frameThickness: 0.6,
      },
      visible: true,
    },
    // ── Weekday Schedule (left column) ──
    {
      id: 'weekday-schedule',
      type: 'EVENTS_TABLE' as never,
      name: 'תפילות חול',
      position: { x: 20, y: 170, width: 460, height: 520 },
      zIndex: 10,
      font: { family: 'David Libre, serif', size: 18, bold: false, italic: false, color: '#e8d5b7' },
      backgroundColor: '#16213e',
      language: 'hebrew',
      content: {
        groupIds: ['g-chol'],
        title: 'Weekday',
        titleHebrew: 'תפילות חול',
        use24h: false,
        showRoom: true,
        showHeader: true,
        headerBg: '#d4a843',
        headerColor: '#1a1a2e',
        headerFontSize: 22,
        columns: 1,
        displayMode: 'table',
        frameId: 'gold-classic',
        frameThickness: 0.5,
      },
      visible: true,
    },
    // ── Shabbat Schedule (right column) ──
    {
      id: 'shabbat-schedule',
      type: 'EVENTS_TABLE' as never,
      name: 'תפילות שבת',
      position: { x: 1440, y: 170, width: 460, height: 520 },
      zIndex: 10,
      font: { family: 'David Libre, serif', size: 18, bold: false, italic: false, color: '#e8d5b7' },
      backgroundColor: '#16213e',
      language: 'hebrew',
      content: {
        groupIds: ['g-shabbat'],
        title: 'Shabbat',
        titleHebrew: 'תפילות שבת',
        use24h: false,
        showRoom: true,
        showHeader: true,
        headerBg: '#d4a843',
        headerColor: '#1a1a2e',
        headerFontSize: 22,
        columns: 1,
        displayMode: 'table',
        frameId: 'gold-classic',
        frameThickness: 0.5,
      },
      visible: true,
    },
    // ── Announcements (center-top) ──
    {
      id: 'announcements',
      type: 'PLAIN_TEXT' as never,
      name: 'הודעות',
      position: { x: 500, y: 170, width: 460, height: 200 },
      zIndex: 10,
      font: { family: 'David Libre, serif', size: 18, bold: false, italic: false, color: '#e8d5b7' },
      backgroundColor: '#16213e',
      language: 'hebrew',
      content: {
        text: 'הודעות הקהילה יופיעו כאן',
        textAlign: 'center',
        verticalAlign: 'middle',
        frameId: 'gold-classic',
        frameThickness: 0.5,
      },
      visible: true,
    },
    // ── Shiurim / Drashot (center-bottom-left) ──
    {
      id: 'shiurim',
      type: 'PLAIN_TEXT' as never,
      name: 'דרשות שבת',
      position: { x: 500, y: 390, width: 300, height: 180 },
      zIndex: 10,
      font: { family: 'David Libre, serif', size: 18, bold: false, italic: false, color: '#e8d5b7' },
      backgroundColor: '#16213e',
      language: 'hebrew',
      content: {
        text: 'דרשות שבת',
        textAlign: 'center',
        verticalAlign: 'middle',
        frameId: 'gold-classic',
        frameThickness: 0.5,
      },
      visible: true,
    },
    // ── Mazal Tov (center-bottom-right) ──
    {
      id: 'mazal-tov',
      type: 'PLAIN_TEXT' as never,
      name: 'מזל טוב',
      position: { x: 820, y: 390, width: 300, height: 180 },
      zIndex: 10,
      font: { family: 'David Libre, serif', size: 18, bold: false, italic: false, color: '#e8d5b7' },
      backgroundColor: '#16213e',
      language: 'hebrew',
      content: {
        text: 'מזל טוב',
        textAlign: 'center',
        verticalAlign: 'middle',
        frameId: 'gold-classic',
        frameThickness: 0.5,
      },
      visible: true,
    },
    // ── Zmanim of the Day (bottom-right) ──
    {
      id: 'zmanim-table',
      type: 'ZMANIM_TABLE' as never,
      name: 'זמני היום',
      position: { x: 1140, y: 590, width: 760, height: 440 },
      zIndex: 10,
      font: { family: 'David Libre, serif', size: 18, bold: false, italic: false, color: '#e8d5b7' },
      backgroundColor: '#16213e',
      language: 'hebrew',
      content: {
        titleHebrew: 'זמני היום',
        headerColor: '#d4a843',
        highlightColor: '#f5e6c8',
        showBorder: false,
        compact: true,
        columns: 2,
        frameId: 'gold-classic',
        frameThickness: 0.5,
      },
      visible: true,
    },
    // ── Yahrzeit Display (bottom-left) ──
    {
      id: 'yahrzeit',
      type: 'YAHRZEIT_DISPLAY' as never,
      name: 'יארצייט',
      position: { x: 20, y: 710, width: 460, height: 200 },
      zIndex: 10,
      font: { family: 'David Libre, serif', size: 18, bold: false, italic: false, color: '#e8d5b7' },
      backgroundColor: '#16213e',
      language: 'hebrew',
      content: {
        titleHebrew: 'יארצייט',
        showBorder: false,
        frameId: 'gold-classic',
        frameThickness: 0.5,
      },
      visible: true,
    },
    // ── Scrolling Announcements Ticker (bottom) ──
    {
      id: 'ticker',
      type: 'SCROLLING_TICKER' as never,
      name: 'Announcements Ticker',
      position: { x: 0, y: 1040, width: 1920, height: 40 },
      zIndex: 20,
      font: { family: 'David Libre, serif', size: 20, bold: false, italic: false, color: '#f5e6c8' },
      backgroundColor: '#d4a843',
      language: 'hebrew',
      content: { speed: 50, separator: '   ✦   ' },
      visible: true,
    },
    // ── Sefira Counter (center-bottom) ──
    {
      id: 'sefira',
      type: 'SEFIRA_COUNTER' as never,
      name: 'ספירת העומר',
      position: { x: 500, y: 590, width: 620, height: 150 },
      zIndex: 10,
      font: { family: 'David Libre, serif', size: 20, bold: false, italic: false, color: '#e8d5b7' },
      backgroundColor: '#16213e',
      language: 'hebrew',
      content: {
        showEnglish: false,
        frameId: 'gold-classic',
        frameThickness: 0.5,
      },
      visible: true,
    },
    // ── Media Viewer (center-bottom) ──
    {
      id: 'community-media',
      type: 'MEDIA_VIEWER' as never,
      name: 'Community Media',
      position: { x: 500, y: 760, width: 620, height: 260 },
      zIndex: 10,
      font: { family: 'David Libre, serif', size: 14, bold: false, italic: false, color: '#e8d5b7' },
      backgroundColor: '#16213e',
      language: 'english',
      content: {
        rotationInterval: 10,
        fit: 'contain',
        showTransition: true,
        frameId: 'gold-classic',
        frameThickness: 0.5,
      },
      visible: true,
    },
    // ── Yahrzeit bottom-right fill ──
    {
      id: 'yahrzeit-bottom',
      type: 'YAHRZEIT_DISPLAY' as never,
      name: 'יארצייט - נוסף',
      position: { x: 20, y: 930, width: 460, height: 100 },
      zIndex: 10,
      font: { family: 'David Libre, serif', size: 16, bold: false, italic: false, color: '#e8d5b7' },
      backgroundColor: '#16213e',
      language: 'hebrew',
      content: {
        titleHebrew: 'נשמות',
        showBorder: false,
        frameId: 'gold-classic',
        frameThickness: 0.5,
      },
      visible: true,
    },
  ],
  activationRules: [{ type: 'default' }],
  sortOrder: 0,
};

export const DEMO_GROUPS = [
  { id: 'g-chol', name: 'Weekday', nameHebrew: 'חול', color: '#3b82f6', sortOrder: 0, active: true },
  { id: 'g-shabbat', name: 'Shabbat', nameHebrew: 'שבת', color: '#8b5cf6', sortOrder: 1, active: true },
  { id: 'g-zmanim', name: 'Zmanim', nameHebrew: 'זמנים', color: '#10b981', sortOrder: 2, active: true },
  { id: 'g-zmanim2', name: 'Zmanim 2', nameHebrew: 'זמנים 2', color: '#10b981', sortOrder: 3, active: true },
  { id: 'g-rh', name: 'Rosh Hashana', nameHebrew: 'ראש השנה', color: '#f59e0b', sortOrder: 4, active: true },
  { id: 'g-yk', name: 'Yom Kippur', nameHebrew: 'יום כיפור', color: '#f59e0b', sortOrder: 5, active: true },
  { id: 'g-sukkot', name: 'Sukkot', nameHebrew: 'סוכות', color: '#22c55e', sortOrder: 6, active: true },
  { id: 'g-pesach', name: 'Pesach', nameHebrew: 'פסח', color: '#22c55e', sortOrder: 7, active: true },
  { id: 'g-shavuot', name: 'Shavuot', nameHebrew: 'שבועות', color: '#22c55e', sortOrder: 8, active: true },
  { id: 'g-taanit', name: 'Fast Day', nameHebrew: 'תענית', color: '#ef4444', sortOrder: 9, active: true },
  { id: 'g-purim', name: 'Purim', nameHebrew: 'פורים', color: '#ec4899', sortOrder: 10, active: true },
] as const;

export type ScheduleSeed = {
  id: string;
  name: string;
  type: string;
  groupId?: string;
  baseZman?: string;
  fixedTime?: string;
  offset?: number;
  room?: string;
  sortOrder: number;
  limitBefore?: string;
};

export const DEMO_SCHEDULES: ScheduleSeed[] = [
  { id: 'sched-1', name: 'שחרית א\' (נץ) - עז"נ', type: 'Shacharit', groupId: 'g-chol', baseZman: 'netz', offset: -20, room: 'עזרת נשים', sortOrder: 0 },
  { id: 'sched-2', name: "שחרית ב'", type: 'Shacharit', groupId: 'g-chol', fixedTime: '07:00', sortOrder: 1 },
  { id: 'sched-3', name: 'שחרית ג\' - גן מח"ל', type: 'Shacharit', groupId: 'g-chol', fixedTime: '07:25', room: 'גן מחל', sortOrder: 2 },
  { id: 'sched-4', name: 'שחרית ד\' - עז"נ', type: 'Shacharit', groupId: 'g-chol', fixedTime: '07:45', room: 'עזרת נשים', sortOrder: 3 },
  { id: 'sched-5', name: 'שחרית ה\' - שטיבל', type: 'Shacharit', groupId: 'g-chol', fixedTime: '08:05', room: 'שטיבל', sortOrder: 4 },
  { id: 'sched-6', name: "שחרית ו'", type: 'Shacharit', groupId: 'g-chol', fixedTime: '08:30', sortOrder: 5 },
  { id: 'sched-7', name: 'שחרית ז\' - עז"נ', type: 'Shacharit', groupId: 'g-chol', baseZman: 'sofZmanShma', room: 'עזרת נשים', sortOrder: 6 },
  { id: 'sched-8', name: 'מנחה א\' - עז"נ', type: 'Mincha', groupId: 'g-chol', fixedTime: '13:00', room: 'עזרת נשים', sortOrder: 7 },
  { id: 'sched-9', name: "מנחה ב'", type: 'Mincha', groupId: 'g-chol', fixedTime: '13:05', sortOrder: 8 },
  { id: 'sched-10', name: "מנחה ג'", type: 'Mincha', groupId: 'g-chol', baseZman: 'shkia', offset: -15, sortOrder: 9 },
  { id: 'sched-11', name: "מנחה ד'", type: 'Mincha', groupId: 'g-chol', baseZman: 'minchaGedola', sortOrder: 10 },
  { id: 'sched-12', name: "מעריב א'", type: 'Maariv', groupId: 'g-chol', baseZman: 'tzeit', limitBefore: '17:30', sortOrder: 11 },
  { id: 'sched-13', name: "מעריב ב'", type: 'Maariv', groupId: 'g-chol', fixedTime: '19:00', sortOrder: 12 },
  { id: 'sched-14', name: "מעריב ג'", type: 'Maariv', groupId: 'g-chol', fixedTime: '20:30', sortOrder: 13 },
  { id: 'sched-15', name: 'מעריב ד\' - שטיבל', type: 'Maariv', groupId: 'g-chol', fixedTime: '22:00', room: 'שטיבל', sortOrder: 14 },
  { id: 'sched-16', name: "מעריב ה'", type: 'Maariv', groupId: 'g-chol', fixedTime: '22:30', sortOrder: 15 },
  { id: 'sched-17', name: 'הדלקת נרות', type: 'Other', groupId: 'g-shabbat', baseZman: 'shkia', offset: -40, sortOrder: 16 },
  { id: 'sched-18', name: 'מנחה ב\' וקבלת שבת', type: 'Mincha', groupId: 'g-shabbat', baseZman: 'shkia', offset: -20, sortOrder: 17 },
  { id: 'sched-19', name: 'מנחה ג\' וקב"ש - גן מח"ל', type: 'Mincha', groupId: 'g-shabbat', baseZman: 'shkia', offset: -15, room: 'גן מחל', sortOrder: 18 },
  { id: 'sched-20', name: "שחרית א'", type: 'Shacharit', groupId: 'g-shabbat', fixedTime: '06:30', sortOrder: 19 },
  { id: 'sched-21', name: 'שחרית ב\' - גן מח"ל', type: 'Shacharit', groupId: 'g-shabbat', baseZman: 'sofZmanShma', offset: -30, room: 'גן מחל', sortOrder: 20 },
  { id: 'sched-22', name: "מעריב א'", type: 'Maariv', groupId: 'g-shabbat', baseZman: 'tzeit', offset: 0, sortOrder: 21 },
  { id: 'sched-23', name: "מעריב ב'", type: 'Maariv', groupId: 'g-shabbat', baseZman: 'tzeit', offset: 10, sortOrder: 22 },
  { id: 'sched-24', name: "מעריב ג'", type: 'Maariv', groupId: 'g-shabbat', baseZman: 'tzeit', offset: 20, sortOrder: 23 },
  { id: 'sched-25', name: "מעריב ד'", type: 'Maariv', groupId: 'g-shabbat', baseZman: 'tzeit', offset: 30, sortOrder: 24 },
  { id: 'sched-26', name: "מעריב ה'", type: 'Maariv', groupId: 'g-shabbat', baseZman: 'tzeit', offset: 40, sortOrder: 25 },
  { id: 'sched-27', name: "מעריב ו'", type: 'Maariv', groupId: 'g-shabbat', baseZman: 'tzeit', offset: 50, sortOrder: 26 },
];

export const DEMO_ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    title: 'Welcome to the Zmanim Display System',
    content: 'This display is powered by the new open-source zmanim application.',
    priority: 1,
    active: true,
  },
  {
    id: 'ann-2',
    title: 'Shabbat Shalom — שבת שלום',
    content: 'Wishing everyone a good Shabbos.',
    priority: 2,
    active: true,
  },
  {
    id: 'ann-3',
    title: 'Shiur after Maariv every evening',
    content: 'Daily shiur in Halacha.',
    priority: 1,
    active: true,
  },
  {
    id: 'ann-4',
    title: 'Community kiddush this Shabbos',
    titleHebrew: 'קידוש קהילתי',
    content: 'Sponsored by the Cohen family — all welcome after Mussaf in the social hall.',
    contentHebrew: 'חסכו לשבת — כולם מוזמנים לאחר מוסף באולם.',
    priority: 2,
    active: true,
  },
  {
    id: 'ann-5',
    title: 'Blood drive — Sunday 9:00 AM',
    titleHebrew: 'תרומת דם',
    content: 'Magen David Adom will be in the parking lot. Please register at the office.',
    priority: 1,
    active: true,
  },
  {
    id: 'ann-6',
    title: 'Thank you to our sponsors',
    titleHebrew: 'תודה לתורמים',
    content: 'This month’s sefer sponsorship: Feldman & Weiss. Shul maintenance: anonymous donor.',
    priority: 3,
    active: true,
  },
] as const;

export const DEMO_MEMORIALS = [
  {
    id: 'mem-1',
    hebrewName: 'אברהם בן יצחק',
    englishName: 'Avraham Feldman',
    hebrewDate: 'כ״ט תשרי',
    hebrewMonth: 7,
    hebrewDay: 29,
    relationship: 'Father of David Feldman',
    notes: 'Yahrzeit — candle after sunset',
  },
  {
    id: 'mem-2',
    hebrewName: 'שרה בת משה',
    englishName: 'Sarah Cohen',
    hebrewDate: 'י״ב כסלו',
    hebrewMonth: 9,
    hebrewDay: 12,
    relationship: 'Grandmother of the Cohen family',
  },
  {
    id: 'mem-3',
    hebrewName: 'יעקב בן דוד',
    englishName: 'Yaakov Weiss',
    hebrewDate: 'ג׳ ניסן',
    hebrewMonth: 1,
    hebrewDay: 3,
    relationship: 'Community member',
  },
] as const;

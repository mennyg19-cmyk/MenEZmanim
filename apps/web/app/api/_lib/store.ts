import type { DisplayStyle } from '@zmanim-app/core';

export interface Organization {
  id: string;
  name: string;
  nameHebrew: string;
  slug: string;
  location: {
    name: string;
    latitude: number;
    longitude: number;
    elevation: number;
    timezone: string;
    inIsrael: boolean;
  };
  settings: Record<string, unknown>;
}

export interface Screen {
  id: string;
  orgId: string;
  name: string;
  styleId: string;
  active: boolean;
  resolution?: string;
}

export interface Announcement {
  id: string;
  orgId: string;
  title: string;
  titleHebrew?: string;
  content: string;
  contentHebrew?: string;
  priority: number;
  active: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface Memorial {
  id: string;
  orgId: string;
  hebrewName: string;
  englishName?: string;
  hebrewDate: string;
  hebrewMonth: number;
  hebrewDay: number;
  relationship?: string;
  notes?: string;
}

export interface DaveningGroup {
  id: string;
  name: string;
  nameHebrew: string;
  color: string;
  sortOrder: number;
  active: boolean;
}

export type VisibilityCondition =
  | 'weekday' | 'shabbos' | 'chol_hamoed' | 'yom_tov'
  | 'fast_day' | 'erev_shabbos' | 'erev_chag' | 'erev_pesach'
  | 'chanukah' | 'behab' | 'rosh_chodesh' | 'purim'
  | 'dst_on' | 'dst_off';

export interface VisibilityRule {
  condition: VisibilityCondition;
  show: boolean;
}

export interface MinyanSchedule {
  id: string;
  orgId: string;
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

export interface MediaItem {
  id: string;
  orgId: string;
  url: string;
  filename: string;
  mimeType: string;
  uploadedAt: string;
}

const DEFAULT_ORG: Organization = {
  id: 'default',
  name: 'Default Synagogue',
  nameHebrew: 'בית הכנסת',
  slug: 'demo',
  location: {
    name: 'Jerusalem',
    latitude: 31.7683,
    longitude: 35.2137,
    elevation: 0,
    timezone: 'Asia/Jerusalem',
    inIsrael: true,
  },
  settings: {},
};

const font = (size: number, color = '#ffffff', family = 'system-ui, sans-serif', bold = false): any => ({
  family, size, bold, italic: false, color,
});

const DEFAULT_STYLE: DisplayStyle = {
  id: 'default-style',
  name: 'Default Style',
  backgroundColor: '#0f172a',
  canvasWidth: 1920,
  canvasHeight: 1080,
  objects: [
    {
      id: 'shul-name',
      type: 'PLAIN_TEXT' as any,
      name: 'Shul Name',
      position: { x: 0, y: 20, width: 1920, height: 70 },
      zIndex: 10,
      font: font(42, '#e2e8f0', 'system-ui, sans-serif', true),
      backgroundColor: 'transparent',
      language: 'hebrew' as const,
      content: { text: 'בית הכנסת — Default Synagogue', textAlign: 'center' },
      visible: true,
    },
    {
      id: 'digital-clock',
      type: 'DIGITAL_CLOCK' as any,
      name: 'Clock',
      position: { x: 1540, y: 15, width: 360, height: 80 },
      zIndex: 11,
      font: font(52, '#38bdf8'),
      backgroundColor: 'transparent',
      language: 'english' as const,
      content: { format24h: true, showSeconds: true },
      visible: true,
    },
    {
      id: 'jewish-date-he',
      type: 'JEWISH_INFO' as any,
      name: 'Jewish Date (Hebrew)',
      position: { x: 40, y: 110, width: 600, height: 260 },
      zIndex: 10,
      font: font(22, '#cbd5e1'),
      backgroundColor: 'rgba(30, 41, 59, 0.85)',
      language: 'hebrew' as const,
      content: {
        showItems: { date: true, parsha: true, holiday: true, dafYomi: true, tefilah: true },
      },
      visible: true,
    },
    {
      id: 'jewish-date-en',
      type: 'JEWISH_INFO' as any,
      name: 'Jewish Date (English)',
      position: { x: 40, y: 390, width: 600, height: 260 },
      zIndex: 10,
      font: font(20, '#94a3b8'),
      backgroundColor: 'rgba(30, 41, 59, 0.85)',
      language: 'english' as const,
      content: {
        showItems: { date: true, parsha: true, holiday: true, dafYomi: true, omer: true, tefilah: true },
      },
      visible: true,
    },
    {
      id: 'zmanim-table',
      type: 'ZMANIM_TABLE' as any,
      name: 'Zmanim Table',
      position: { x: 680, y: 110, width: 580, height: 860 },
      zIndex: 10,
      font: font(20, '#e2e8f0'),
      backgroundColor: 'rgba(30, 41, 59, 0.9)',
      language: 'english' as const,
      content: {
        title: 'Zmanim',
        titleHebrew: 'זמנים',
        headerColor: '#38bdf8',
        highlightColor: '#facc15',
        showBorder: true,
        compact: false,
        columns: 2,
      },
      visible: true,
    },
    {
      id: 'zmanim-table-he',
      type: 'ZMANIM_TABLE' as any,
      name: 'Zmanim Table (Hebrew)',
      position: { x: 1300, y: 110, width: 580, height: 860 },
      zIndex: 10,
      font: font(20, '#e2e8f0'),
      backgroundColor: 'rgba(30, 41, 59, 0.9)',
      language: 'hebrew' as const,
      content: {
        title: 'Zmanim',
        titleHebrew: 'זמני היום',
        headerColor: '#38bdf8',
        highlightColor: '#facc15',
        showBorder: true,
        compact: false,
        columns: 2,
      },
      visible: true,
    },
    {
      id: 'tefilah-info',
      type: 'PLAIN_TEXT' as any,
      name: 'Tefilah Notes',
      position: { x: 40, y: 670, width: 600, height: 220 },
      zIndex: 10,
      font: font(18, '#94a3b8'),
      backgroundColor: 'rgba(30, 41, 59, 0.85)',
      language: 'english' as const,
      content: {
        text: 'Tefilah reminders appear here based on the season.',
        textAlign: 'center',
        verticalAlign: 'middle',
      },
      visible: true,
    },
    {
      id: 'community-media',
      type: 'MEDIA_VIEWER' as any,
      name: 'Community slide',
      position: { x: 40, y: 900, width: 600, height: 120 },
      zIndex: 12,
      font: font(14, '#e2e8f0'),
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      language: 'english' as const,
      content: {
        rotationInterval: 10,
        fit: 'contain',
        showTransition: true,
      },
      visible: true,
    },
    {
      id: 'ticker',
      type: 'SCROLLING_TICKER' as any,
      name: 'Announcements Ticker',
      position: { x: 0, y: 1030, width: 1920, height: 50 },
      zIndex: 20,
      font: font(22, '#ffffff'),
      backgroundColor: 'rgba(30, 58, 138, 0.9)',
      language: 'english' as const,
      content: {
        speed: 60,
        separator: '   •   ',
      },
      visible: true,
    },
  ],
  activationRules: [{ type: 'default' }],
  sortOrder: 0,
};

const DEFAULT_SCREEN: Screen = {
  id: '1',
  orgId: 'default',
  name: 'Main Display',
  styleId: 'default-style',
  active: true,
};

const DEFAULT_GROUPS: DaveningGroup[] = [
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
];

const DEFAULT_SCHEDULES: MinyanSchedule[] = [
  // ── חול (Weekday) ──
  { id: 'sched-1', orgId: 'default', name: "שחרית א' (נץ) - עז\"נ", type: 'Shacharit', groupId: 'g-chol', baseZman: 'netz', offset: -20, room: 'עזרת נשים', sortOrder: 0 },
  { id: 'sched-2', orgId: 'default', name: "שחרית ב'", type: 'Shacharit', groupId: 'g-chol', fixedTime: '07:00', sortOrder: 1 },
  { id: 'sched-3', orgId: 'default', name: "שחרית ג' - גן מח\"ל", type: 'Shacharit', groupId: 'g-chol', fixedTime: '07:25', room: 'גן מחל', sortOrder: 2 },
  { id: 'sched-4', orgId: 'default', name: "שחרית ד' - עז\"נ", type: 'Shacharit', groupId: 'g-chol', fixedTime: '07:45', room: 'עזרת נשים', sortOrder: 3 },
  { id: 'sched-5', orgId: 'default', name: "שחרית ה' - שטיבל", type: 'Shacharit', groupId: 'g-chol', fixedTime: '08:05', room: 'שטיבל', sortOrder: 4 },
  { id: 'sched-6', orgId: 'default', name: "שחרית ו'", type: 'Shacharit', groupId: 'g-chol', fixedTime: '08:30', sortOrder: 5 },
  { id: 'sched-7', orgId: 'default', name: "שחרית ז' - עז\"נ", type: 'Shacharit', groupId: 'g-chol', baseZman: 'sofZmanShma', room: 'עזרת נשים', sortOrder: 6 },
  { id: 'sched-8', orgId: 'default', name: "מנחה א' - עז\"נ", type: 'Mincha', groupId: 'g-chol', fixedTime: '13:00', room: 'עזרת נשים', sortOrder: 7 },
  { id: 'sched-9', orgId: 'default', name: "מנחה ב'", type: 'Mincha', groupId: 'g-chol', fixedTime: '13:05', sortOrder: 8 },
  { id: 'sched-10', orgId: 'default', name: "מנחה ג'", type: 'Mincha', groupId: 'g-chol', baseZman: 'shkia', offset: -15, sortOrder: 9 },
  { id: 'sched-11', orgId: 'default', name: "מנחה ד'", type: 'Mincha', groupId: 'g-chol', baseZman: 'minchaGedola', sortOrder: 10 },
  { id: 'sched-12', orgId: 'default', name: "מעריב א'", type: 'Maariv', groupId: 'g-chol', baseZman: 'tzeit', limitBefore: '17:30', sortOrder: 11 },
  { id: 'sched-13', orgId: 'default', name: "מעריב ב'", type: 'Maariv', groupId: 'g-chol', fixedTime: '19:00', sortOrder: 12 },
  { id: 'sched-14', orgId: 'default', name: "מעריב ג'", type: 'Maariv', groupId: 'g-chol', fixedTime: '20:30', sortOrder: 13 },
  { id: 'sched-15', orgId: 'default', name: "מעריב ד' - שטיבל", type: 'Maariv', groupId: 'g-chol', fixedTime: '22:00', room: 'שטיבל', sortOrder: 14 },
  { id: 'sched-16', orgId: 'default', name: "מעריב ה'", type: 'Maariv', groupId: 'g-chol', fixedTime: '22:30', sortOrder: 15 },

  // ── שבת (Shabbat) ──
  { id: 'sched-17', orgId: 'default', name: 'הדלקת נרות', type: 'Other', groupId: 'g-shabbat', baseZman: 'shkia', offset: -40, sortOrder: 16 },
  { id: 'sched-18', orgId: 'default', name: "מנחה ב' וקבלת שבת", type: 'Mincha', groupId: 'g-shabbat', baseZman: 'shkia', offset: -20, sortOrder: 17 },
  { id: 'sched-19', orgId: 'default', name: "מנחה ג' וקב\"ש - גן מח\"ל", type: 'Mincha', groupId: 'g-shabbat', baseZman: 'shkia', offset: -15, room: 'גן מחל', sortOrder: 18 },
  { id: 'sched-20', orgId: 'default', name: "שחרית א'", type: 'Shacharit', groupId: 'g-shabbat', fixedTime: '06:30', sortOrder: 19 },
  { id: 'sched-21', orgId: 'default', name: "שחרית ב' - גן מח\"ל", type: 'Shacharit', groupId: 'g-shabbat', baseZman: 'sofZmanShma', offset: -30, room: 'גן מחל', sortOrder: 20 },
  { id: 'sched-22', orgId: 'default', name: "מעריב א'", type: 'Maariv', groupId: 'g-shabbat', baseZman: 'tzeit', offset: 0, sortOrder: 21 },
  { id: 'sched-23', orgId: 'default', name: "מעריב ב'", type: 'Maariv', groupId: 'g-shabbat', baseZman: 'tzeit', offset: 10, sortOrder: 22 },
  { id: 'sched-24', orgId: 'default', name: "מעריב ג'", type: 'Maariv', groupId: 'g-shabbat', baseZman: 'tzeit', offset: 20, sortOrder: 23 },
  { id: 'sched-25', orgId: 'default', name: "מעריב ד'", type: 'Maariv', groupId: 'g-shabbat', baseZman: 'tzeit', offset: 30, sortOrder: 24 },
  { id: 'sched-26', orgId: 'default', name: "מעריב ה'", type: 'Maariv', groupId: 'g-shabbat', baseZman: 'tzeit', offset: 40, sortOrder: 25 },
  { id: 'sched-27', orgId: 'default', name: "מעריב ו'", type: 'Maariv', groupId: 'g-shabbat', baseZman: 'tzeit', offset: 50, sortOrder: 26 },
];

function normalizeOrgLookupKey(key: string): string {
  return decodeURIComponent(key).trim();
}

class InMemoryStore {
  /** Keys: canonical id + slug (same org object) for reliable lookup */
  orgs: Map<string, Organization> = new Map([
    ['default', DEFAULT_ORG],
    ['demo', DEFAULT_ORG],
  ]);
  styles: Map<string, DisplayStyle[]> = new Map([['default', [DEFAULT_STYLE]]]);
  screens: Map<string, Screen[]> = new Map([['default', [DEFAULT_SCREEN]]]);
  announcements: Map<string, Announcement[]> = new Map([['default', [
    {
      id: 'ann-1',
      orgId: 'default',
      title: 'Welcome to the Zmanim Display System',
      content: 'This display is powered by the new open-source zmanim application.',
      priority: 1,
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ann-2',
      orgId: 'default',
      title: 'Shabbat Shalom — שבת שלום',
      content: 'Wishing everyone a good Shabbos.',
      priority: 2,
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ann-3',
      orgId: 'default',
      title: 'Shiur after Maariv every evening',
      content: 'Daily shiur in Halacha.',
      priority: 1,
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ann-4',
      orgId: 'default',
      title: 'Community kiddush this Shabbos',
      titleHebrew: 'קידוש קהילתי',
      content: 'Sponsored by the Cohen family — all welcome after Mussaf in the social hall.',
      contentHebrew: 'חסכו לשבת — כולם מוזמנים לאחר מוסף באולם.',
      priority: 2,
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ann-5',
      orgId: 'default',
      title: 'Blood drive — Sunday 9:00 AM',
      titleHebrew: 'תרומת דם',
      content: 'Magen David Adom will be in the parking lot. Please register at the office.',
      priority: 1,
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ann-6',
      orgId: 'default',
      title: 'Thank you to our sponsors',
      titleHebrew: 'תודה לתורמים',
      content: 'This month’s sefer sponsorship: Feldman & Weiss. Shul maintenance: anonymous donor.',
      priority: 3,
      active: true,
      createdAt: new Date().toISOString(),
    },
  ]]]);
  memorials: Map<string, Memorial[]> = new Map([['default', [
    {
      id: 'mem-1',
      orgId: 'default',
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
      orgId: 'default',
      hebrewName: 'שרה בת משה',
      englishName: 'Sarah Cohen',
      hebrewDate: 'י״ב כסלו',
      hebrewMonth: 9,
      hebrewDay: 12,
      relationship: 'Grandmother of the Cohen family',
    },
    {
      id: 'mem-3',
      orgId: 'default',
      hebrewName: 'יעקב בן דוד',
      englishName: 'Yaakov Weiss',
      hebrewDate: 'ג׳ ניסן',
      hebrewMonth: 1,
      hebrewDay: 3,
      relationship: 'Community member',
    },
  ]]]);
  groups: Map<string, DaveningGroup[]> = new Map([['default', DEFAULT_GROUPS]]);
  schedules: Map<string, MinyanSchedule[]> = new Map([['default', DEFAULT_SCHEDULES]]);
  media: Map<string, MediaItem[]> = new Map([['default', [
    {
      id: 'media-sample-1',
      orgId: 'default',
      url: '/sample-banner.svg',
      filename: 'sample-banner.svg',
      mimeType: 'image/svg+xml',
      uploadedAt: new Date().toISOString(),
    },
  ]]]);

  getOrg(orgId: string): Organization | undefined {
    const key = normalizeOrgLookupKey(orgId);
    const direct = this.orgs.get(key);
    if (direct) return direct;
    const lower = key.toLowerCase();
    for (const org of this.orgs.values()) {
      if (org.id.toLowerCase() === lower || org.slug.toLowerCase() === lower) {
        return org;
      }
    }
    return undefined;
  }

  /** Canonical storage id (e.g. "default"), never the slug alone when they differ */
  resolveOrgId(orgIdOrSlug: string): string | undefined {
    return this.getOrg(orgIdOrSlug)?.id;
  }

  getOrgStyles(orgIdOrSlug: string): DisplayStyle[] {
    const id = this.resolveOrgId(orgIdOrSlug);
    return id ? (this.styles.get(id) ?? []) : [];
  }

  getOrgScreens(orgIdOrSlug: string): Screen[] {
    const id = this.resolveOrgId(orgIdOrSlug);
    return id ? (this.screens.get(id) ?? []) : [];
  }

  getOrgAnnouncements(orgIdOrSlug: string): Announcement[] {
    const id = this.resolveOrgId(orgIdOrSlug);
    return id ? (this.announcements.get(id) ?? []) : [];
  }

  getOrgMemorials(orgIdOrSlug: string): Memorial[] {
    const id = this.resolveOrgId(orgIdOrSlug);
    return id ? (this.memorials.get(id) ?? []) : [];
  }

  getOrgGroups(orgIdOrSlug: string): DaveningGroup[] {
    const id = this.resolveOrgId(orgIdOrSlug);
    return id ? (this.groups.get(id) ?? []) : [];
  }

  getOrgSchedules(orgIdOrSlug: string): MinyanSchedule[] {
    const id = this.resolveOrgId(orgIdOrSlug);
    return id ? (this.schedules.get(id) ?? []) : [];
  }

  getOrgMedia(orgIdOrSlug: string): MediaItem[] {
    const id = this.resolveOrgId(orgIdOrSlug);
    return id ? (this.media.get(id) ?? []) : [];
  }
}

export const store = new InMemoryStore();

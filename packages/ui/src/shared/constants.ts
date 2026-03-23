import { DisplayObjectType } from '@zmanim-app/core';

/** Max width (px) for mobile layout — matches admin + display breakpoints. */
export const BREAKPOINT_MOBILE_MAX = 767;
/** Max width (px) for tablet layout. */
export const BREAKPOINT_TABLET_MAX = 1023;

export const DEFAULT_FONT_FAMILY = 'system-ui, -apple-system, sans-serif';
export const DEFAULT_FONT_SIZE = 24;

export const TYPE_LABELS: Record<DisplayObjectType, string> = {
  [DisplayObjectType.ZMANIM_TABLE]: 'Zmanim Table',
  [DisplayObjectType.JEWISH_INFO]: 'Jewish Info',
  [DisplayObjectType.DIGITAL_CLOCK]: 'Digital Clock',
  [DisplayObjectType.ANALOG_CLOCK]: 'Analog Clock',
  [DisplayObjectType.PLAIN_TEXT]: 'Plain Text',
  [DisplayObjectType.RICH_TEXT]: 'Rich Text',
  [DisplayObjectType.MEDIA_VIEWER]: 'Media Viewer',
  [DisplayObjectType.EVENTS_TABLE]: 'Events Table',
  [DisplayObjectType.YAHRZEIT_DISPLAY]: 'Yahrzeit Display',
  [DisplayObjectType.SCROLLING_TICKER]: 'Scrolling Ticker',
  [DisplayObjectType.SEFIRA_COUNTER]: 'Sefira Counter',
  [DisplayObjectType.COUNTDOWN_TIMER]: 'Countdown Timer',
  [DisplayObjectType.FIDS_BOARD]: 'FIDS Board',
};

export const TYPE_ICONS: Record<DisplayObjectType, string> = {
  [DisplayObjectType.ZMANIM_TABLE]: '⏱️',
  [DisplayObjectType.JEWISH_INFO]: '📅',
  [DisplayObjectType.DIGITAL_CLOCK]: '🕐',
  [DisplayObjectType.ANALOG_CLOCK]: '🕰️',
  [DisplayObjectType.PLAIN_TEXT]: '📝',
  [DisplayObjectType.RICH_TEXT]: '📰',
  [DisplayObjectType.MEDIA_VIEWER]: '🖼️',
  [DisplayObjectType.EVENTS_TABLE]: '📋',
  [DisplayObjectType.YAHRZEIT_DISPLAY]: '🕯️',
  [DisplayObjectType.SCROLLING_TICKER]: '📢',
  [DisplayObjectType.SEFIRA_COUNTER]: '🔢',
  [DisplayObjectType.COUNTDOWN_TIMER]: '⏳',
  [DisplayObjectType.FIDS_BOARD]: '✈️',
};

export const ZMANIM_OPTIONS_REGULAR = [
  { key: 'ALOS', label: 'Alos HaShachar' },
  { key: 'MISHEYAKIR', label: 'Misheyakir' },
  { key: 'HANETZ', label: 'Hanetz HaChama' },
  { key: 'SOF_ZMAN_SHMA', label: 'Sof Zman Shema GR"A' },
  { key: 'SOF_ZMAN_SHMA_MGA', label: 'Sof Zman Shema M"A' },
  { key: 'SOF_ZMAN_TEFILLAH', label: 'Sof Zman Tefillah GR"A' },
  { key: 'SOF_ZMAN_TEFILLAH_MGA', label: 'Sof Zman Tefillah M"A' },
  { key: 'CHATZOS', label: 'Chatzos HaYom' },
  { key: 'MINCHA_GEDOLAH', label: 'Mincha Gedolah' },
  { key: 'MINCHA_KETANAH', label: 'Mincha Ketanah' },
  { key: 'PLAG_HAMINCHA', label: 'Plag HaMincha' },
  { key: 'SHKIAH', label: 'Shkiah' },
  { key: 'TZAIS', label: 'Tzais HaKochavim' },
  { key: 'CANDLE_LIGHTING', label: 'Candle Lighting' },
  { key: 'HAVDALAH', label: 'Havdalah' },
  { key: 'RABBEINU_TAM_END', label: 'Rabbeinu Tam' },
  { key: 'CHATZOS_HALAILA', label: 'Chatzos HaLaila' },
] as const;

export const ZMANIM_OPTIONS_TUKACHINSKY = [
  { key: 'ALOS_TUKACHINSKY', label: 'Alos HaShachar' },
  { key: 'MISHEYAKIR_TUKACHINSKY', label: 'Misheyakir' },
  { key: 'HANETZ_TUKACHINSKY', label: 'Hanetz HaChama' },
  { key: 'SOF_ZMAN_SHMA_TUKACHINSKY', label: 'Sof Zman Shema GR"A' },
  { key: 'SOF_ZMAN_SHMA_MGA_TUKACHINSKY', label: 'Sof Zman Shema M"A' },
  { key: 'SOF_ZMAN_TEFILLAH_TUKACHINSKY', label: 'Sof Zman Tefillah GR"A' },
  { key: 'SOF_ZMAN_TEFILLAH_MGA_TUKACHINSKY', label: 'Sof Zman Tefillah M"A' },
  { key: 'MINCHA_GEDOLAH_TUKACHINSKY', label: 'Mincha Gedolah' },
  { key: 'MINCHA_KETANAH_TUKACHINSKY', label: 'Mincha Ketanah' },
  { key: 'PLAG_HAMINCHA_TUKACHINSKY', label: 'Plag HaMincha' },
  { key: 'SHKIAH_TUKACHINSKY', label: 'Shkiah' },
  { key: 'TZAIS_TUKACHINSKY', label: 'Tzais HaKochavim' },
  { key: 'RABBEINU_TAM_TUKACHINSKY', label: 'Rabbeinu Tam' },
] as const;

export const FONT_CATEGORIES = [
  {
    label: 'Hebrew Classic',
    fonts: [
      { value: "'Secular One', sans-serif", name: 'Secular One' },
      { value: "'Varela Round', sans-serif", name: 'Varela Round' },
      { value: "'Alef', sans-serif", name: 'Alef' },
      { value: "'Suez One', serif", name: 'Suez One' },
      { value: "'Amatic SC', cursive", name: 'Amatic SC' },
    ],
  },
  {
    label: 'Bold & Display',
    fonts: [
      { value: "'Oswald', sans-serif", name: 'Oswald' },
      { value: "'Montserrat', sans-serif", name: 'Montserrat' },
      { value: "'Poppins', sans-serif", name: 'Poppins' },
      { value: "'Raleway', sans-serif", name: 'Raleway' },
      { value: "'Arimo', sans-serif", name: 'Arimo' },
    ],
  },
  {
    label: 'Fancy & Decorative',
    fonts: [
      { value: "'Karantina', system-ui", name: 'Karantina' },
      { value: "'Bellefair', serif", name: 'Bellefair' },
      { value: "'Tinos', serif", name: 'Tinos' },
    ],
  },
  {
    label: 'System Fonts',
    fonts: [
      { value: 'Arial, sans-serif', name: 'Arial' },
      { value: "'Times New Roman', serif", name: 'Times New Roman' },
      { value: "'Courier New', monospace", name: 'Courier New' },
      { value: 'system-ui, sans-serif', name: 'System Default' },
    ],
  },
];

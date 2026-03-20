export enum HalachicAuthority {
  MAGEN_AVRAHAM = 'MAGEN_AVRAHAM',
  GRA = 'GRA',
  RABBEINU_TAM = 'RABBEINU_TAM',
  TUKACHINSKY = 'TUKACHINSKY',
  BAAL_HATANYA = 'BAAL_HATANYA',
  ATERET_TORAH = 'ATERET_TORAH',
  FIXED_MINUTES = 'FIXED_MINUTES',
  YEREIM = 'YEREIM',
  SHULCHAN_ARUCH_HARAV = 'SHULCHAN_ARUCH_HARAV',
  MISHNA_BERURA = 'MISHNA_BERURA',
}

export enum ZmanType {
  ALOS = 'ALOS',
  ALOS_TUKACHINSKY = 'ALOS_TUKACHINSKY',
  MISHEYAKIR = 'MISHEYAKIR',
  MISHEYAKIR_TUKACHINSKY = 'MISHEYAKIR_TUKACHINSKY',
  HANETZ = 'HANETZ',
  HANETZ_TUKACHINSKY = 'HANETZ_TUKACHINSKY',

  SOF_ZMAN_SHMA = 'SOF_ZMAN_SHMA',
  SOF_ZMAN_SHMA_TUKACHINSKY = 'SOF_ZMAN_SHMA_TUKACHINSKY',
  SOF_ZMAN_SHMA_MGA = 'SOF_ZMAN_SHMA_MGA',
  SOF_ZMAN_SHMA_MGA_TUKACHINSKY = 'SOF_ZMAN_SHMA_MGA_TUKACHINSKY',

  SOF_ZMAN_TEFILLAH = 'SOF_ZMAN_TEFILLAH',
  SOF_ZMAN_TEFILLAH_TUKACHINSKY = 'SOF_ZMAN_TEFILLAH_TUKACHINSKY',
  SOF_ZMAN_TEFILLAH_MGA = 'SOF_ZMAN_TEFILLAH_MGA',
  SOF_ZMAN_TEFILLAH_MGA_TUKACHINSKY = 'SOF_ZMAN_TEFILLAH_MGA_TUKACHINSKY',

  CHATZOS = 'CHATZOS',

  MINCHA_GEDOLAH = 'MINCHA_GEDOLAH',
  MINCHA_GEDOLAH_TUKACHINSKY = 'MINCHA_GEDOLAH_TUKACHINSKY',

  MINCHA_KETANAH = 'MINCHA_KETANAH',
  MINCHA_KETANAH_TUKACHINSKY = 'MINCHA_KETANAH_TUKACHINSKY',

  PLAG_HAMINCHA = 'PLAG_HAMINCHA',
  PLAG_HAMINCHA_TUKACHINSKY = 'PLAG_HAMINCHA_TUKACHINSKY',

  SHKIAH = 'SHKIAH',
  SHKIAH_TUKACHINSKY = 'SHKIAH_TUKACHINSKY',
  TZAIS = 'TZAIS',
  TZAIS_TUKACHINSKY = 'TZAIS_TUKACHINSKY',
  CHATZOS_HALAILA = 'CHATZOS_HALAILA',
  CANDLE_LIGHTING = 'CANDLE_LIGHTING',
  HAVDALAH = 'HAVDALAH',
  RABBEINU_TAM_END = 'RABBEINU_TAM_END',
  RABBEINU_TAM_TUKACHINSKY = 'RABBEINU_TAM_TUKACHINSKY',
}

export interface ZmanOpinion {
  authority: HalachicAuthority;
  degreesBelow?: number;
  fixedMinutes?: number;
  description: string;
}

export const DEFAULT_OPINIONS: Map<ZmanType, ZmanOpinion> = new Map([
  [ZmanType.ALOS, {
    authority: HalachicAuthority.GRA,
    description: 'Dawn - 72 minutes before sunrise',
  }],
  [ZmanType.ALOS_TUKACHINSKY, {
    authority: HalachicAuthority.TUKACHINSKY,
    fixedMinutes: 90,
    description: 'Dawn - 90 minutes before sunrise (Tukachinsky)',
  }],
  [ZmanType.MISHEYAKIR, {
    authority: HalachicAuthority.GRA,
    description: 'Earliest tallit/tefillin - sun 11° below horizon',
  }],
  [ZmanType.MISHEYAKIR_TUKACHINSKY, {
    authority: HalachicAuthority.TUKACHINSKY,
    degreesBelow: 11.5,
    description: 'Earliest tallit/tefillin - sun 11.5° below horizon (Tukachinsky)',
  }],
  [ZmanType.HANETZ, {
    authority: HalachicAuthority.GRA,
    description: 'Sunrise at sea level',
  }],
  [ZmanType.HANETZ_TUKACHINSKY, {
    authority: HalachicAuthority.TUKACHINSKY,
    description: 'Sunrise per Tukachinsky elevation/refraction tables',
  }],
  [ZmanType.SOF_ZMAN_SHMA, {
    authority: HalachicAuthority.GRA,
    description: 'Latest Shema GR"A - 3 shaos, day = sunrise to sunset',
  }],
  [ZmanType.SOF_ZMAN_SHMA_TUKACHINSKY, {
    authority: HalachicAuthority.TUKACHINSKY,
    description: 'Latest Shema GR"A - 3 shaos, day = Tukachinsky sunrise to sunset',
  }],
  [ZmanType.SOF_ZMAN_SHMA_MGA, {
    authority: HalachicAuthority.MAGEN_AVRAHAM,
    description: 'Latest Shema M"A - 3 shaos, day = alos 72min to tzais 72min',
  }],
  [ZmanType.SOF_ZMAN_SHMA_MGA_TUKACHINSKY, {
    authority: HalachicAuthority.TUKACHINSKY,
    description: 'Latest Shema M"A - 3 shaos, day = Tukachinsky alos 16.1° to tzais 8.5°',
  }],
  [ZmanType.SOF_ZMAN_TEFILLAH, {
    authority: HalachicAuthority.GRA,
    description: 'Latest Tefillah GR"A - 4 shaos, day = sunrise to sunset',
  }],
  [ZmanType.SOF_ZMAN_TEFILLAH_TUKACHINSKY, {
    authority: HalachicAuthority.TUKACHINSKY,
    description: 'Latest Tefillah GR"A - 4 shaos, day = Tukachinsky sunrise to sunset',
  }],
  [ZmanType.SOF_ZMAN_TEFILLAH_MGA, {
    authority: HalachicAuthority.MAGEN_AVRAHAM,
    description: 'Latest Tefillah M"A - 4 shaos, day = alos 72min to tzais 72min',
  }],
  [ZmanType.SOF_ZMAN_TEFILLAH_MGA_TUKACHINSKY, {
    authority: HalachicAuthority.TUKACHINSKY,
    description: 'Latest Tefillah M"A - 4 shaos, day = Tukachinsky alos 16.1° to tzais 8.5°',
  }],
  [ZmanType.CHATZOS, {
    authority: HalachicAuthority.GRA,
    description: 'Midday - astronomical noon',
  }],
  [ZmanType.MINCHA_GEDOLAH, {
    authority: HalachicAuthority.GRA,
    description: 'Earliest Mincha - 6.5 shaos, day = sunrise to sunset',
  }],
  [ZmanType.MINCHA_GEDOLAH_TUKACHINSKY, {
    authority: HalachicAuthority.TUKACHINSKY,
    description: 'Earliest Mincha - 6.5 shaos, day = Tukachinsky sunrise to sunset',
  }],
  [ZmanType.MINCHA_KETANAH, {
    authority: HalachicAuthority.GRA,
    description: 'Mincha Ketanah - 9.5 shaos, day = sunrise to sunset',
  }],
  [ZmanType.MINCHA_KETANAH_TUKACHINSKY, {
    authority: HalachicAuthority.TUKACHINSKY,
    description: 'Mincha Ketanah - 9.5 shaos, day = Tukachinsky sunrise to sunset',
  }],
  [ZmanType.PLAG_HAMINCHA, {
    authority: HalachicAuthority.GRA,
    description: 'Plag HaMincha - 10.75 shaos, day = sunrise to sunset',
  }],
  [ZmanType.PLAG_HAMINCHA_TUKACHINSKY, {
    authority: HalachicAuthority.TUKACHINSKY,
    description: 'Plag HaMincha - 10.75 shaos, day = Tukachinsky sunrise to sunset',
  }],
  [ZmanType.SHKIAH, {
    authority: HalachicAuthority.GRA,
    description: 'Sunset at sea level',
  }],
  [ZmanType.SHKIAH_TUKACHINSKY, {
    authority: HalachicAuthority.TUKACHINSKY,
    description: 'Sunset per Tukachinsky elevation/refraction tables',
  }],
  [ZmanType.TZAIS, {
    authority: HalachicAuthority.GRA,
    degreesBelow: 8.5,
    description: 'Nightfall - sun 8.5° below horizon',
  }],
  [ZmanType.TZAIS_TUKACHINSKY, {
    authority: HalachicAuthority.TUKACHINSKY,
    degreesBelow: 8.5,
    description: 'Nightfall - sun 8.5° below horizon (Tukachinsky)',
  }],
  [ZmanType.CHATZOS_HALAILA, {
    authority: HalachicAuthority.GRA,
    description: 'Halachic midnight - midpoint between shkiah and hanetz',
  }],
  [ZmanType.CANDLE_LIGHTING, {
    authority: HalachicAuthority.FIXED_MINUTES,
    fixedMinutes: 40,
    description: 'Candle lighting - 40 minutes before shkiah (Jerusalem custom)',
  }],
  [ZmanType.HAVDALAH, {
    authority: HalachicAuthority.TUKACHINSKY,
    degreesBelow: 8.5,
    description: 'Havdalah - same as tzais',
  }],
  [ZmanType.RABBEINU_TAM_END, {
    authority: HalachicAuthority.RABBEINU_TAM,
    fixedMinutes: 72,
    description: 'Rabbeinu Tam - 72 minutes after shkiah',
  }],
  [ZmanType.RABBEINU_TAM_TUKACHINSKY, {
    authority: HalachicAuthority.TUKACHINSKY,
    fixedMinutes: 72,
    description: 'Rabbeinu Tam - 72 minutes after Tukachinsky shkiah',
  }],
]);

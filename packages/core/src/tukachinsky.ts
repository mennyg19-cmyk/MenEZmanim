import { ZmanType } from './halachic-opinions';

export interface TukachinskyZmanDef {
  zmanType: ZmanType;
  degreesBelow?: number;
  fixedMinutes?: number;
  note: string;
  source: string;
}

/**
 * Tukachinsky opinion profile based on Sefer Bein Hashmashot
 * by Rabbi Yechiel Michel Tukachinsky (Jerusalem).
 *
 * Degree values are sun depression angles below the geometric horizon.
 */
export const TUKACHINSKY_PROFILE: Map<ZmanType, TukachinskyZmanDef> = new Map([
  [ZmanType.ALOS_TUKACHINSKY, {
    zmanType: ZmanType.ALOS_TUKACHINSKY,
    fixedMinutes: 90,
    note: 'Dawn - 90 minutes before elevation-adjusted sunrise (Luach Eretz Yisrael)',
    source: 'Luach Eretz Yisrael; Bein Hashmashot, Ch. 2',
  }],
  [ZmanType.MISHEYAKIR_TUKACHINSKY, {
    zmanType: ZmanType.MISHEYAKIR_TUKACHINSKY,
    degreesBelow: 11.5,
    note: 'When one can distinguish between blue and white threads (tallit/tefillin)',
    source: 'Bein Hashmashot, Ch. 3',
  }],
  [ZmanType.HANETZ_TUKACHINSKY, {
    zmanType: ZmanType.HANETZ_TUKACHINSKY,
    degreesBelow: 0.833,
    note: 'Sunrise per Tukachinsky elevation/refraction tables',
    source: 'Bein Hashmashot; Tukachinsky sunrise tables',
  }],
  [ZmanType.SOF_ZMAN_SHMA_TUKACHINSKY, {
    zmanType: ZmanType.SOF_ZMAN_SHMA_TUKACHINSKY,
    note: '3 shaos zmaniyos; day = Tukachinsky sunrise to sunset (GRA count)',
    source: 'Bein Hashmashot; shaos zmaniyos per Tukachinsky sunrise/sunset',
  }],
  [ZmanType.SOF_ZMAN_SHMA_MGA_TUKACHINSKY, {
    zmanType: ZmanType.SOF_ZMAN_SHMA_MGA_TUKACHINSKY,
    note: '3 shaos zmaniyos; day = Tukachinsky alos 16.1° to tzais 8.5° (M"A count)',
    source: 'Bein Hashmashot; shaos zmaniyos per Tukachinsky alos/tzais',
  }],
  [ZmanType.SOF_ZMAN_TEFILLAH_TUKACHINSKY, {
    zmanType: ZmanType.SOF_ZMAN_TEFILLAH_TUKACHINSKY,
    note: '4 shaos zmaniyos; day = Tukachinsky sunrise to sunset (GRA count)',
    source: 'Bein Hashmashot; shaos zmaniyos per Tukachinsky sunrise/sunset',
  }],
  [ZmanType.SOF_ZMAN_TEFILLAH_MGA_TUKACHINSKY, {
    zmanType: ZmanType.SOF_ZMAN_TEFILLAH_MGA_TUKACHINSKY,
    note: '4 shaos zmaniyos; day = Tukachinsky alos 16.1° to tzais 8.5° (M"A count)',
    source: 'Bein Hashmashot; shaos zmaniyos per Tukachinsky alos/tzais',
  }],
  [ZmanType.MINCHA_GEDOLAH_TUKACHINSKY, {
    zmanType: ZmanType.MINCHA_GEDOLAH_TUKACHINSKY,
    note: '6.5 shaos zmaniyos; day = Tukachinsky sunrise to sunset',
    source: 'Bein Hashmashot; shaos zmaniyos per Tukachinsky sunrise/sunset',
  }],
  [ZmanType.MINCHA_KETANAH_TUKACHINSKY, {
    zmanType: ZmanType.MINCHA_KETANAH_TUKACHINSKY,
    note: '9.5 shaos zmaniyos; day = Tukachinsky sunrise to sunset',
    source: 'Bein Hashmashot; shaos zmaniyos per Tukachinsky sunrise/sunset',
  }],
  [ZmanType.PLAG_HAMINCHA_TUKACHINSKY, {
    zmanType: ZmanType.PLAG_HAMINCHA_TUKACHINSKY,
    note: '10.75 shaos zmaniyos; day = Tukachinsky sunrise to sunset',
    source: 'Bein Hashmashot; shaos zmaniyos per Tukachinsky sunrise/sunset',
  }],
  [ZmanType.SHKIAH_TUKACHINSKY, {
    zmanType: ZmanType.SHKIAH_TUKACHINSKY,
    degreesBelow: 0.833,
    note: 'Sunset per Tukachinsky elevation/refraction tables',
    source: 'Bein Hashmashot; Tukachinsky sunset tables',
  }],
  [ZmanType.TZAIS_TUKACHINSKY, {
    zmanType: ZmanType.TZAIS_TUKACHINSKY,
    degreesBelow: 8.5,
    note: 'Nightfall when 3 medium stars visible; standard Tukachinsky tzais',
    source: 'Bein Hashmashot, Ch. 5',
  }],
  [ZmanType.RABBEINU_TAM_TUKACHINSKY, {
    zmanType: ZmanType.RABBEINU_TAM_TUKACHINSKY,
    fixedMinutes: 72,
    note: 'Rabbeinu Tam - 72 minutes after elevation-adjusted sunset',
    source: 'Bein Hashmashot; 72 minutes after Tukachinsky sunset',
  }],
]);

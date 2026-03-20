import { ScheduleConfig } from './scheduler';

export interface ScheduleGroup {
  id: string;
  name: string;
  hebrewName: string;
  color: string;
  autoActivation: ScheduleConfig | null;
}

export const DEFAULT_SCHEDULE_GROUPS: ScheduleGroup[] = [
  { id: 'weekday', name: 'Weekday', hebrewName: 'חול', color: '#4CAF50', autoActivation: null },
  { id: 'shabbat', name: 'Shabbat', hebrewName: 'שבת', color: '#2196F3', autoActivation: null },
  { id: 'rosh-hashana', name: 'Rosh Hashana', hebrewName: 'ראש השנה', color: '#FF9800', autoActivation: null },
  { id: 'tzom-gedaliah', name: 'Tzom Gedaliah', hebrewName: 'צום גדליה', color: '#795548', autoActivation: null },
  { id: 'yom-kippur', name: 'Yom Kippur', hebrewName: 'יום כיפור', color: '#F5F5F5', autoActivation: null },
  { id: 'sukkot', name: 'Sukkot', hebrewName: 'סוכות', color: '#8BC34A', autoActivation: null },
  { id: 'hoshana-rabba', name: 'Hoshana Rabba', hebrewName: 'הושענא רבה', color: '#689F38', autoActivation: null },
  { id: 'shmini-atzeret', name: 'Shmini Atzeret', hebrewName: 'שמיני עצרת', color: '#4CAF50', autoActivation: null },
  { id: 'simchat-torah', name: 'Simchat Torah', hebrewName: 'שמחת תורה', color: '#66BB6A', autoActivation: null },
  { id: 'chanukah', name: 'Chanukah', hebrewName: 'חנוכה', color: '#FFC107', autoActivation: null },
  { id: 'asara-btevet', name: 'Asara B\'Tevet', hebrewName: 'עשרה בטבת', color: '#795548', autoActivation: null },
  { id: 'tu-bshvat', name: 'Tu B\'Shvat', hebrewName: 'ט״ו בשבט', color: '#4CAF50', autoActivation: null },
  { id: 'taanit-esther', name: 'Taanit Esther', hebrewName: 'תענית אסתר', color: '#795548', autoActivation: null },
  { id: 'purim', name: 'Purim', hebrewName: 'פורים', color: '#E91E63', autoActivation: null },
  { id: 'shushan-purim', name: 'Shushan Purim', hebrewName: 'שושן פורים', color: '#EC407A', autoActivation: null },
  { id: 'pesach', name: 'Pesach', hebrewName: 'פסח', color: '#FF5722', autoActivation: null },
  { id: 'chol-hamoed-pesach', name: 'Chol HaMoed Pesach', hebrewName: 'חול המועד פסח', color: '#FF7043', autoActivation: null },
  { id: 'shvii-shel-pesach', name: 'Shvi\'i Shel Pesach', hebrewName: 'שביעי של פסח', color: '#FF5722', autoActivation: null },
  { id: 'yom-hashoah', name: 'Yom HaShoah', hebrewName: 'יום השואה', color: '#424242', autoActivation: null },
  { id: 'yom-hazikaron', name: 'Yom HaZikaron', hebrewName: 'יום הזיכרון', color: '#546E7A', autoActivation: null },
  { id: 'yom-haatzmaut', name: 'Yom HaAtzmaut', hebrewName: 'יום העצמאות', color: '#1565C0', autoActivation: null },
  { id: 'lag-baomer', name: 'Lag BaOmer', hebrewName: 'ל״ג בעומר', color: '#FF6F00', autoActivation: null },
  { id: 'yom-yerushalayim', name: 'Yom Yerushalayim', hebrewName: 'יום ירושלים', color: '#FFD54F', autoActivation: null },
  { id: 'shavuot', name: 'Shavuot', hebrewName: 'שבועות', color: '#43A047', autoActivation: null },
  { id: 'shiva-asar-btamuz', name: 'Shiva Asar B\'Tamuz', hebrewName: 'שבעה עשר בתמוז', color: '#795548', autoActivation: null },
  { id: 'tisha-bav', name: 'Tisha B\'Av', hebrewName: 'תשעה באב', color: '#3E2723', autoActivation: null },
  { id: 'tu-bav', name: 'Tu B\'Av', hebrewName: 'ט״ו באב', color: '#E91E63', autoActivation: null },
  { id: 'erev-shabbat', name: 'Erev Shabbat', hebrewName: 'ערב שבת', color: '#1E88E5', autoActivation: null },
  { id: 'erev-yom-tov', name: 'Erev Yom Tov', hebrewName: 'ערב יום טוב', color: '#FB8C00', autoActivation: null },
  { id: 'rosh-chodesh', name: 'Rosh Chodesh', hebrewName: 'ראש חודש', color: '#AB47BC', autoActivation: null },
  { id: 'chol-hamoed-sukkot', name: 'Chol HaMoed Sukkot', hebrewName: 'חול המועד סוכות', color: '#9CCC65', autoActivation: null },
  { id: 'sefira', name: 'Sefirat HaOmer', hebrewName: 'ספירת העומר', color: '#7E57C2', autoActivation: null },
  { id: 'bein-hametzarim', name: 'Bein HaMetzarim', hebrewName: 'בין המצרים', color: '#6D4C41', autoActivation: null },
  { id: 'elul', name: 'Elul', hebrewName: 'אלול', color: '#5C6BC0', autoActivation: null },
  { id: 'aseret-yemei-teshuva', name: 'Aseret Yemei Teshuva', hebrewName: 'עשרת ימי תשובה', color: '#EF5350', autoActivation: null },
];

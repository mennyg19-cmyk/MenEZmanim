import * as fs from 'fs';

export interface BZSSettings {
  lastAllLettersBmpFileName: string;
  checkForChangeSeconds: number;
  showAllPictures: boolean;
  screenIndex: string;
  withZero: string;
  clientType: string;
  dialect: string;
  beforeSunsetCandlesLight: number;
  considerAlt: boolean;
  hasMaxSunset: boolean;
  maxSunsetTime: number;
  shabatEndType: string;
  shabatEndMinutes: number;
  rabenuTamType: string;
  rabenuTamMinutes: number;
  hebDateDay: boolean;
  hebDateMonth: boolean;
  hebDateYear: boolean;
  civilDateFormat: string;
  ampmRoman: boolean;
  parashaWithParashat: boolean;
  omerWithSephirot: boolean;
  omerType: string;
  withAmPm: string;
  parashatSpelling: string;
  editingDpi: string;
  chatzotMode: boolean;
  mainFont: string;
  roomsNames: string;
  enableRoomFilter: boolean;
  rawSettings: Record<string, unknown>;
}

const KEY_TO_FIELD: Record<string, keyof BZSSettings> = {
  LastAllLettersBmpFileName: 'lastAllLettersBmpFileName',
  'Check_for_Change_Seconds': 'checkForChangeSeconds',
  'Show_all_pictures': 'showAllPictures',
  ScreenIndex: 'screenIndex',
  withZero: 'withZero',
  ClientType: 'clientType',
  Dialect: 'dialect',
  BeforeSunsetCandlesLight: 'beforeSunsetCandlesLight',
  ConsiderAlt: 'considerAlt',
  HasMaxSunset: 'hasMaxSunset',
  MaxSunsetTime: 'maxSunsetTime',
  'ShabatEnd_Type': 'shabatEndType',
  'ShabatEnd_Minutes': 'shabatEndMinutes',
  'RabenuTam_Type': 'rabenuTamType',
  'RabenuTam_Minutes': 'rabenuTamMinutes',
  'HebDate_Day': 'hebDateDay',
  'HebDate_Month': 'hebDateMonth',
  'HebDate_Year': 'hebDateYear',
  'CivilDate_Format': 'civilDateFormat',
  AMPMRoman: 'ampmRoman',
  'Parasha_With_Parashat': 'parashaWithParashat',
  'Omer_With_Sephirot': 'omerWithSephirot',
  'Omer_type': 'omerType',
  withAmPm: 'withAmPm',
  Parashat_Spelling: 'parashatSpelling',
  EditingDpi: 'editingDpi',
  ChatzotMode: 'chatzotMode',
  MainFont: 'mainFont',
  RoomsNames: 'roomsNames',
  EnableRoomFilter: 'enableRoomFilter',
};

function parseValue(type: string, value: string): unknown {
  switch (type) {
    case 'Integer': {
      const n = parseInt(value, 10);
      if (isNaN(n)) {
        throw new Error(`Invalid Integer value: "${value}"`);
      }
      return n;
    }
    case 'Boolean':
      if (value === 'True') return true;
      if (value === 'False') return false;
      throw new Error(`Invalid Boolean value: "${value}" (expected True or False)`);
    case 'String':
      return value;
    default:
      return value;
  }
}

function parseLine(line: string, lineNum: number): { key: string; type: string; value: unknown } | null {
  const trimmed = line.trim();
  if (trimmed === '') return null;

  const parts = trimmed.split('~');
  if (parts.length < 3) {
    throw new Error(`Malformed line ${lineNum}: expected "key~type~value", got "${trimmed}"`);
  }

  const [key, type, ...valueParts] = parts;
  const valueStr = valueParts.join('~');

  return {
    key,
    type,
    value: parseValue(type, valueStr),
  };
}

export function parseSettings(filePath: string): BZSSettings {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);

  const result: Partial<BZSSettings> = {};
  const rawSettings: Record<string, unknown> = {};

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    try {
      const parsed = parseLine(lines[i], lineNum);
      if (!parsed) continue;

      const { key, type, value } = parsed;
      const field = KEY_TO_FIELD[key];

      if (field) {
        (result as Record<string, unknown>)[field] = value;
      } else {
        rawSettings[key] = value;
      }
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(`Error parsing ${filePath} at line ${lineNum}: ${err.message}`);
      }
      throw err;
    }
  }

  return {
    lastAllLettersBmpFileName: result.lastAllLettersBmpFileName ?? '',
    checkForChangeSeconds: result.checkForChangeSeconds ?? 0,
    showAllPictures: result.showAllPictures ?? false,
    screenIndex: result.screenIndex ?? '0',
    withZero: result.withZero ?? 'False',
    clientType: result.clientType ?? '',
    dialect: result.dialect ?? '',
    beforeSunsetCandlesLight: result.beforeSunsetCandlesLight ?? 18,
    considerAlt: result.considerAlt ?? false,
    hasMaxSunset: result.hasMaxSunset ?? false,
    maxSunsetTime: result.maxSunsetTime ?? 0,
    shabatEndType: result.shabatEndType ?? '',
    shabatEndMinutes: result.shabatEndMinutes ?? 0,
    rabenuTamType: result.rabenuTamType ?? '',
    rabenuTamMinutes: result.rabenuTamMinutes ?? 0,
    hebDateDay: result.hebDateDay ?? true,
    hebDateMonth: result.hebDateMonth ?? true,
    hebDateYear: result.hebDateYear ?? true,
    civilDateFormat: result.civilDateFormat ?? '',
    ampmRoman: result.ampmRoman ?? false,
    parashaWithParashat: result.parashaWithParashat ?? false,
    omerWithSephirot: result.omerWithSephirot ?? false,
    omerType: result.omerType ?? '',
    withAmPm: result.withAmPm ?? 'False',
    parashatSpelling: result.parashatSpelling ?? '',
    editingDpi: result.editingDpi ?? '',
    chatzotMode: result.chatzotMode ?? true,
    mainFont: result.mainFont ?? '',
    roomsNames: result.roomsNames ?? '',
    enableRoomFilter: result.enableRoomFilter ?? false,
    rawSettings,
  };
}

import * as fs from 'fs';

export interface BZSYahrzeit {
  zl: string | null;
  enabled: boolean;
  withDate: boolean;
  withYear: boolean;
  dateError: boolean;
  replaceDate: string | null;
  niftar: string | null;
  comment: string | null;
  isYahrzeit: boolean;
  donor: string | null;
  rav: string | null;
  hebrewYear: number | null;
  hebrewMonth: number | null;
  hebrewDay: number | null;
  hebrewAdar: number;
  selAdar: number;
  hebrewDate: string | null;
  afterSunset: boolean;
  hebrewFamilyName: string | null;
  hebrewPrivateName: string | null;
  nextYear: string | null;
  id: string;
  hebrewBenBat: string | null;
  civilMonth: number | null;
  civilYear: number | null;
  civilDay: number | null;
  rawFields: Record<string, string>;
}

const NULL_MARKER = '^^';

const NUMERIC_COLUMNS = new Set([
  'Heb_Year',
  'Heb_Month',
  'Heb_Day',
  'Heb_Adar',
  'Sel_Adar',
  'Civil_Month',
  'Civil_Year',
  'Civil_Day',
]);

function parseValue(
  raw: string,
  colName: string,
  types: string[],
  headers: string[],
): string | number | boolean | null {
  const val = raw === NULL_MARKER ? '' : raw;
  const idx = headers.indexOf(colName);
  if (idx < 0) return null;

  const type = types[idx]?.toLowerCase() ?? 'string';

  if (type === 'boolean') {
    return val === 'True' || val === 'true' || val === '1';
  }

  if (NUMERIC_COLUMNS.has(colName)) {
    const n = parseInt(val, 10);
    return isNaN(n) ? (colName === 'Heb_Adar' || colName === 'Sel_Adar' ? 0 : null) : n;
  }

  if (val === '') return null;
  return val;
}

function str(val: string | number | boolean | null): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') return val === '' ? null : val;
  return String(val);
}

function num(val: string | number | boolean | null): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return val;
  const n = parseInt(String(val), 10);
  return isNaN(n) ? null : n;
}

function numDef(val: string | number | boolean | null, def: number): number {
  const n = num(val);
  return n ?? def;
}

function bool(val: string | number | boolean | null): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === 'boolean') return val;
  return val === 'True' || val === 'true' || val === '1';
}

export function parseYahrzeitFile(filePath: string): BZSYahrzeit[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).map((l) => l.trim());
  const entries: BZSYahrzeit[] = [];

  if (lines.length < 3) return entries;

  const headers = lines[0].split('\t').map((h) => h.trim());
  const types = lines[1].split('\t').map((t) => t.trim());

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    if (line === '') continue;

    const values = line.split('\t');
    const get = (colName: string) => {
      const idx = headers.indexOf(colName);
      const raw = idx >= 0 ? (values[idx] ?? NULL_MARKER) : NULL_MARKER;
      return parseValue(raw, colName, types, headers);
    };

    const rawFields: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      const v = values[c] ?? '';
      rawFields[headers[c]] = v === NULL_MARKER ? '' : v;
    }

    entries.push({
      zl: str(get('ZL')),
      enabled: bool(get('Enable')),
      withDate: bool(get('WithDate')),
      withYear: bool(get('WithYear')),
      dateError: bool(get('DateError')),
      replaceDate: str(get('ReplaceDate')),
      niftar: str(get('Niftar')),
      comment: str(get('Comment')),
      isYahrzeit: bool(get('IsYartzeit')),
      donor: str(get('Donor')),
      rav: str(get('Rav')),
      hebrewYear: num(get('Heb_Year')),
      hebrewMonth: num(get('Heb_Month')),
      hebrewDay: num(get('Heb_Day')),
      hebrewAdar: numDef(get('Heb_Adar'), 0),
      selAdar: numDef(get('Sel_Adar'), 0),
      hebrewDate: str(get('Hebrew Date')),
      afterSunset: bool(get('After Sunset')),
      hebrewFamilyName: str(get('Hebrew_Family_Name')),
      hebrewPrivateName: str(get('Hebrew_Private_Name')),
      nextYear: str(get('Next_Year')),
      id: str(get('ID')) ?? '',
      hebrewBenBat: str(get('Hebrew_Ben_Bat')),
      civilMonth: num(get('Civil_Month')),
      civilYear: num(get('Civil_Year')),
      civilDay: num(get('Civil_Day')),
      rawFields,
    });
  }

  return entries;
}

import * as fs from 'fs';

export interface BZSZmanimDef {
  index: number;
  degrees: number;
  hebrewLabel: string;
  englishLabel: string;
}

export interface BZSToladotEntry {
  index: number;
  subIndex: number;
  minutes: number;
  baseZman: number;
  isRelative: boolean;
  relativeBase: number;
  relativeType: number;
  relativeValue: number;
  isHighlight: boolean;
  isVisible: boolean;
  displayOrder: number;
  showAlways: boolean;
  hebrewLabel: string;
  englishLabel: string;
  fontSize: number;
}

function decodeHexString(hex: string): string {
  const parts = hex.trim().split(/\s+/);
  let result = '';
  for (const part of parts) {
    const code = parseInt(part, 16);
    if (!isNaN(code)) {
      result += String.fromCharCode(code);
    }
  }
  return result;
}

function parseCSVField(content: string, pos: { index: number }): string {
  let i = pos.index;
  while (i < content.length && content[i] === ' ') i++;

  if (i >= content.length) {
    pos.index = i;
    return '';
  }

  if (content[i] === '"') {
    i++;
    let value = '';
    while (i < content.length) {
      if (content[i] === '"' && (i + 1 >= content.length || content[i + 1] !== '"')) {
        i++;
        break;
      }
      if (content[i] === '"' && content[i + 1] === '"') {
        value += '"';
        i += 2;
      } else {
        value += content[i];
        i++;
      }
    }
    if (i < content.length && content[i] === ',') i++;
    pos.index = i;
    return value;
  }

  let value = '';
  while (i < content.length && content[i] !== ',') {
    value += content[i];
    i++;
  }
  if (i < content.length && content[i] === ',') i++;
  pos.index = i;
  return value.trim();
}

export function parseBzsFile(filePath: string): {
  zmanimDefs: BZSZmanimDef[];
  toladotEntries: BZSToladotEntry[];
} {
  const content = fs.readFileSync(filePath, 'utf-8').trim();
  const pos = { index: 0 };
  const fields: string[] = [];

  while (pos.index < content.length) {
    fields.push(parseCSVField(content, pos));
  }

  const zmanimDefs: BZSZmanimDef[] = [];
  const toladotEntries: BZSToladotEntry[] = [];

  let i = 0;
  while (i + 3 < fields.length) {
    const index = parseInt(fields[i], 10);
    if (isNaN(index)) break;

    const degrees = parseFloat(fields[i + 1]) || 0;
    const hebrewHex = fields[i + 2] || '';
    const englishHex = fields[i + 3] || '';

    const hebrewLabel = hebrewHex.trim() ? decodeHexString(hebrewHex) : '';
    const englishLabel = englishHex.trim() ? decodeHexString(englishHex) : '';

    zmanimDefs.push({ index, degrees, hebrewLabel, englishLabel });
    i += 4;

    if (index >= 24) break;
  }

  while (i < fields.length) {
    const rawName = fields[i];
    if (rawName === undefined || rawName === '') break;

    const decodedName = rawName.trim().match(/^[0-9A-Fa-f\s]+$/)
      ? decodeHexString(rawName)
      : rawName;

    const fontSize = parseInt(fields[i + 1] || '0', 10) || 0;
    i += 2;

    const entryIndex = parseInt(fields[i] || '', 10);
    if (isNaN(entryIndex)) break;
    const subIndex = parseInt(fields[i + 1] || '0', 10) || 0;
    const minutes = parseInt(fields[i + 2] || '0', 10) || 0;
    const baseZman = parseInt(fields[i + 3] || '0', 10) || 0;
    const isRelative = fields[i + 4] === '#TRUE#';
    const relativeBase = parseInt(fields[i + 5] || '0', 10) || 0;
    const relativeType = parseInt(fields[i + 6] || '0', 10) || 0;
    const relativeValue = parseFloat(fields[i + 7] || '0') || 0;
    const isHighlight = fields[i + 8] === '#TRUE#';
    const isVisible = fields[i + 9] === '#TRUE#';
    const displayOrder = parseInt(fields[i + 10] || '0', 10) || 0;
    const showAlways = fields[i + 11] === '#TRUE#';

    const hebLabel = fields[i + 12] || '';
    const engLabel = fields[i + 13] || '';

    const hebrewLabelDecoded = hebLabel.trim().match(/^[0-9A-Fa-f\s]+$/)
      ? decodeHexString(hebLabel)
      : hebLabel;
    const englishLabelDecoded = engLabel.trim().match(/^[0-9A-Fa-f\s]+$/)
      ? decodeHexString(engLabel)
      : engLabel;

    const entryFontSize = parseInt(fields[i + 14] || '0', 10) || fontSize;

    toladotEntries.push({
      index: entryIndex,
      subIndex,
      minutes,
      baseZman,
      isRelative,
      relativeBase,
      relativeType,
      relativeValue,
      isHighlight,
      isVisible,
      displayOrder,
      showAlways,
      hebrewLabel: hebrewLabelDecoded,
      englishLabel: englishLabelDecoded,
      fontSize: entryFontSize,
    });

    i += 15;
  }

  return { zmanimDefs, toladotEntries };
}

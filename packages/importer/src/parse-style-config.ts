import * as fs from 'fs';

export interface ParsedStyleGlobalConfig {
  [key: string]: string;
}

export interface ParsedDisplayObject {
  name: string;
  layer: number;
  width: number;
  height: number;
  top: number;
  left: number;
  windowType: number;
  fontName: string;
  fontSize: number;
  fontBold: boolean;
  foreColor: string;
  backColor: string;
  id: string;
  fixedText: string;
  visible: boolean;
  language: number;
  schedulerStr: string;
  scheduleGroupVisibility: Record<string, boolean>;
  rawFields: Record<string, string>;
}

export interface ParsedStyle {
  globalConfig: ParsedStyleGlobalConfig;
  objects: ParsedDisplayObject[];
}

/**
 * Converts a .NET ARGB color integer (signed 32-bit) to a CSS hex color string.
 * .NET stores colors as signed Int32 in ARGB format; we extract the lower 24 bits (RGB).
 */
function netColorToHex(value: string): string {
  const trimmed = value.trim();
  if (trimmed === '' || trimmed === '0') return '#000000';
  const num = parseInt(trimmed, 10);
  if (isNaN(num)) return '#000000';
  const rgb = (num >>> 0) & 0x00ffffff;
  return '#' + rgb.toString(16).padStart(6, '0');
}

/**
 * Parses the global config line (line 1) which contains `<Key><Value>` pairs.
 * Keys may contain dots (e.g. `SP.EngName`).
 */
function parseGlobalConfigLine(line: string): ParsedStyleGlobalConfig {
  const config: ParsedStyleGlobalConfig = {};
  const pattern = /<([^>]+)><([^>]*)>/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(line)) !== null) {
    config[match[1]] = match[2];
  }
  return config;
}

/**
 * Parses the SchedulerListString field which contains group-name~Boolean pairs.
 * Format: `חול~False~חול הבא~False~שבת~True~...`
 * Returns a map of group name -> visibility boolean.
 */
function parseScheduleGroupVisibility(raw: string): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  if (!raw || raw.trim() === '') return result;

  const parts = raw.split('~');
  for (let i = 0; i + 1 < parts.length; i += 2) {
    const groupName = parts[i].trim();
    const boolStr = parts[i + 1].trim();
    if (groupName !== '') {
      result[groupName] = boolStr === 'True';
    }
  }
  return result;
}

function safeInt(value: string | undefined, fallback: number = 0): number {
  if (value === undefined || value.trim() === '') return fallback;
  const n = parseInt(value, 10);
  return isNaN(n) ? fallback : n;
}

function safeFloat(value: string | undefined, fallback: number = 0): number {
  if (value === undefined || value.trim() === '') return fallback;
  const n = parseFloat(value);
  return isNaN(n) ? fallback : n;
}

export function parseStyleConfig(filePath: string): ParsedStyle {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);

  const globalConfig = lines.length > 0 ? parseGlobalConfigLine(lines[0]) : {};
  const columns = lines.length > 1 ? lines[1].split('\t') : [];

  const objects: ParsedDisplayObject[] = [];

  for (let i = 3; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') continue;

    const values = line.split('\t');
    const rawFields: Record<string, string> = {};
    for (let c = 0; c < columns.length; c++) {
      rawFields[columns[c]] = values[c] ?? '';
    }

    const schedulerStr = rawFields['Scheduler_Str'] ?? '';
    const schedulerListStr = rawFields['SchedulerListString'] ?? '';

    objects.push({
      name: rawFields['Name'] ?? '',
      layer: safeInt(rawFields['Layer']),
      width: safeFloat(rawFields['Width']),
      height: safeFloat(rawFields['Height']),
      top: safeFloat(rawFields['Top']),
      left: safeFloat(rawFields['Left']),
      windowType: safeInt(rawFields['WindowType']),
      fontName: rawFields['FontName'] ?? '',
      fontSize: safeFloat(rawFields['FontSize'], 12),
      fontBold: rawFields['FontBold'] === 'True',
      foreColor: netColorToHex(rawFields['ForeColor'] ?? ''),
      backColor: netColorToHex(rawFields['BackColor'] ?? ''),
      id: rawFields['ID'] ?? '',
      fixedText: rawFields['FixedText'] ?? '',
      visible: rawFields['Visible'] !== 'False',
      language: safeInt(rawFields['Language']),
      schedulerStr,
      scheduleGroupVisibility: parseScheduleGroupVisibility(schedulerListStr),
      rawFields,
    });
  }

  return { globalConfig, objects };
}

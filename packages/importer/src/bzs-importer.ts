import * as fs from 'fs';
import * as path from 'path';
import { parseStyleConfig, ParsedStyle } from './parse-style-config';
import { parseSettings, BZSSettings } from './parse-settings';
import { parseBzsFile, BZSZmanimDef, BZSToladotEntry } from './parse-bzs';
import { parseRulesGroups, BZSScheduleGroup } from './parse-rules-groups';
import { parseCalendarFile, BZSCalendarEntry } from './parse-calendar';
import { parseYahrzeitFile, BZSYahrzeit } from './parse-yahrzeit';
import { convertRtfToJson, RichTextContent } from './convert-rtf';

export interface ImportResult {
  styles: number;
  settings: number;
  zmanimDefs: number;
  toladotEntries: number;
  scheduleGroups: number;
  calendarEntries: number;
  yahrzeits: number;
  rtfFiles: number;
  backgrounds: string[];
  mediaFiles: string[];
  errors: ImportError[];
}

export interface ImportError {
  step: string;
  message: string;
  filePath?: string;
}

export class BZSImporter {
  private sourcePath: string;
  private dataPath: string;
  private errors: ImportError[] = [];

  private styles: ParsedStyle[] = [];
  private settings: BZSSettings | null = null;
  private zmanimDefs: BZSZmanimDef[] = [];
  private toladotEntries: BZSToladotEntry[] = [];
  private scheduleGroups: BZSScheduleGroup[] = [];
  private calendarEntries: BZSCalendarEntry[] = [];
  private yahrzeits: BZSYahrzeit[] = [];
  private rtfContents: Map<string, RichTextContent> = new Map();
  private backgrounds: string[] = [];
  private mediaFiles: string[] = [];

  constructor(sourcePath: string) {
    this.sourcePath = sourcePath;
    this.dataPath = path.join(sourcePath, 'Data', 'GeneralData');
  }

  importAll(): ImportResult {
    this.errors = [];

    this.importSettings();
    this.importZmanimDefs();
    this.importScheduleGroups();
    this.importCalendar();
    this.importStyles();
    this.importYahrzeits();
    this.importRtfFiles();
    this.catalogBackgrounds();
    this.catalogMedia();

    return this.getImportSummary();
  }

  getImportSummary(): ImportResult {
    return {
      styles: this.styles.length,
      settings: this.settings ? 1 : 0,
      zmanimDefs: this.zmanimDefs.length,
      toladotEntries: this.toladotEntries.length,
      scheduleGroups: this.scheduleGroups.length,
      calendarEntries: this.calendarEntries.length,
      yahrzeits: this.yahrzeits.length,
      rtfFiles: this.rtfContents.size,
      backgrounds: [...this.backgrounds],
      mediaFiles: [...this.mediaFiles],
      errors: [...this.errors],
    };
  }

  getSettings(): BZSSettings | null { return this.settings; }
  getStyles(): ParsedStyle[] { return this.styles; }
  getZmanimDefs(): BZSZmanimDef[] { return this.zmanimDefs; }
  getToladotEntries(): BZSToladotEntry[] { return this.toladotEntries; }
  getScheduleGroups(): BZSScheduleGroup[] { return this.scheduleGroups; }
  getCalendarEntries(): BZSCalendarEntry[] { return this.calendarEntries; }
  getYahrzeits(): BZSYahrzeit[] { return this.yahrzeits; }
  getRtfContents(): Map<string, RichTextContent> { return this.rtfContents; }

  private importSettings(): void {
    const filePath = path.join(this.dataPath, 'Setting.txt');
    try {
      this.settings = parseSettings(filePath);
    } catch (err) {
      this.errors.push({
        step: 'settings',
        message: err instanceof Error ? err.message : String(err),
        filePath,
      });
    }
  }

  private importZmanimDefs(): void {
    const filePath = path.join(this.dataPath, 'Default.Bzs');
    try {
      const result = parseBzsFile(filePath);
      this.zmanimDefs = result.zmanimDefs;
      this.toladotEntries = result.toladotEntries;
    } catch (err) {
      this.errors.push({
        step: 'zmanimDefs',
        message: err instanceof Error ? err.message : String(err),
        filePath,
      });
    }
  }

  private importScheduleGroups(): void {
    const filePath = path.join(this.dataPath, 'RulesGroupFile.dat');
    try {
      this.scheduleGroups = parseRulesGroups(filePath);
    } catch (err) {
      this.errors.push({
        step: 'scheduleGroups',
        message: err instanceof Error ? err.message : String(err),
        filePath,
      });
    }
  }

  private importCalendar(): void {
    const filePath = path.join(this.dataPath, 'CalendarFile.dat');
    try {
      this.calendarEntries = parseCalendarFile(filePath);
    } catch (err) {
      this.errors.push({
        step: 'calendar',
        message: err instanceof Error ? err.message : String(err),
        filePath,
      });
    }
  }

  private importStyles(): void {
    try {
      const files = fs.readdirSync(this.dataPath);
      const styleFiles = files.filter((f) => f.endsWith('.StyleConfig'));

      for (const file of styleFiles) {
        const filePath = path.join(this.dataPath, file);
        try {
          const style = parseStyleConfig(filePath);
          this.styles.push(style);
        } catch (err) {
          this.errors.push({
            step: 'style',
            message: err instanceof Error ? err.message : String(err),
            filePath,
          });
        }
      }
    } catch (err) {
      this.errors.push({
        step: 'styles',
        message: err instanceof Error ? err.message : String(err),
        filePath: this.dataPath,
      });
    }
  }

  private importYahrzeits(): void {
    const yahrzeitDir = path.join(this.sourcePath, 'Data', 'Yahrzeit');
    try {
      if (!fs.existsSync(yahrzeitDir)) return;
      const files = fs.readdirSync(yahrzeitDir);
      const yrzFiles = files.filter((f) => f.endsWith('.yrz'));

      for (const file of yrzFiles) {
        const filePath = path.join(yahrzeitDir, file);
        try {
          const entries = parseYahrzeitFile(filePath);
          this.yahrzeits.push(...entries);
        } catch (err) {
          this.errors.push({
            step: 'yahrzeit',
            message: err instanceof Error ? err.message : String(err),
            filePath,
          });
        }
      }
    } catch (err) {
      this.errors.push({
        step: 'yahrzeits',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private importRtfFiles(): void {
    const rtfDir = path.join(this.sourcePath, 'Data', 'RTF_Files');
    try {
      if (!fs.existsSync(rtfDir)) return;
      const files = fs.readdirSync(rtfDir);
      const rtfFiles = files.filter((f) => f.endsWith('.rtf'));

      for (const file of rtfFiles) {
        const filePath = path.join(rtfDir, file);
        try {
          const content = convertRtfToJson(filePath);
          this.rtfContents.set(file, content);
        } catch (err) {
          this.errors.push({
            step: 'rtf',
            message: err instanceof Error ? err.message : String(err),
            filePath,
          });
        }
      }
    } catch (err) {
      this.errors.push({
        step: 'rtfFiles',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private catalogBackgrounds(): void {
    const bgDir = path.join(this.sourcePath, 'Data', 'Backgrounds');
    try {
      if (!fs.existsSync(bgDir)) return;
      const files = fs.readdirSync(bgDir);
      this.backgrounds = files.filter((f) =>
        /\.(jpg|jpeg|png|bmp|gif)$/i.test(f)
      );
    } catch (err) {
      this.errors.push({
        step: 'backgrounds',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private catalogMedia(): void {
    const mediaDir = path.join(this.sourcePath, 'Data', 'Media');
    try {
      if (!fs.existsSync(mediaDir)) return;
      const files = fs.readdirSync(mediaDir);
      this.mediaFiles = files.filter((f) =>
        /\.(jpg|jpeg|png|bmp|gif|mp4|webm)$/i.test(f)
      );
    } catch (err) {
      this.errors.push({
        step: 'media',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

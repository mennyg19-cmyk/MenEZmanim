export interface BackupData {
  version: string;
  exportedAt: string;
  organization: any;
  styles: any[];
  displayObjects: any[];
  scheduleGroups: any[];
  zmanimConfig: any[];
  minyanSchedules: any[];
  announcements: any[];
  memorials: any[];
  sponsors: any[];
  media: any[];
}

const BACKUP_VERSION = '1.0';

export function generateJsonBackup(data: BackupData): string {
  const payload: BackupData = {
    ...data,
    version: data.version ?? BACKUP_VERSION,
    exportedAt: data.exportedAt ?? new Date().toISOString(),
  };
  return JSON.stringify(payload, null, 2);
}

export function parseJsonBackup(json: string): BackupData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    throw new Error(`Invalid JSON backup: ${e instanceof Error ? e.message : String(e)}`);
  }

  if (parsed === null || typeof parsed !== 'object') {
    throw new Error('Backup data must be an object');
  }

  const obj = parsed as Record<string, unknown>;

  const required: (keyof BackupData)[] = [
    'version',
    'exportedAt',
    'organization',
    'styles',
    'displayObjects',
    'scheduleGroups',
    'zmanimConfig',
    'minyanSchedules',
    'announcements',
    'memorials',
    'sponsors',
    'media',
  ];

  for (const key of required) {
    if (!(key in obj)) {
      throw new Error(`Backup data missing required field: ${key}`);
    }
  }

  return {
    version: String(obj.version),
    exportedAt: String(obj.exportedAt),
    organization: obj.organization,
    styles: Array.isArray(obj.styles) ? obj.styles : [],
    displayObjects: Array.isArray(obj.displayObjects) ? obj.displayObjects : [],
    scheduleGroups: Array.isArray(obj.scheduleGroups) ? obj.scheduleGroups : [],
    zmanimConfig: Array.isArray(obj.zmanimConfig) ? obj.zmanimConfig : [],
    minyanSchedules: Array.isArray(obj.minyanSchedules) ? obj.minyanSchedules : [],
    announcements: Array.isArray(obj.announcements) ? obj.announcements : [],
    memorials: Array.isArray(obj.memorials) ? obj.memorials : [],
    sponsors: Array.isArray(obj.sponsors) ? obj.sponsors : [],
    media: Array.isArray(obj.media) ? obj.media : [],
  };
}

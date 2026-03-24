/** Mirrors `Section` in AdminApp — keep in sync when nav changes */
export type AdminSection =
  | 'dashboard'
  | 'editor'
  | 'screens'
  | 'settings'
  | 'members'
  | 'schedules'
  | 'content-hub'
  | 'import-export';

export type { ScheduleEditorTab } from '../admin/ScheduleEditor';

export type EditorPropertyTab = 'general' | 'appearance' | 'content';

export type ChapterId =
  | 'welcome'
  | 'styles'
  | 'screens'
  | 'groups'
  | 'events'
  | 'editor'
  | 'widgets'
  | 'settings';

import type { DisplayStyle } from '@zmanim-app/core';

export interface Organization {
  id: string;
  name: string;
  nameHebrew: string;
  slug: string;
  location: {
    name: string;
    latitude: number;
    longitude: number;
    elevation: number;
    timezone: string;
    inIsrael: boolean;
  };
  settings: Record<string, unknown>;
}

export interface Screen {
  id: string;
  orgId: string;
  name: string;
  styleId: string;
  active: boolean;
  resolution?: string;
}

export interface Announcement {
  id: string;
  orgId: string;
  title: string;
  titleHebrew?: string;
  content: string;
  contentHebrew?: string;
  priority: number;
  active: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface Memorial {
  id: string;
  orgId: string;
  hebrewName: string;
  englishName?: string;
  hebrewDate: string;
  hebrewMonth: number;
  hebrewDay: number;
  relationship?: string;
  notes?: string;
}

export interface DaveningGroup {
  id: string;
  name: string;
  nameHebrew: string;
  color: string;
  sortOrder: number;
  active: boolean;
}

export type VisibilityCondition =
  | 'weekday'
  | 'shabbos'
  | 'chol_hamoed'
  | 'yom_tov'
  | 'fast_day'
  | 'erev_shabbos'
  | 'erev_chag'
  | 'erev_pesach'
  | 'chanukah'
  | 'behab'
  | 'rosh_chodesh'
  | 'purim'
  | 'dst_on'
  | 'dst_off';

export interface VisibilityRule {
  condition: VisibilityCondition;
  show: boolean;
}

export interface MinyanSchedule {
  id: string;
  orgId: string;
  name: string;
  type: string;
  groupId?: string;

  timeMode?: 'fixed' | 'dynamic';
  fixedTime?: string;
  baseZman?: string;
  offset?: number;
  roundTo?: number;
  roundMode?: 'nearest' | 'before' | 'after';
  limitBefore?: string;
  limitAfter?: string;

  durationMinutes?: number;

  daysActive?: boolean[];
  visibilityRules?: VisibilityRule[];

  room?: string;
  sortOrder?: number;
  isPlaceholder?: boolean;
  placeholderLabel?: string;
}

export interface MediaItem {
  id: string;
  orgId: string;
  url: string;
  filename: string;
  mimeType: string;
  uploadedAt: string;
}

export type { DisplayStyle };

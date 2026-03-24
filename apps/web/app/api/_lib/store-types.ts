import type { DisplayStyle, ScreenStyleSchedule, VisibilityRule } from '@zmanim-app/core';

export type { VisibilityCondition, VisibilityRule } from '@zmanim-app/core';

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
  /** Subscription tier from DB */
  plan?: string;
}

export interface Screen {
  id: string;
  orgId: string;
  name: string;
  styleId: string;
  active: boolean;
  resolution?: string;
  /** Per-screen style rules (when omitted, server/runtime migrates from styleId + style activation rules). */
  styleSchedules?: ScreenStyleSchedule[] | null;
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
  /** Same calendar visibility rules as minyan events (`scheduleRules` JSON in DB). */
  visibilityRules?: VisibilityRule[];
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

  /**
   * How often a dynamic time recalculates.
   * - `daily` (default): uses today's zman
   * - `weekly`: uses the latest zman in the current week (anchor day = refreshAnchorDay)
   * - `monthly`: uses the latest zman in the current month
   */
  refreshMode?: 'daily' | 'weekly' | 'monthly';
  /** Day of week (0=Sun..6=Sat) that starts the "week" for weekly refresh. Default 0 (Sunday). */
  refreshAnchorDay?: number;

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

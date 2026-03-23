/**
 * Event Box Schedule — calendar-driven group selection for EVENTS_TABLE widgets.
 *
 * Each schedule entry has:
 *  - `id` — unique identifier
 *  - `name` — human-readable label (e.g. "Winter Weekday", "Shabbos Chanukah")
 *  - `defaultGroupIds` — the groups shown when no date override matches
 *  - `overrides` — date ranges that replace the default groups
 *
 * Multiple schedules can be attached to one EVENTS_TABLE widget.
 * The widget picks the first schedule whose conditions match today,
 * or falls back to the legacy static `groupIds` if no schedules exist.
 */

export interface EventBoxDateOverride {
  id: string;
  /** Inclusive start date (YYYY-MM-DD) */
  startDate: string;
  /** Inclusive end date (YYYY-MM-DD) */
  endDate: string;
  /** Group IDs to show during this date range */
  groupIds: string[];
  /** Optional label for the override */
  label?: string;
}

export interface EventBoxScheduleEntry {
  id: string;
  name: string;
  /** Default group IDs when no override matches */
  defaultGroupIds: string[];
  /** Date-range overrides (checked in order; first match wins) */
  overrides: EventBoxDateOverride[];
}

/**
 * Given today's date and a list of schedule entries, resolve which group IDs
 * should be displayed. Returns the group IDs from the first matching schedule
 * entry (checking overrides first, then defaults).
 *
 * If no schedules are provided, returns `fallbackGroupIds` (the legacy static list).
 */
export function resolveEventBoxGroups(
  schedules: EventBoxScheduleEntry[] | undefined,
  fallbackGroupIds: string[] | undefined,
  today: Date,
): string[] {
  if (!schedules || schedules.length === 0) {
    return fallbackGroupIds ?? [];
  }

  const todayStr = formatLocalDate(today);

  for (const sched of schedules) {
    for (const ov of sched.overrides) {
      if (todayStr >= ov.startDate && todayStr <= ov.endDate) {
        return ov.groupIds;
      }
    }
  }

  // No override matched — use the first schedule's defaults
  return schedules[0].defaultGroupIds;
}

/**
 * Validate that no two overrides across all schedules share the same date.
 * Returns an array of conflict descriptions (empty = valid).
 */
export function findOverrideDateConflicts(schedules: EventBoxScheduleEntry[]): string[] {
  const conflicts: string[] = [];
  const dateMap = new Map<string, string>();

  for (const sched of schedules) {
    for (const ov of sched.overrides) {
      const start = ov.startDate;
      const end = ov.endDate;
      const d = new Date(start);
      const endD = new Date(end);
      while (d <= endD) {
        const ds = formatLocalDate(d);
        const existing = dateMap.get(ds);
        if (existing && existing !== ov.id) {
          conflicts.push(`${ds} is in multiple overrides`);
        }
        dateMap.set(ds, ov.id);
        d.setDate(d.getDate() + 1);
      }
    }
  }

  return [...new Set(conflicts)];
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function createEmptyScheduleEntry(): EventBoxScheduleEntry {
  return {
    id: `ebs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: 'New Schedule',
    defaultGroupIds: [],
    overrides: [],
  };
}

export function createEmptyOverride(): EventBoxDateOverride {
  const today = new Date();
  const todayStr = formatLocalDate(today);
  return {
    id: `ov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    startDate: todayStr,
    endDate: todayStr,
    groupIds: [],
    label: '',
  };
}

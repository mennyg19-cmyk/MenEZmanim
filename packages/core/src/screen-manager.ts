import {
  getActiveStyle,
  evaluateStyleScheduleRules,
  orderedScreenSchedulesForBreakpoint,
  resolveScreenStyleSchedules,
  type DisplayStyle,
  type DisplayBreakpoint,
  type ScreenStyleSchedule,
} from './style-engine';

export interface ScreenConfig {
  id: string;
  name: string;
  orgId: string;
  assignedStyleId?: string;
  /** Persisted schedules (preferred). When empty, use legacy assignedStyleId + style activation rules. */
  styleSchedules?: ScreenStyleSchedule[] | null;
  /** Raw DB JSON; used when styleSchedules is not provided */
  styleSchedulesJson?: string | null;
  resolution: { width: number; height: number };
  isActive: boolean;
}

export interface ScreenRegistration {
  screenId: string;
  clientId: string;
  lastPing: number;
  status: 'online' | 'offline';
}

const HEARTBEAT_TIMEOUT_MS = 60_000;

export class ScreenManager {
  private screens: Map<string, ScreenRegistration> = new Map();

  constructor() {}

  registerScreen(screenId: string, clientId: string): void {
    const now = Date.now();
    this.screens.set(screenId, {
      screenId,
      clientId,
      lastPing: now,
      status: 'online',
    });
  }

  unregisterScreen(screenId: string): void {
    this.screens.delete(screenId);
  }

  heartbeat(screenId: string): void {
    const reg = this.screens.get(screenId);
    if (reg) {
      reg.lastPing = Date.now();
      reg.status = 'online';
    }
  }

  getOnlineScreens(): ScreenRegistration[] {
    const now = Date.now();
    const result: ScreenRegistration[] = [];
    for (const reg of this.screens.values()) {
      const status = now - reg.lastPing <= HEARTBEAT_TIMEOUT_MS ? 'online' : 'offline';
      if (status === 'online') {
        result.push({ ...reg, status });
      }
    }
    return result;
  }

  isScreenOnline(screenId: string): boolean {
    const reg = this.screens.get(screenId);
    if (!reg) return false;
    return Date.now() - reg.lastPing <= HEARTBEAT_TIMEOUT_MS;
  }

  resolveStyleForScreen(
    screen: ScreenConfig,
    allStyles: DisplayStyle[],
    date: Date,
    inIsrael: boolean,
    breakpoint: DisplayBreakpoint,
  ): DisplayStyle | null {
    let schedules: ScreenStyleSchedule[] = [];

    if (screen.styleSchedules && screen.styleSchedules.length > 0) {
      schedules = screen.styleSchedules;
    } else {
      schedules = resolveScreenStyleSchedules(
        screen.styleSchedulesJson ?? null,
        screen.assignedStyleId ?? undefined,
        allStyles,
      );
    }

    if (schedules.length > 0) {
      const ordered = orderedScreenSchedulesForBreakpoint(schedules, breakpoint);
      for (const entry of ordered) {
        if (evaluateStyleScheduleRules(entry.rules, date)) {
          const chosen = allStyles.find((s) => s.id === entry.styleId);
          if (chosen) return chosen;
        }
      }
    }

    if (screen.assignedStyleId) {
      const assigned = allStyles.find((s) => s.id === screen.assignedStyleId);
      if (assigned) return assigned;
    }

    return getActiveStyle(allStyles, date, inIsrael);
  }
}

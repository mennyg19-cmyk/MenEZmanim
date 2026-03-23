import { NextRequest } from 'next/server';
import { ZmanimEngine, DEFAULT_OPINIONS } from '@zmanim-app/core';
import type { ZmanimConfig, ZmanConfig } from '@zmanim-app/core';
import { json, error, options } from '../../../_lib/response';
import * as da from '../../../_lib/data-access';
import type { MinyanSchedule } from '../../../_lib/store-types';
import { authorizeWrite, isAuthError } from '../../../_lib/auth-helpers';

type Ctx = { params: Promise<{ orgId: string }> };

function formatTimeForDisplay(s: MinyanSchedule): string {
  if (s.isPlaceholder) return '';
  const raw = s.fixedTime;
  if (!raw) return '';
  const [hStr, mStr] = raw.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return raw;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function buildZmanimConfig(org: any): ZmanimConfig {
  const zmanim: ZmanConfig[] = [];
  for (const [type, opinion] of DEFAULT_OPINIONS.entries()) {
    zmanim.push({ type, authority: opinion.authority, degreesBelow: opinion.degreesBelow, fixedMinutes: opinion.fixedMinutes });
  }
  const loc = org?.location ?? {};
  return {
    location: {
      name: loc.name ?? 'Default',
      latitude: loc.latitude ?? 31.79,
      longitude: loc.longitude ?? 35.21,
      elevation: loc.elevation ?? 0,
      timezone: loc.timezone ?? 'Asia/Jerusalem',
      inIsrael: loc.inIsrael ?? true,
    },
    zmanim,
    candleLightingMinutes: 40,
  };
}

function getPeriodEndDate(now: Date, mode: string, anchorDay: number): Date {
  if (mode === 'monthly') {
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }
  // weekly: find the last day of the current week (anchor + 6)
  const dow = now.getDay();
  const daysSinceAnchor = (dow - anchorDay + 7) % 7;
  const daysUntilEnd = 6 - daysSinceAnchor;
  const end = new Date(now);
  end.setDate(end.getDate() + daysUntilEnd);
  return end;
}

function resolveRefreshTime(
  schedule: MinyanSchedule,
  zmanimEngine: ZmanimEngine,
  now: Date,
): string | undefined {
  const rm = schedule.refreshMode;
  if (!rm || rm === 'daily') return undefined;
  if (schedule.timeMode !== 'dynamic' || !schedule.baseZman) return undefined;

  const anchorDay = schedule.refreshAnchorDay ?? 0;
  const endDate = getPeriodEndDate(now, rm, anchorDay);

  const targetKey = String(schedule.baseZman).toLowerCase().replace(/[^a-z]/g, '');
  const zmanimForEnd = zmanimEngine.getZmanimForDate(endDate);
  const z = zmanimForEnd.find((zr: any) => {
    const normType = (zr.type || '').toLowerCase().replace(/[^a-z]/g, '');
    return normType.includes(targetKey);
  });
  if (!z?.time) return undefined;

  let t = new Date(z.time);
  const offsetMin = schedule.offset ?? 0;
  t = new Date(t.getTime() + offsetMin * 60_000);

  const roundTo = schedule.roundTo ?? 1;
  const roundMode = schedule.roundMode ?? 'nearest';
  if (roundTo > 1) {
    const mins = t.getHours() * 60 + t.getMinutes();
    const q = mins / roundTo;
    let rounded: number;
    if (roundMode === 'before') rounded = Math.floor(q) * roundTo;
    else if (roundMode === 'after') rounded = Math.ceil(q) * roundTo;
    else rounded = Math.round(q) * roundTo;
    t.setHours(Math.floor(rounded / 60), rounded % 60, 0, 0);
  }

  if (schedule.limitBefore) {
    const [hStr, mStr] = schedule.limitBefore.split(':');
    const h = parseInt(hStr, 10), m = parseInt(mStr, 10);
    if (!isNaN(h) && !isNaN(m)) {
      const minD = new Date(t); minD.setHours(h, m, 0, 0);
      if (t < minD) t = minD;
    }
  }
  if (schedule.limitAfter) {
    const [hStr, mStr] = schedule.limitAfter.split(':');
    const h = parseInt(hStr, 10), m = parseInt(mStr, 10);
    if (!isNaN(h) && !isNaN(m)) {
      const maxD = new Date(t); maxD.setHours(h, m, 0, 0);
      if (t > maxD) t = maxD;
    }
  }

  const hh = t.getHours();
  const mm = t.getMinutes();
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function enrichSchedule(s: MinyanSchedule, resolvedTimes: Map<string, string>) {
  const rt = resolvedTimes.get(s.id);
  return {
    ...s,
    hebrewName: s.name,
    time: formatTimeForDisplay(s),
    ...(rt ? { resolvedFixedTime: rt } : {}),
  };
}

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const org = await da.getOrg(orgId);
    if (!org) return error('Organization not found', 404);
    const schedules = await da.getOrgSchedules(orgId);

    const resolvedTimes = new Map<string, string>();
    const needsResolve = schedules.some((s) => s.refreshMode && s.refreshMode !== 'daily');
    if (needsResolve) {
      const config = buildZmanimConfig(org);
      const engine = new ZmanimEngine(config);
      const now = new Date();
      for (const s of schedules) {
        const rt = resolveRefreshTime(s, engine, now);
        if (rt) resolvedTimes.set(s.id, rt);
      }
    }

    return json(schedules.map((s) => enrichSchedule(s, resolvedTimes)));
  } catch (err) {
    console.error('Schedules GET error:', err);
    return error('Internal server error', 500);
  }
}

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const authResult = await authorizeWrite(orgId);
    if (isAuthError(authResult)) return authResult;
    const org = await da.getOrg(orgId);
    if (!org) return error('Organization not found', 404);

    const body = await request.json();
    const resolvedId = (await da.resolveOrgId(orgId)) ?? org.id;
    const schedule: MinyanSchedule = {
      id: body.id ?? `sched-${Date.now()}`,
      orgId: resolvedId,
      name: body.name ?? '',
      type: body.type ?? 'Other',
      groupId: body.groupId,
      timeMode: body.timeMode ?? 'fixed',
      fixedTime: body.fixedTime,
      baseZman: body.baseZman,
      offset: body.offset,
      roundTo: body.roundTo,
      roundMode: body.roundMode,
      limitBefore: body.limitBefore,
      limitAfter: body.limitAfter,
      refreshMode: body.refreshMode,
      refreshAnchorDay: body.refreshAnchorDay,
      durationMinutes: body.durationMinutes,
      daysActive: body.daysActive,
      visibilityRules: body.visibilityRules,
      room: body.room,
      sortOrder: body.sortOrder,
      isPlaceholder: body.isPlaceholder,
      placeholderLabel: body.placeholderLabel,
    };

    const created = await da.appendSchedule(resolvedId, schedule);
    return json(created, 201);
  } catch (err) {
    console.error('Schedules POST error:', err);
    return error('Internal server error', 500);
  }
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const authResult = await authorizeWrite(orgId);
    if (isAuthError(authResult)) return authResult;
    const org = await da.getOrg(orgId);
    if (!org) return error('Organization not found', 404);

    const body = (await request.json()) as MinyanSchedule[];
    const resolvedId = (await da.resolveOrgId(orgId)) ?? org.id;
    await da.replaceSchedules(resolvedId, body);
    return json(body);
  } catch (err) {
    console.error('Schedules PUT error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}

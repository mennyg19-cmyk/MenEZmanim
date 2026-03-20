import { NextRequest } from 'next/server';
import { json, error, options } from '../../../_lib/response';
import { store, type MinyanSchedule } from '../../../_lib/store';

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

function enrichSchedule(s: MinyanSchedule) {
  return {
    ...s,
    hebrewName: s.name,
    time: formatTimeForDisplay(s),
  };
}

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const org = store.getOrg(orgId);
    if (!org) return error('Organization not found', 404);
    const schedules = store.getOrgSchedules(orgId);
    return json(schedules.map(enrichSchedule));
  } catch (err) {
    console.error('Schedules GET error:', err);
    return error('Internal server error', 500);
  }
}

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const org = store.getOrg(orgId);
    if (!org) return error('Organization not found', 404);

    const body = await request.json();
    const resolvedId = store.resolveOrgId(orgId) ?? orgId;
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
      durationMinutes: body.durationMinutes,
      daysActive: body.daysActive,
      visibilityRules: body.visibilityRules,
      room: body.room,
      sortOrder: body.sortOrder,
      isPlaceholder: body.isPlaceholder,
      placeholderLabel: body.placeholderLabel,
    };

    const existing = store.schedules.get(resolvedId) ?? [];
    existing.push(schedule);
    store.schedules.set(resolvedId, existing);
    return json(schedule, 201);
  } catch (err) {
    console.error('Schedules POST error:', err);
    return error('Internal server error', 500);
  }
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const org = store.getOrg(orgId);
    if (!org) return error('Organization not found', 404);

    const body = await request.json() as MinyanSchedule[];
    const resolvedId = store.resolveOrgId(orgId) ?? orgId;
    store.schedules.set(resolvedId, body);
    return json(body);
  } catch (err) {
    console.error('Schedules PUT error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}

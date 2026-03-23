import { NextRequest } from 'next/server';
import { evaluateVisibilityRules } from '@zmanim-app/core';
import { json, error, options } from '../../../_lib/response';
import * as da from '../../../_lib/data-access';
import { authorizeWrite, isAuthError } from '../../../_lib/auth-helpers';
import { wallClockDateInTimeZone, isDstInTimeZone } from '../../../_lib/timezone';

type Ctx = { params: Promise<{ orgId: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const org = await da.getOrg(orgId);
    if (!org) return error('Organization not found', 404);

    const all = await da.getOrgAnnouncements(orgId);
    const now = new Date().toISOString();
    const tz = org.location?.timezone ?? 'UTC';
    const instant = new Date();
    const localDate = wallClockDateInTimeZone(instant, tz);
    const isDST = isDstInTimeZone(instant, tz);

    const active = all.filter((a) => {
      if (!a.active) return false;
      if (a.startDate && a.startDate > now) return false;
      if (a.endDate && a.endDate < now) return false;
      const rules = a.visibilityRules ?? [];
      if (rules.length > 0 && !evaluateVisibilityRules(rules, localDate, isDST)) return false;
      return true;
    });

    return json(active);
  } catch (err) {
    console.error('Announcements GET error:', err);
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
    const announcement = await da.createAnnouncement(resolvedId, body);

    return json(announcement, 201);
  } catch (err) {
    console.error('Announcements POST error:', err);
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
    const body = await request.json();
    if (!body.id) return error('Announcement id is required', 400);

    const resolvedId = (await da.resolveOrgId(orgId)) ?? org.id;
    const updated = await da.updateAnnouncement(resolvedId, body);
    if (!updated) return error('Announcement not found', 404);

    return json(updated);
  } catch (err) {
    console.error('Announcements PUT error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}

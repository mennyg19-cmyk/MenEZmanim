import { NextRequest } from 'next/server';
import { json, error, options } from '../../../_lib/response';
import * as da from '../../../_lib/data-access';
import type { DaveningGroup } from '../../../_lib/store-types';

type Ctx = { params: Promise<{ orgId: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const org = await da.getOrg(orgId);
    if (!org) return error('Organization not found', 404);
    return json(await da.getOrgGroups(orgId));
  } catch (err) {
    console.error('Groups GET error:', err);
    return error('Internal server error', 500);
  }
}

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const org = await da.getOrg(orgId);
    if (!org) return error('Organization not found', 404);

    const body = await request.json();
    const resolvedId = (await da.resolveOrgId(orgId)) ?? org.id;
    const existing = await da.getOrgGroups(orgId);

    const group: DaveningGroup = {
      id: body.id ?? `group-${Date.now()}`,
      name: body.name ?? '',
      nameHebrew: body.nameHebrew ?? '',
      color: body.color ?? '#3b82f6',
      sortOrder: body.sortOrder ?? existing.length,
      active: body.active ?? true,
    };

    const created = await da.appendGroup(resolvedId, group);
    return json(created, 201);
  } catch (err) {
    console.error('Groups POST error:', err);
    return error('Internal server error', 500);
  }
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const org = await da.getOrg(orgId);
    if (!org) return error('Organization not found', 404);

    const body = (await request.json()) as DaveningGroup[];
    const resolvedId = (await da.resolveOrgId(orgId)) ?? org.id;
    await da.replaceGroups(resolvedId, body);
    return json(body);
  } catch (err) {
    console.error('Groups PUT error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}

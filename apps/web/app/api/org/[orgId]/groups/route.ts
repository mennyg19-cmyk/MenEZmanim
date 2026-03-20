import { NextRequest } from 'next/server';
import { json, error, options } from '../../../_lib/response';
import { store, type DaveningGroup } from '../../../_lib/store';

type Ctx = { params: Promise<{ orgId: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const org = store.getOrg(orgId);
    if (!org) return error('Organization not found', 404);
    return json(store.getOrgGroups(orgId));
  } catch (err) {
    console.error('Groups GET error:', err);
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
    const existing = store.groups.get(resolvedId) ?? [];

    const group: DaveningGroup = {
      id: body.id ?? `group-${Date.now()}`,
      name: body.name ?? '',
      nameHebrew: body.nameHebrew ?? '',
      color: body.color ?? '#3b82f6',
      sortOrder: body.sortOrder ?? existing.length,
      active: body.active ?? true,
    };

    existing.push(group);
    store.groups.set(resolvedId, existing);
    return json(group, 201);
  } catch (err) {
    console.error('Groups POST error:', err);
    return error('Internal server error', 500);
  }
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const org = store.getOrg(orgId);
    if (!org) return error('Organization not found', 404);

    const body = await request.json() as DaveningGroup[];
    const resolvedId = store.resolveOrgId(orgId) ?? orgId;
    store.groups.set(resolvedId, body);
    return json(body);
  } catch (err) {
    console.error('Groups PUT error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}

import { NextRequest } from 'next/server';
import { json, error, options } from '../../_lib/response';
import { store } from '../../_lib/store';

type Ctx = { params: Promise<{ orgId: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const org = store.getOrg(orgId);
    if (!org) return error('Organization not found', 404);
    return json(org);
  } catch (err) {
    console.error('Org GET error:', err);
    return error('Internal server error', 500);
  }
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const org = store.getOrg(orgId);
    if (!org) return error('Organization not found', 404);

    const body = await request.json();
    const updated = { ...org, ...body, id: orgId };
    store.orgs.set(orgId, updated);
    return json(updated);
  } catch (err) {
    console.error('Org PUT error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}

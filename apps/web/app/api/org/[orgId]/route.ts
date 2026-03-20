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
    // Keep canonical org.id (e.g. "default"); URL may use slug "demo" — do not overwrite id with slug.
    const canonicalId = org.id;
    const updated = { ...org, ...body, id: canonicalId };
    store.orgs.set(canonicalId, updated);
    if (org.slug && org.slug !== canonicalId) {
      store.orgs.set(org.slug, updated);
    }
    return json(updated);
  } catch (err) {
    console.error('Org PUT error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}

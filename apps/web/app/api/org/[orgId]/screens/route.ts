import { NextRequest } from 'next/server';
import { json, error, options } from '../../../_lib/response';
import { store } from '../../../_lib/store';

type Ctx = { params: Promise<{ orgId: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const org = store.getOrg(orgId);
    if (!org) return error('Organization not found', 404);

    return json(store.getOrgScreens(orgId));
  } catch (err) {
    console.error('Screens GET error:', err);
    return error('Internal server error', 500);
  }
}

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const org = store.getOrg(orgId);
    if (!org) return error('Organization not found', 404);

    const body = await request.json();
    const screen = {
      id: `screen-${Date.now()}`,
      orgId,
      name: body.name ?? 'New Screen',
      styleId: body.styleId ?? '',
      active: body.active ?? true,
      resolution: body.resolution ?? '1920x1080',
    };

    const existing = store.screens.get(orgId) ?? [];
    existing.push(screen);
    store.screens.set(orgId, existing);

    return json(screen, 201);
  } catch (err) {
    console.error('Screens POST error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}

import { NextRequest } from 'next/server';
import { json, error, options } from '../../../_lib/response';
import { store } from '../../../_lib/store';

type Ctx = { params: Promise<{ orgId: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const org = store.getOrg(orgId);
    if (!org) return error('Organization not found', 404);

    return json(store.getOrgStyles(orgId));
  } catch (err) {
    console.error('Styles GET error:', err);
    return error('Internal server error', 500);
  }
}

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const resolvedId = store.resolveOrgId(orgId);
    if (!resolvedId) return error('Organization not found', 404);

    const body = await request.json();
    const id = body.id ?? `style-${Date.now()}`;
    const style = {
      id,
      name: body.name ?? 'Untitled Style',
      backgroundColor: body.backgroundColor ?? '#000000',
      canvasWidth: body.canvasWidth ?? 1920,
      canvasHeight: body.canvasHeight ?? 1080,
      objects: body.objects ?? [],
      activationRules: body.activationRules ?? [{ type: 'default' as const }],
      sortOrder: body.sortOrder ?? 0,
      ...body,
    };

    const existing = store.styles.get(resolvedId) ?? [];
    existing.push(style);
    store.styles.set(resolvedId, existing);

    return json(style, 201);
  } catch (err) {
    console.error('Styles POST error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}

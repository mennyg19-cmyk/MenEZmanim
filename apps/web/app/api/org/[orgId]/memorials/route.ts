import { NextRequest } from 'next/server';
import { json, error, options } from '../../../_lib/response';
import * as da from '../../../_lib/data-access';

type Ctx = { params: Promise<{ orgId: string }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const org = await da.getOrg(orgId);
    if (!org) return error('Organization not found', 404);

    const all = await da.getOrgMemorials(orgId);

    const { searchParams } = request.nextUrl;
    const monthParam = searchParams.get('month');
    const dayParam = searchParams.get('day');

    if (monthParam && dayParam) {
      const month = parseInt(monthParam, 10);
      const day = parseInt(dayParam, 10);
      const filtered = all.filter((m) => m.hebrewMonth === month && m.hebrewDay === day);
      return json(filtered);
    }

    return json(all);
  } catch (err) {
    console.error('Memorials GET error:', err);
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
    const memorial = await da.createMemorial(resolvedId, {
      ...body,
      id: body.id ?? `mem-${Date.now()}`,
    });

    return json(memorial, 201);
  } catch (err) {
    console.error('Memorials POST error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}

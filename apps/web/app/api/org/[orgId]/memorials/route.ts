import { NextRequest } from 'next/server';
import { json, error, options } from '../../../_lib/response';
import { store, type Memorial } from '../../../_lib/store';

type Ctx = { params: Promise<{ orgId: string }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const org = store.getOrg(orgId);
    if (!org) return error('Organization not found', 404);

    const all = store.getOrgMemorials(orgId);

    const { searchParams } = request.nextUrl;
    const monthParam = searchParams.get('month');
    const dayParam = searchParams.get('day');

    if (monthParam && dayParam) {
      const month = parseInt(monthParam, 10);
      const day = parseInt(dayParam, 10);
      const filtered = all.filter(
        (m) => m.hebrewMonth === month && m.hebrewDay === day,
      );
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
    const org = store.getOrg(orgId);
    if (!org) return error('Organization not found', 404);

    const body = await request.json();
    const memorial: Memorial = {
      id: `mem-${Date.now()}`,
      orgId,
      hebrewName: body.hebrewName ?? '',
      englishName: body.englishName,
      hebrewDate: body.hebrewDate ?? '',
      hebrewMonth: body.hebrewMonth ?? 0,
      hebrewDay: body.hebrewDay ?? 0,
      relationship: body.relationship,
      notes: body.notes,
    };

    const existing = store.memorials.get(orgId) ?? [];
    existing.push(memorial);
    store.memorials.set(orgId, existing);

    return json(memorial, 201);
  } catch (err) {
    console.error('Memorials POST error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}

import { NextRequest } from 'next/server';
import { json, error, options } from '../../../_lib/response';
import { store, type Announcement } from '../../../_lib/store';

type Ctx = { params: Promise<{ orgId: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const org = store.getOrg(orgId);
    if (!org) return error('Organization not found', 404);

    const all = store.getOrgAnnouncements(orgId);
    const now = new Date().toISOString();

    const active = all.filter((a) => {
      if (!a.active) return false;
      if (a.startDate && a.startDate > now) return false;
      if (a.endDate && a.endDate < now) return false;
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
    const org = store.getOrg(orgId);
    if (!org) return error('Organization not found', 404);

    const body = await request.json();
    const announcement: Announcement = {
      id: `ann-${Date.now()}`,
      orgId,
      title: body.title ?? '',
      titleHebrew: body.titleHebrew,
      content: body.content ?? '',
      contentHebrew: body.contentHebrew,
      priority: body.priority ?? 0,
      active: body.active ?? true,
      startDate: body.startDate,
      endDate: body.endDate,
      createdAt: new Date().toISOString(),
    };

    const existing = store.announcements.get(orgId) ?? [];
    existing.push(announcement);
    store.announcements.set(orgId, existing);

    return json(announcement, 201);
  } catch (err) {
    console.error('Announcements POST error:', err);
    return error('Internal server error', 500);
  }
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const body = await request.json();
    if (!body.id) return error('Announcement id is required', 400);

    const list = store.announcements.get(orgId) ?? [];
    const idx = list.findIndex((a) => a.id === body.id);
    if (idx === -1) return error('Announcement not found', 404);

    list[idx] = { ...list[idx], ...body, orgId };
    store.announcements.set(orgId, list);

    return json(list[idx]);
  } catch (err) {
    console.error('Announcements PUT error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}

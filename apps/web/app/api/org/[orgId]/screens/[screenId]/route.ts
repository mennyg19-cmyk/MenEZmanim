import { NextRequest } from 'next/server';
import { json, error, options } from '../../../../_lib/response';
import * as da from '../../../../_lib/data-access';

type Ctx = { params: Promise<{ orgId: string; screenId: string }> };

function parseResolution(res: string): { width: number; height: number } {
  const match = res?.match(/^(\d+)\s*x\s*(\d+)$/i) ?? res?.match(/^(\d+)x(\d+)$/i);
  if (match) {
    return { width: parseInt(match[1], 10) || 1920, height: parseInt(match[2], 10) || 1080 };
  }
  return { width: 1920, height: 1080 };
}

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    const { orgId, screenId } = await ctx.params;
    const org = await da.getOrg(orgId);
    if (!org) return error('Organization not found', 404);

    const screens = await da.getOrgScreens(orgId);
    let screen = screens.find((s) => s.id === screenId);
    if (!screen) {
      const idx = parseInt(screenId, 10);
      if (!isNaN(idx) && idx >= 1 && idx <= screens.length) {
        screen = screens[idx - 1];
      }
    }
    if (!screen && screens.length > 0) {
      screen = screens[0];
    }
    if (!screen) return error('Screen not found', 404);

    const styles = await da.getOrgStyles(orgId);
    const assignedStyle = screen.styleId ? styles.find((s) => s.id === screen.styleId) : null;

    return json({
      ...screen,
      assignedStyle: assignedStyle ?? null,
      resolution: parseResolution(screen.resolution ?? '1920x1080'),
    });
  } catch (err) {
    console.error('Screen GET error:', err);
    return error('Internal server error', 500);
  }
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  try {
    const { orgId, screenId } = await ctx.params;
    const org = await da.getOrg(orgId);
    if (!org) return error('Organization not found', 404);

    const resolvedId = (await da.resolveOrgId(orgId)) ?? org.id;
    const screens = await da.getOrgScreens(orgId);
    const idx = screens.findIndex((s) => s.id === screenId);
    if (idx === -1) return error('Screen not found', 404);

    const body = await request.json();
    const updates: Parameters<typeof da.updateScreen>[2] = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.styleId !== undefined) updates.styleId = body.styleId;
    if (body.resolution !== undefined) updates.resolution = body.resolution;
    if (body.active !== undefined) updates.active = body.active;

    const updated = await da.updateScreen(resolvedId, screenId, updates);
    if (!updated) return error('Screen not found', 404);

    return json(updated);
  } catch (err) {
    console.error('Screen PUT error:', err);
    return error('Internal server error', 500);
  }
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  try {
    const { orgId, screenId } = await ctx.params;
    const org = await da.getOrg(orgId);
    if (!org) return error('Organization not found', 404);

    const resolvedId = (await da.resolveOrgId(orgId)) ?? org.id;
    const ok = await da.deleteScreen(resolvedId, screenId);
    if (!ok) return error('Screen not found', 404);

    return json({ deleted: true });
  } catch (err) {
    console.error('Screen DELETE error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}

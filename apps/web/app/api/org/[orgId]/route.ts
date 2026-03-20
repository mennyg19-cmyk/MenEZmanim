import { NextRequest } from 'next/server';
import { json, error, options } from '../../_lib/response';
import * as da from '../../_lib/data-access';
import type { Organization } from '../../_lib/store-types';

type Ctx = { params: Promise<{ orgId: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const org = await da.getOrg(orgId);
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
    const org = await da.getOrg(orgId);
    if (!org) return error('Organization not found', 404);

    const body = await request.json();
    const canonicalId = org.id;
    const updated: Organization = { ...org, ...body, id: canonicalId };
    if (body.location && typeof body.location === 'object') {
      updated.location = { ...org.location, ...(body.location as Organization['location']) };
    }
    if (body.settings && typeof body.settings === 'object') {
      updated.settings = { ...org.settings, ...(body.settings as Record<string, unknown>) };
    }
    const saved = await da.saveOrganizationDto(updated);
    return json(saved);
  } catch (err) {
    console.error('Org PUT error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}

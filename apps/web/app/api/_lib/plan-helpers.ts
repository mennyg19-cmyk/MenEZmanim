import { NextResponse } from 'next/server';
import { getDbClient } from '@zmanim-app/db';
import { normalizeOrgPlan, PLAN_LIMITS, type OrgPlan } from '@zmanim-app/core';
import * as da from './data-access';

function planLimit(plan: OrgPlan, key: 'screens' | 'styles' | 'members'): number {
  return PLAN_LIMITS[plan][key];
}

async function getResolvedOrgId(orgId: string): Promise<string | null> {
  return (await da.resolveOrgId(orgId)) ?? null;
}

export async function assertPlanScreenCreate(orgId: string): Promise<NextResponse | null> {
  const resolved = await getResolvedOrgId(orgId);
  if (!resolved) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  const db = getDbClient();
  const org = await db.organization.findUnique({ where: { id: resolved } });
  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  const plan = normalizeOrgPlan((org as { plan?: string }).plan);
  const limit = planLimit(plan, 'screens');
  if (limit < 0) return null;
  const n = await db.screen.count({ where: { orgId: resolved } });
  if (n >= limit) {
    return NextResponse.json(
      { error: `Screen limit reached for your plan (${plan}). Upgrade to add more screens.` },
      { status: 403 },
    );
  }
  return null;
}

export async function assertPlanStyleCreate(orgId: string): Promise<NextResponse | null> {
  const resolved = await getResolvedOrgId(orgId);
  if (!resolved) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  const db = getDbClient();
  const org = await db.organization.findUnique({ where: { id: resolved } });
  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  const plan = normalizeOrgPlan((org as { plan?: string }).plan);
  const limit = planLimit(plan, 'styles');
  if (limit < 0) return null;
  const n = await db.style.count({ where: { orgId: resolved } });
  if (n >= limit) {
    return NextResponse.json(
      { error: `Style limit reached for your plan (${plan}). Upgrade to add more styles.` },
      { status: 403 },
    );
  }
  return null;
}

export async function assertPlanMemberInvite(orgId: string): Promise<NextResponse | null> {
  const resolved = await getResolvedOrgId(orgId);
  if (!resolved) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  const db = getDbClient();
  const org = await db.organization.findUnique({ where: { id: resolved } });
  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  const plan = normalizeOrgPlan((org as { plan?: string }).plan);
  const limit = planLimit(plan, 'members');
  if (limit < 0) return null;
  const memberCount = await db.orgMembership.count({ where: { orgId: resolved } });
  const pendingInvites = await db.orgInvite.count({
    where: { orgId: resolved, usedAt: null, expiresAt: { gt: new Date() } },
  });
  if (memberCount + pendingInvites >= limit) {
    return NextResponse.json(
      { error: `Member / invite limit reached for your plan (${plan}).` },
      { status: 403 },
    );
  }
  return null;
}

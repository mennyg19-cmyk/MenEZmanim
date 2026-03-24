export type OrgPlan = 'free' | 'basic' | 'pro' | 'enterprise';

export const PLAN_LIMITS: Record<
  OrgPlan,
  {
    screens: number;
    styles: number;
    members: number;
  }
> = {
  free: { screens: 1, styles: 2, members: 2 },
  basic: { screens: 3, styles: 5, members: 5 },
  pro: { screens: 10, styles: 20, members: 20 },
  enterprise: { screens: -1, styles: -1, members: -1 },
};

export function normalizeOrgPlan(p: string | undefined | null): OrgPlan {
  const x = (p || 'free').toLowerCase();
  if (x === 'basic' || x === 'pro' || x === 'enterprise') return x;
  return 'free';
}

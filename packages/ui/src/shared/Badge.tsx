'use client';

import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'muted' | 'accent' | 'super';

export type BadgeArea = 'admin' | 'web' | 'mobile' | 'editor' | 'widget';

const ADMIN: Record<BadgeVariant, string> = {
  success: 'adm-badgeSuccess',
  warning: 'adm-badgeWarning',
  danger: 'adm-badgeDanger',
  muted: 'adm-badgeMuted',
  accent: 'adm-badgeAccent',
  super: 'adm-badgeMuted',
};

const WEB: Record<BadgeVariant, string> = {
  success: 'web-badge web-badge--active',
  warning: 'web-badge web-badge--pending',
  danger: 'web-badge web-badge--suspended',
  muted: 'web-badge',
  accent: 'web-badge',
  super: 'web-badge web-badge--super',
};

/** Mobile — semantic modifiers added in themes/mobile.css */
const MOBILE: Record<BadgeVariant, string> = {
  success: 'mob-annoBadge mob-annoBadge--success',
  warning: 'mob-annoBadge mob-annoBadge--warning',
  danger: 'mob-annoBadge mob-annoBadge--danger',
  muted: 'mob-annoBadge mob-annoBadge--muted',
  accent: 'mob-annoBadge mob-annoBadge--accent',
  super: 'mob-annoBadge mob-annoBadge--super',
};

const EDITOR: Record<BadgeVariant, string> = {
  success: 'ed-typeBadge',
  warning: 'ed-typeBadge',
  danger: 'ed-typeBadge',
  muted: 'ed-typeBadge',
  accent: 'ed-typeBadge',
  super: 'ed-typeBadge',
};

const WIDGET: Record<BadgeVariant, string> = {
  success: 'wgt-fidsNextBadge',
  warning: 'wgt-fidsNextBadge',
  danger: 'wgt-fidsNextBadge',
  muted: 'wgt-fidsNextBadge',
  accent: 'wgt-fidsNextBadge',
  super: 'wgt-fidsNextBadge',
};

function mapClass(area: BadgeArea, variant: BadgeVariant): string {
  switch (area) {
    case 'admin':
      return ADMIN[variant];
    case 'web':
      return WEB[variant];
    case 'mobile':
      return MOBILE[variant];
    case 'editor':
      return EDITOR[variant];
    case 'widget':
      return WIDGET[variant];
    default:
      return ADMIN[variant];
  }
}

export interface BadgeProps {
  variant?: BadgeVariant;
  area?: BadgeArea;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'muted', area = 'admin', children, className }: BadgeProps) {
  return <span className={`${mapClass(area, variant)} ${className ?? ''}`.trim()}>{children}</span>;
}

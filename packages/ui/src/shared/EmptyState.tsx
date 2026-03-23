'use client';

import React from 'react';

export type EmptyStateArea = 'admin' | 'editor' | 'mobile';

export interface EmptyStateProps {
  children: React.ReactNode;
  area?: EmptyStateArea;
  className?: string;
}

const AREA_CLASS: Record<EmptyStateArea, string> = {
  admin: 'adm-empty',
  editor: 'ed-smEmpty',
  mobile: 'mob-empty',
};

export function EmptyState({ children, area = 'admin', className }: EmptyStateProps) {
  return <div className={`${AREA_CLASS[area]} ${className ?? ''}`.trim()}>{children}</div>;
}

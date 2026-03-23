'use client';

import React, { useState } from 'react';
import { Badge } from '../shared/Badge';
import type { BadgeVariant } from '../shared/Badge';
import { EmptyState } from '../shared/EmptyState';

export interface MobileAnnouncementsProps {
  announcements: any[];
}

interface Announcement {
  id?: string;
  title: string;
  titleHebrew?: string;
  content: string;
  contentHebrew?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

const PRIORITY_BADGE: Record<string, { variant: BadgeVariant; label: string }> = {
  urgent: { variant: 'danger', label: 'Urgent' },
  high: { variant: 'warning', label: 'Important' },
  normal: { variant: 'accent', label: 'Info' },
  low: { variant: 'muted', label: '' },
};

function getPriorityBadge(p?: string) {
  return PRIORITY_BADGE[p ?? 'normal'] ?? PRIORITY_BADGE.normal;
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + '…';
}

export function MobileAnnouncements({ announcements }: MobileAnnouncementsProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  if (!announcements || announcements.length === 0) {
    return <EmptyState area="mobile">No announcements</EmptyState>;
  }

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="mob-annoList">
      {(announcements as Announcement[]).map((a, i) => {
        const id = a.id ?? `ann-${i}`;
        const isExpanded = expandedIds.has(id);
        const pb = getPriorityBadge(a.priority);
        const isLong = a.content.length > 120;

        return (
          <div key={id} className="mob-annoCard">
            <div
              onClick={() => isLong && toggle(id)}
              className="mob-annoHeader"
              style={{ cursor: isLong ? 'pointer' : 'default' }}
            >
              <div className="mob-annoStack">
                <div className="mob-annoTitleRow">
                  <span className="mob-annoTitle">
                    {a.title}
                  </span>
                  {pb.label && (
                    <Badge area="mobile" variant={pb.variant}>
                      {pb.label}
                    </Badge>
                  )}
                </div>
                <div className={`mob-annoInlineBody ${isExpanded ? 'mob-annoInlineBody--expanded' : ''}`.trim()}>
                  {isExpanded ? a.content : truncate(a.content, 120)}
                </div>
              </div>
              {isLong && (
                <span className={`mob-annoExpand ${isExpanded ? 'mob-annoExpand--open' : ''}`.trim()}>
                  ▾
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

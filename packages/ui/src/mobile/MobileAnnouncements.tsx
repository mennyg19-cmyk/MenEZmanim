'use client';

import React, { useState } from 'react';


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

const PRIORITY_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  urgent: { bg: '#FEE2E2', color: '#DC2626', label: 'Urgent' },
  high: { bg: '#FEF3C7', color: '#D97706', label: 'Important' },
  normal: { bg: '#E0E7FF', color: '#4F46E5', label: 'Info' },
  low: { bg: '#F3F4F6', color: '#6B7280', label: '' },
};

function getPriorityStyle(p?: string) {
  return PRIORITY_STYLES[p ?? 'normal'] ?? PRIORITY_STYLES.normal;
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + '…';
}

export function MobileAnnouncements({ announcements }: MobileAnnouncementsProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  if (!announcements || announcements.length === 0) {
    return (
      <div className="mob-empty">
        No announcements
      </div>
    );
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {(announcements as Announcement[]).map((a, i) => {
        const id = a.id ?? `ann-${i}`;
        const isExpanded = expandedIds.has(id);
        const ps = getPriorityStyle(a.priority);
        const isLong = a.content.length > 120;

        return (
          <div key={id} className="mob-annoCard">
            <div
              onClick={() => isLong && toggle(id)}
              className="mob-annoHeader"
              style={{ cursor: isLong ? 'pointer' : 'default' }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="mob-annoTitle">
                    {a.title}
                  </span>
                  {ps.label && (
                    <span
                      className="mob-annoBadge"
                      style={{ color: ps.color, backgroundColor: ps.bg }}
                    >
                      {ps.label}
                    </span>
                  )}
                </div>
                <div
                  className="mob-annoBody"
                  style={{
                    padding: 0,
                    marginTop: 6,
                    whiteSpace: isExpanded ? 'pre-wrap' : 'normal',
                  }}
                >
                  {isExpanded ? a.content : truncate(a.content, 120)}
                </div>
              </div>
              {isLong && (
                <span
                  className="mob-annoExpand"
                  style={{
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
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

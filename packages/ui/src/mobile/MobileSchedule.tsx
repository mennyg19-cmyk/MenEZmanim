'use client';

import React from 'react';


export interface MobileScheduleProps {
  schedule: any[];
  date: Date;
}

interface ScheduleItem {
  name: string;
  hebrewName?: string;
  time: string;
  room?: string;
  type?: string;
  isNext?: boolean;
}

const TYPE_ORDER = ['shacharit', 'mincha', 'maariv', 'other'];

const TYPE_LABELS: Record<string, string> = {
  shacharit: 'Shacharit',
  mincha: 'Mincha',
  maariv: 'Maariv',
  other: 'Other',
};

const TYPE_COLORS: Record<string, string> = {
  shacharit: '#F59E0B',
  mincha: '#F97316',
  maariv: '#6366F1',
  other: '#10B981',
};

function groupByType(items: ScheduleItem[]): Record<string, ScheduleItem[]> {
  const groups: Record<string, ScheduleItem[]> = {};
  for (const item of items) {
    const type = item.type ?? 'other';
    if (!groups[type]) groups[type] = [];
    groups[type].push(item);
  }
  return groups;
}

export function MobileSchedule({ schedule, date }: MobileScheduleProps) {
  if (!schedule || schedule.length === 0) {
    return (
      <div className="mob-empty">
        No minyans scheduled for this date
      </div>
    );
  }

  const groups = groupByType(schedule as ScheduleItem[]);
  const sortedTypes = TYPE_ORDER.filter((t) => groups[t]?.length);

  return (
    <div>
      {sortedTypes.map((type) => (
        <div key={type} className="mob-category">
          <div className="mob-sectionHeader">
            <span
              className="mob-typeDot"
              style={{ backgroundColor: TYPE_COLORS[type] ?? TYPE_COLORS.other }}
            />
            <span className="mob-sectionLabel">
              {TYPE_LABELS[type] ?? type}
            </span>
          </div>
          {groups[type].map((item, i) => (
            <div
              key={`${item.name}-${item.time}-${i}`}
              className={item.isNext ? "mob-schedRowHighlight" : "mob-schedRow"}
            >
              <span className="mob-schedTime" style={{ minWidth: 52, direction: 'ltr' }}>
                {item.time}
              </span>

              <div className="mob-schedName" style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </span>
                  {item.isNext && (
                    <span className="mob-nowBadge">NEXT</span>
                  )}
                </div>
                {item.room && (
                  <div className="mob-schedRoom">
                    {item.room}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

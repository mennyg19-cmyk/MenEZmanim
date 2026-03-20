'use client';

import React from 'react';


export interface MobileZmanimProps {
  zmanim: any[];
  date: Date;
  language?: 'hebrew' | 'english';
}

interface ZmanItem {
  label: string;
  hebrewLabel?: string;
  time: string | null;
  category?: string;
  isHighlighted?: boolean;
}

const CATEGORY_ORDER = ['morning', 'afternoon', 'evening', 'other'];

const CATEGORY_LABELS: Record<string, { en: string; he: string }> = {
  morning: { en: 'Morning', he: 'בוקר' },
  afternoon: { en: 'Afternoon', he: 'אחר הצהריים' },
  evening: { en: 'Evening', he: 'ערב' },
  other: { en: 'Other', he: 'אחר' },
};

function groupByCategory(zmanim: ZmanItem[]): Record<string, ZmanItem[]> {
  const groups: Record<string, ZmanItem[]> = {};
  for (const z of zmanim) {
    const cat = z.category ?? 'other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(z);
  }
  return groups;
}

export function MobileZmanim({
  zmanim,
  date,
  language = 'english',
}: MobileZmanimProps) {
  const isRtl = language === 'hebrew';

  if (!zmanim || zmanim.length === 0) {
    return (
      <div className="mob-empty">
        {isRtl ? 'אין זמנים להצגה' : 'No zmanim available for this date'}
      </div>
    );
  }

  const groups = groupByCategory(zmanim as ZmanItem[]);
  const sortedCategories = CATEGORY_ORDER.filter((c) => groups[c]?.length);

  const getLabel = (z: ZmanItem) =>
    isRtl && z.hebrewLabel ? z.hebrewLabel : z.label;

  const getCategoryLabel = (cat: string) => {
    const labels = CATEGORY_LABELS[cat] ?? CATEGORY_LABELS.other;
    return isRtl ? labels.he : labels.en;
  };

  return (
    <div style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      {sortedCategories.map((cat) => (
        <div key={cat} className="mob-category">
          <div className="mob-categoryLabel">
            {getCategoryLabel(cat)}
          </div>
          {groups[cat].map((z, i) => (
            <div
              key={`${z.label}-${i}`}
              className={z.isHighlighted ? "mob-rowHighlight" : "mob-row"}
            >
              <span
                className="mob-rowLabel"
                style={{ fontWeight: z.isHighlighted ? 600 : 400 }}
              >
                {getLabel(z)}
                {z.isHighlighted && (
                  <span className="mob-nowBadge">
                    {isRtl ? 'עכשיו' : 'NOW'}
                  </span>
                )}
              </span>
              <span className={z.time ? "mob-rowValue" : "mob-rowValuePlaceholder"} style={{ direction: 'ltr' }}>
                {z.time ?? '—'}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

'use client';

import React from 'react';
import type { DisplayNameOverrides } from '@zmanim-app/core';


export interface JewishInfoWidgetProps {
  date: {
    formattedHebrew: string;
    formattedEnglish: string;
    dayOfWeekHebrew: string;
  };
  parsha?: {
    parshaHebrew: string;
    parsha: string;
    upcoming?: string;
    upcomingHebrew?: string;
    specialShabbosHebrew?: string | null;
  };
  holiday?: {
    nameHebrew: string;
    name: string;
    isChanukah: boolean;
    chanukahDay: number;
  };
  omer?: {
    day: number;
    formattedHebrew: string;
  } | null;
  dafYomi?: {
    formattedHebrew: string;
    formatted: string;
  };
  tefilah?: {
    mashivHaruach: boolean;
    veseinTalUmatar: boolean;
    yaalehVeyavo: boolean;
    alHanissim: boolean;
    hallel: 'full' | 'half' | 'none';
  };
  language?: 'hebrew' | 'english';
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  showItems?: {
    date?: boolean;
    parsha?: boolean;
    holiday?: boolean;
    omer?: boolean;
    dafYomi?: boolean;
    tefilah?: boolean;
  };
  titleSettings?: Record<string, { mode?: 'default' | 'hidden' | 'custom' | 'inline'; customTitle?: string; separator?: string }>;
  displayNames?: DisplayNameOverrides;
}

const defaultFontSize = 22;
const defaultFontFamily = 'system-ui, -apple-system, sans-serif';

export const TEFILAH_LABELS_HEBREW: Record<string, string> = {
  mashivHaruach: 'משיב הרוח',
  veseinTalUmatar: 'ותן טל ומטר',
  yaalehVeyavo: 'יעלה ויבוא',
  alHanissim: 'על הנסים',
  hallelFull: 'הלל שלם',
  hallelHalf: 'חצי הלל',
};

export const TEFILAH_LABELS_ENGLISH: Record<string, string> = {
  mashivHaruach: 'Mashiv HaRuach',
  veseinTalUmatar: 'Vesein Tal Umatar',
  yaalehVeyavo: 'Yaaleh Veyavo',
  alHanissim: 'Al Hanissim',
  hallelFull: 'Full Hallel',
  hallelHalf: 'Half Hallel',
};

export function JewishInfoWidget({
  date,
  parsha,
  holiday,
  omer,
  dafYomi,
  tefilah,
  language = 'english',
  fontSize = defaultFontSize,
  fontFamily = defaultFontFamily,
  textColor = 'var(--wgt-text)',
  textAlign: textAlignProp,
  showItems = {},
  titleSettings = {},
  displayNames,
}: JewishInfoWidgetProps) {
  const isRtl = language === 'hebrew';
  const resolvedAlign = textAlignProp ?? (isRtl ? 'right' : 'left');
  const show = {
    date: showItems.date !== false,
    parsha: showItems.parsha !== false,
    holiday: showItems.holiday !== false,
    omer: showItems.omer !== false,
    dafYomi: showItems.dafYomi !== false,
    tefilah: showItems.tefilah !== false,
  };

  const baseStyle: React.CSSProperties = {
    fontSize,
    fontFamily,
    color: textColor,
    direction: isRtl ? 'rtl' : 'ltr',
    textAlign: resolvedAlign,
  };

  const sectionStyle: React.CSSProperties = {
    ...baseStyle,
    lineHeight: 1.4,
  };

  const titleStyle: React.CSSProperties = {
    ...baseStyle,
    fontSize: fontSize * 0.85,
  };

  const resolveTefilahLabel = (key: string): string => {
    const override = displayNames?.[key];
    if (language === 'hebrew') return override?.hebrew || TEFILAH_LABELS_HEBREW[key];
    return override?.english || TEFILAH_LABELS_ENGLISH[key];
  };

  const activeTefilahItems: string[] = [];
  if (tefilah?.mashivHaruach) activeTefilahItems.push(resolveTefilahLabel('mashivHaruach'));
  if (tefilah?.veseinTalUmatar) activeTefilahItems.push(resolveTefilahLabel('veseinTalUmatar'));
  if (tefilah?.yaalehVeyavo) activeTefilahItems.push(resolveTefilahLabel('yaalehVeyavo'));
  if (tefilah?.alHanissim) activeTefilahItems.push(resolveTefilahLabel('alHanissim'));
  if (tefilah?.hallel === 'full') activeTefilahItems.push(resolveTefilahLabel('hallelFull'));
  else if (tefilah?.hallel === 'half') activeTefilahItems.push(resolveTefilahLabel('hallelHalf'));

  const renderSection = (
    key: string,
    defaultTitle: string,
    value: React.ReactNode,
    extraStyle?: React.CSSProperties,
  ) => {
    const ts = titleSettings[key] ?? {};
    const mode = ts.mode ?? 'default';
    const sep = ts.separator ?? ':';
    const titleText = mode === 'custom' || mode === 'inline' ? (ts.customTitle ?? defaultTitle) : defaultTitle;

    if (mode === 'inline') {
      return (
        <div className="wgt-jiSection" style={{ ...sectionStyle, ...extraStyle }}>
          <div style={baseStyle}>
            <span style={{ opacity: 0.75 }}>{titleText}{sep} </span>{value}
          </div>
        </div>
      );
    }
    return (
      <div className="wgt-jiSection" style={{ ...sectionStyle, ...extraStyle }}>
        {mode !== 'hidden' && <div className="wgt-jiTitle" style={titleStyle}>{titleText}</div>}
        <div style={baseStyle}>{value}</div>
      </div>
    );
  };

  const parshaValue = language === 'hebrew'
    ? (parsha?.parshaHebrew || parsha?.upcomingHebrew || '')
    : (parsha?.parsha || parsha?.upcoming || '');
  const parshaExtra = parsha?.specialShabbosHebrew
    ? <span style={{ marginRight: isRtl ? 8 : 0, marginLeft: isRtl ? 0 : 8 }}>({parsha.specialShabbosHebrew})</span>
    : null;

  return (
    <div className="wgt-jiContainer" style={{ padding: 16, fontFamily, width: '100%', height: '100%' }}>
      {show.date && (
        <div className="wgt-jiSection" style={sectionStyle}>
          <div style={{ ...baseStyle, fontSize: fontSize * 1.15, fontWeight: 600 }}>
            {language === 'hebrew' ? date.formattedHebrew : date.formattedEnglish}
          </div>
          {(titleSettings.date?.mode ?? 'default') !== 'hidden' && date.dayOfWeekHebrew && (
            <div className="wgt-jiTitle" style={titleStyle}>{date.dayOfWeekHebrew}</div>
          )}
        </div>
      )}

      {show.parsha && parsha && renderSection(
        'parsha',
        language === 'hebrew' ? 'פרשת השבוע' : 'Parshas HaShavua',
        <>{parshaValue}{parshaExtra}</>,
      )}

      {show.holiday && holiday && (holiday.name || holiday.nameHebrew) && renderSection(
        'holiday',
        language === 'hebrew' ? 'יום טוב' : 'Yom Tov',
        <>
          {language === 'hebrew' ? holiday.nameHebrew : holiday.name}
          {holiday.isChanukah && holiday.chanukahDay > 0 && (
            <span style={{ marginRight: isRtl ? 8 : 0, marginLeft: isRtl ? 0 : 8 }}>
              — {language === 'hebrew' ? `ליל ${holiday.chanukahDay}` : `Night ${holiday.chanukahDay}`}
            </span>
          )}
        </>,
        { fontWeight: 600 },
      )}

      {show.omer && omer && renderSection(
        'omer',
        language === 'hebrew' ? 'ספירת העומר' : 'Sefiras HaOmer',
        language === 'hebrew' ? omer.formattedHebrew : `Day ${omer.day}`,
      )}

      {show.dafYomi && dafYomi && renderSection(
        'dafYomi',
        language === 'hebrew' ? 'דף יומי' : 'Daf Yomi',
        language === 'hebrew' ? dafYomi.formattedHebrew : dafYomi.formatted,
      )}

      {show.tefilah && activeTefilahItems.length > 0 && (
        <div className="wgt-jiSection" style={sectionStyle}>
          {(titleSettings.tefilah?.mode ?? 'default') !== 'hidden' && (
            <div className="wgt-jiTitle" style={titleStyle}>
              {titleSettings.tefilah?.mode === 'custom' ? titleSettings.tefilah.customTitle : (language === 'hebrew' ? 'שינויים בתפילה' : 'Tefillah Changes')}
            </div>
          )}
          <div
            style={{
              ...baseStyle,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              flexDirection: isRtl ? 'row-reverse' : 'row',
              justifyContent: resolvedAlign === 'center' ? 'center' : resolvedAlign === 'right' ? 'flex-end' : 'flex-start',
            }}
          >
            {activeTefilahItems.map((item) => (
              <span
                key={item}
                className="wgt-jiTefilahItem"
                style={{
                  ...baseStyle,
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

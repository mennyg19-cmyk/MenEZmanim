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
  fontBold?: boolean;
  fontItalic?: boolean;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  showItems?: {
    date?: boolean;
    parsha?: boolean;
    holiday?: boolean;
    omer?: boolean;
    dafYomi?: boolean;
    tefilah?: boolean;
    dayOfWeek?: boolean;
  };
  /** 'vertical' stacks sections, 'horizontal' puts them in a row */
  layout?: 'vertical' | 'horizontal';
  /** Separator string between items in horizontal layout */
  horizontalSeparator?: string;
  /** Custom display order of item keys */
  itemOrder?: string[];
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
  fontBold = false,
  fontItalic = false,
  textColor = 'var(--wgt-text)',
  textAlign: textAlignProp,
  showItems = {},
  layout = 'vertical',
  horizontalSeparator = '|',
  itemOrder,
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
    dayOfWeek: showItems.dayOfWeek === true,
  };

  const baseStyle: React.CSSProperties = {
    fontSize,
    fontFamily,
    fontWeight: fontBold ? 'bold' : 'normal',
    fontStyle: fontItalic ? 'italic' : 'normal',
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
    lineHeight: 1.4,
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
            <span>{titleText}{sep} </span>{value}
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

  const DEFAULT_ORDER = ['dayOfWeek', 'date', 'parsha', 'holiday', 'omer', 'dafYomi', 'tefilah'];
  const order = itemOrder && itemOrder.length > 0 ? itemOrder : DEFAULT_ORDER;

  const sectionMap: Record<string, React.ReactNode> = {};

  if (show.dayOfWeek && date.dayOfWeekHebrew) {
    sectionMap.dayOfWeek = (
      <div key="dayOfWeek" className="wgt-jiSection" style={sectionStyle}>
        <div style={baseStyle}>{date.dayOfWeekHebrew}</div>
      </div>
    );
  }

  if (show.date) {
    sectionMap.date = (
      <div key="date" className="wgt-jiSection" style={sectionStyle}>
        <div style={baseStyle}>
          {language === 'hebrew' ? date.formattedHebrew : date.formattedEnglish}
        </div>
      </div>
    );
  }

  if (show.parsha && parsha) {
    sectionMap.parsha = (
      <React.Fragment key="parsha">
        {renderSection(
          'parsha',
          language === 'hebrew' ? 'פרשת השבוע' : 'Parshas HaShavua',
          <>{parshaValue}{parshaExtra}</>,
        )}
      </React.Fragment>
    );
  }

  if (show.holiday && holiday && (holiday.name || holiday.nameHebrew)) {
    sectionMap.holiday = (
      <React.Fragment key="holiday">
        {renderSection(
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
        )}
      </React.Fragment>
    );
  }

  if (show.omer && omer) {
    sectionMap.omer = (
      <React.Fragment key="omer">
        {renderSection(
          'omer',
          language === 'hebrew' ? 'ספירת העומר' : 'Sefiras HaOmer',
          language === 'hebrew' ? omer.formattedHebrew : `Day ${omer.day}`,
        )}
      </React.Fragment>
    );
  }

  if (show.dafYomi && dafYomi) {
    sectionMap.dafYomi = (
      <React.Fragment key="dafYomi">
        {renderSection(
          'dafYomi',
          language === 'hebrew' ? 'דף יומי' : 'Daf Yomi',
          language === 'hebrew' ? dafYomi.formattedHebrew : dafYomi.formatted,
        )}
      </React.Fragment>
    );
  }

  if (show.tefilah && activeTefilahItems.length > 0) {
    sectionMap.tefilah = (
      <div key="tefilah" className="wgt-jiSection" style={sectionStyle}>
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
            <span key={item} className="wgt-jiTefilahItem" style={baseStyle}>
              {item}
            </span>
          ))}
        </div>
      </div>
    );
  }

  const sections = order.map((key) => sectionMap[key]).filter(Boolean);

  if (layout === 'horizontal' && sections.length > 0) {
    return (
      <div
        className="wgt-jiContainer"
        style={{
          padding: 16, fontFamily, width: '100%',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center',
          gap: 0,
          flexDirection: isRtl ? 'row-reverse' : 'row',
          justifyContent: resolvedAlign === 'center' ? 'center' : resolvedAlign === 'right' ? 'flex-end' : 'flex-start',
        }}
      >
        {sections.map((section, i) => (
          <React.Fragment key={i}>
            {i > 0 && horizontalSeparator && (
              <span style={{ ...baseStyle, margin: '0 8px', opacity: 0.5 }}>{horizontalSeparator}</span>
            )}
            {section}
          </React.Fragment>
        ))}
      </div>
    );
  }

  return (
    <div className="wgt-jiContainer" style={{ padding: 16, fontFamily, width: '100%' }}>
      {sections}
    </div>
  );
}

'use client';

import React from 'react';
import type { DisplayObject, DisplayObjectType, DisplayNameOverrides } from '@zmanim-app/core';
import type { CalendarInfo, AnnouncementData, MemorialData, MinyanData, MediaData, ZmanResult } from '../shared/types';
import { formatZmanTime, formatEventTime } from '../shared/timeUtils';
import { resolveObjBackground, type CanvasBgExtras } from '../shared/backgroundUtils';
import { FrameRenderer } from './FrameRenderer';
import { ScrollWrapper, type ScrollConfig } from './ScrollWrapper';
import { ZmanimTable } from './widgets/ZmanimTable';
import { JewishInfoWidget } from './widgets/JewishInfoWidget';
import { DigitalClock } from './widgets/DigitalClock';
import { AnalogClock } from './widgets/AnalogClock';
import { PlainText } from './widgets/PlainText';
import { RichText } from './widgets/RichText';
import { MediaViewer } from './widgets/MediaViewer';
import { EventsTable } from './widgets/EventsTable';
import { YahrzeitDisplay } from './widgets/YahrzeitDisplay';
import { ScrollingTicker } from './widgets/ScrollingTicker';
import { SefiraCounter } from './widgets/SefiraCounter';
import { CountdownTimer } from './widgets/CountdownTimer';

export type { CalendarInfo, AnnouncementData, MemorialData, MinyanData, MediaData, ZmanResult };

export interface BoardRendererProps {
  objects: DisplayObject[];
  canvasWidth: number;
  canvasHeight: number;
  canvasBgColor?: string;
  canvasBgImage?: string;
  /** For object "Canvas BG" mode when the canvas uses gradient/texture */
  canvasBgExtras?: CanvasBgExtras;
  zmanim?: ZmanResult[];
  calendarInfo?: CalendarInfo;
  announcements?: AnnouncementData[];
  memorials?: MemorialData[];
  minyans?: MinyanData[];
  media?: MediaData[];
  displayNames?: DisplayNameOverrides;
  scale?: number;
}

export function renderWidget(
  obj: DisplayObject,
  zmanim: ZmanResult[] | undefined,
  calendarInfo: CalendarInfo | undefined,
  announcements: AnnouncementData[] | undefined,
  memorials: MemorialData[] | undefined,
  minyans: MinyanData[] | undefined,
  media: MediaData[] | undefined,
  displayNames?: DisplayNameOverrides,
): React.ReactNode {
  const lang = (obj.language || 'english') as 'hebrew' | 'english';
  const content = obj.content || {};
  const font = obj.font;

  switch (obj.type as string) {
    case 'ZMANIM_TABLE': {
      const zmanimSelection = content.zmanim as Record<string, boolean> | undefined;
      const filteredZmanim = (zmanim || []).filter((z) => {
        if (zmanimSelection && z.type in zmanimSelection) return zmanimSelection[z.type];
        const isVariant = z.type.includes('TUKACHINSKY') || z.type.includes('_MGA');
        if (isVariant) return false;
        return true;
      });
      filteredZmanim.sort((a, b) => {
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.getTime() - b.time.getTime();
      });
      const zmanimRows = filteredZmanim.map((z) => {
        const baseKey = z.type.replace(/_TUKACHINSKY$/, '');
        const override = displayNames?.[z.type] || displayNames?.[baseKey];
        return {
          label: override?.english || z.label,
          hebrewLabel: override?.hebrew || z.hebrewLabel,
          time: formatZmanTime(z.time, content.use24h, content.hideAmPm),
          isHighlighted: content.highlightedTypes?.includes(z.type) ?? false,
        };
      });
      return (
        <ZmanimTable
          zmanim={zmanimRows}
          title={content.title}
          titleHebrew={content.titleHebrew}
          language={lang}
          fontSize={font?.size}
          fontFamily={font?.family}
          headerColor={content.headerColor}
          textColor={font?.color}
          highlightColor={content.highlightColor}
          rowAltBg={content.rowAltBg}
          rowPaddingPx={content.rowPaddingPx}
          showBorder={content.showBorder}
          compact={content.compact}
          columns={content.columns}
          columnSplit={content.columnSplit}
          columnGap={content.columnGap}
          displayMode={content.displayMode}
          rowColor1={content.rowColor1}
          rowColor2={content.rowColor2}
          borderColor={content.borderColor}
          borderWidth={content.borderWidth}
          borderRadius={content.borderRadius}
          columnSeparator={content.columnSeparator}
          columnSeparatorColor={content.columnSeparatorColor}
          columnSeparatorWidth={content.columnSeparatorWidth}
        />
      );
    }

    case 'JEWISH_INFO': {
      return (
        <JewishInfoWidget
          date={calendarInfo?.date ?? { formattedHebrew: '', formattedEnglish: '', dayOfWeekHebrew: '' }}
          parsha={calendarInfo?.parsha}
          holiday={calendarInfo?.holiday}
          omer={calendarInfo?.omer}
          dafYomi={calendarInfo?.dafYomi}
          tefilah={calendarInfo?.tefilah}
          language={lang}
          fontSize={font?.size}
          fontFamily={font?.family}
          fontBold={font?.bold}
          fontItalic={font?.italic}
          textColor={font?.color}
          textAlign={content.textAlign}
          showItems={content.showItems}
          layout={content.layout}
          horizontalSeparator={content.horizontalSeparator}
          itemOrder={content.itemOrder}
          titleSettings={content.titleSettings}
          displayNames={displayNames}
        />
      );
    }

    case 'DIGITAL_CLOCK': {
      return (
        <DigitalClock
          format24h={content.format24h ?? false}
          showSeconds={content.showSeconds ?? true}
          showAmPm={content.showAmPm ?? true}
          fontSize={font?.size ?? 48}
          fontFamily={font?.family}
          color={font?.color}
          textAlign={content.textAlign ?? 'center'}
        />
      );
    }

    case 'ANALOG_CLOCK': {
      const size = Math.min(obj.position.width, obj.position.height);
      return (
        <AnalogClock
          size={size}
          showNumbers={content.showNumbers ?? true}
          showSeconds={content.showSeconds ?? true}
          faceColor={content.faceColor ?? obj.backgroundColor ?? '#fff'}
          handColor={content.handColor ?? font?.color ?? '#333'}
          numberColor={content.numberColor ?? font?.color ?? '#333'}
        />
      );
    }

    case 'PLAIN_TEXT': {
      return (
        <PlainText
          text={content.text ?? ''}
          fontSize={font?.size ?? 24}
          fontFamily={font?.family ?? 'system-ui, sans-serif'}
          color={font?.color ?? '#333'}
          textAlign={content.textAlign ?? 'left'}
          direction={obj.language === 'hebrew' || obj.language === 'yiddish' ? 'rtl' : 'ltr'}
          verticalAlign={content.verticalAlign ?? 'top'}
        />
      );
    }

    case 'RICH_TEXT': {
      return (
        <RichText
          content={content as any}
          fontSize={font?.size ?? 24}
          fontFamily={font?.family ?? 'system-ui, sans-serif'}
          color={font?.color ?? '#333'}
          direction={obj.language === 'hebrew' || obj.language === 'yiddish' ? 'rtl' : 'ltr'}
        />
      );
    }

    case 'MEDIA_VIEWER': {
      const sources = (media || []).map((m) => m.url);
      return (
        <MediaViewer
          sources={sources}
          rotationInterval={content.rotationInterval ?? 10}
          fit={content.fit ?? 'contain'}
          showTransition={content.showTransition ?? true}
        />
      );
    }

    case 'EVENTS_TABLE': {
      const selectedGroupIds = content.groupIds as string[] | undefined;
      const filteredMinyans = selectedGroupIds && selectedGroupIds.length > 0
        ? (minyans || []).filter((m) => selectedGroupIds.includes(m.groupId ?? ''))
        : (minyans || []);
      const events = filteredMinyans.map((m) => ({
        name: m.name,
        hebrewName: m.hebrewName,
        time: formatEventTime(m.time, content.use24h, content.hideAmPm),
        room: m.room,
        isNext: false,
        isPlaceholder: m.isPlaceholder,
        placeholderLabel: m.placeholderLabel,
        durationMinutes: m.durationMinutes,
      }));
      return (
        <EventsTable
          events={events}
          title={content.title}
          language={lang}
          fontSize={font?.size}
          fontFamily={font?.family}
          fontBold={font?.bold}
          fontItalic={font?.italic}
          textColor={font?.color}
          highlightColor={content.highlightColor}
          rowAltBg={content.rowAltBg}
          rowPaddingPx={content.rowPaddingPx}
          showRoom={content.showRoom ?? false}
          emphasis={content.emphasis}
          showHeader={content.showHeader}
          columns={content.columns}
          columnSplit={content.columnSplit}
          columnGap={content.columnGap}
          displayMode={content.displayMode}
          rowColor1={content.rowColor1}
          rowColor2={content.rowColor2}
          showBorder={content.showBorder}
          borderColor={content.borderColor}
          borderWidth={content.borderWidth}
          borderRadius={content.borderRadius}
          columnSeparator={content.columnSeparator}
          columnSeparatorColor={content.columnSeparatorColor}
          columnSeparatorWidth={content.columnSeparatorWidth}
          headerBg={content.headerBg}
          headerFontSize={content.headerFontSize}
          headerColor={content.headerColor}
          headerBorderBottom={content.headerBorderBottom}
        />
      );
    }

    case 'YAHRZEIT_DISPLAY': {
      const entries = (memorials || []).map((m) => ({
        name: m.englishName ?? m.hebrewName,
        hebrewName: m.hebrewName,
        relationship: m.relationship,
        hebrewDate: m.hebrewDate,
      }));
      return (
        <YahrzeitDisplay
          entries={entries}
          title={content.title}
          titleHebrew={content.titleHebrew}
          language={lang}
          fontSize={font?.size}
          textColor={font?.color}
          showBorder={content.showBorder}
          scrollSpeed={content.scrollSpeed}
        />
      );
    }

    case 'SCROLLING_TICKER': {
      const items = (announcements || [])
        .sort((a, b) => b.priority - a.priority)
        .map((a) => a.title);
      return (
        <ScrollingTicker
          items={items}
          speed={content.speed ?? 60}
          fontSize={font?.size ?? 24}
          fontFamily={font?.family ?? 'system-ui, sans-serif'}
          color={font?.color ?? '#fff'}
          direction={obj.language === 'hebrew' || obj.language === 'yiddish' ? 'rtl' : 'ltr'}
          separator={content.separator ?? '•'}
        />
      );
    }

    case 'SEFIRA_COUNTER': {
      const omer = calendarInfo?.omer;
      return (
        <SefiraCounter
          day={omer?.day ?? null}
          formattedHebrew={omer?.formattedHebrew ?? ''}
          fontSize={font?.size ?? 36}
          textColor={font?.color ?? '#333'}
          showEnglish={content.showEnglish ?? true}
        />
      );
    }

    case 'COUNTDOWN_TIMER': {
      let targetTime: Date | null = null;
      if (content.targetZmanType && zmanim) {
        const match = zmanim.find((z) => z.type === content.targetZmanType);
        if (match?.time) targetTime = match.time;
      } else if (content.targetTime) {
        targetTime = new Date(content.targetTime);
      }
      return (
        <CountdownTimer
          targetTime={targetTime}
          label={content.label ?? ''}
          labelHebrew={content.labelHebrew ?? ''}
          fontSize={font?.size ?? 48}
          textColor={font?.color ?? '#333'}
          completedText={content.completedText ?? ''}
          language={lang}
        />
      );
    }

    case 'FIDS_BOARD': {
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: obj.backgroundColor || '#1a1a1a',
            color: font?.color || '#666',
            fontSize: font?.size ?? 18,
            fontFamily: font?.family ?? 'system-ui, sans-serif',
          }}
        >
          FIDS Board (Coming Soon)
        </div>
      );
    }

    default:
      return null;
  }
}

export function BoardRenderer({
  objects,
  canvasWidth,
  canvasHeight,
  canvasBgColor = '#000',
  canvasBgImage,
  canvasBgExtras,
  zmanim,
  calendarInfo,
  announcements,
  memorials,
  minyans,
  media,
  displayNames,
  scale = 1,
}: BoardRendererProps) {
  const visibleSorted = objects
    .filter((obj) => obj.visible)
    .sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      style={{
        width: canvasWidth,
        height: canvasHeight,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {visibleSorted.map((obj) => {
        const bgStyles = resolveObjBackground(obj, canvasBgColor, canvasWidth, canvasHeight, canvasBgImage, canvasBgExtras);
        return (
          <div
            key={obj.id}
            style={{
              position: 'absolute',
              left: obj.position.x,
              top: obj.position.y,
              width: obj.position.width,
              height: obj.position.height,
              zIndex: obj.zIndex,
              ...bgStyles,
              overflow: 'hidden',
            }}
          >
            <FrameRenderer frameId={obj.content?.frameId as string | undefined} thickness={typeof obj.content?.frameThickness === 'number' ? obj.content.frameThickness : 1}>
              <ScrollWrapper config={obj.content?.scroll as ScrollConfig | undefined}>
                <div style={{
                  width: '100%',
                  ...(obj.content?.scroll?.enabled ? {} : { height: '100%' }),
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent:
                    (obj.content?.verticalAlign ?? 'top') === 'middle'
                      ? 'center'
                      : (obj.content?.verticalAlign ?? 'top') === 'bottom'
                        ? 'flex-end'
                        : 'flex-start',
                }}>
                  {renderWidget(obj, zmanim, calendarInfo, announcements, memorials, minyans, media, displayNames)}
                </div>
              </ScrollWrapper>
            </FrameRenderer>
          </div>
        );
      })}
    </div>
  );
}

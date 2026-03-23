'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { DisplayStyle, DisplayObject, DisplayBreakpoint } from '@zmanim-app/core';
import { getActiveStyle, getVisibleObjects } from '@zmanim-app/core';
import { buildScheduleContext } from '@zmanim-app/core';
import { useDisplayBreakpoint } from '../shared/useDisplayBreakpoint';
import { BoardRenderer } from './BoardRenderer';
import { FrameRenderer } from './FrameRenderer';
import { resolveCanvasBackground } from '../shared/backgroundUtils';
import type { DisplayNameOverrides } from '@zmanim-app/core';
import type { CalendarInfo, AnnouncementData, MemorialData, MinyanData, MediaData, ZmanResult } from '../shared/types';
import { formatTime12h } from '../shared/timeUtils';

function computeMinyanTime(schedule: any, zmanim: ZmanResult[]): string {
  if (schedule.isPlaceholder) return '';
  if (typeof schedule.time === 'string' && schedule.time) return schedule.time;

  const mode: 'fixed' | 'dynamic' =
    schedule.timeMode ?? (schedule.baseZman ? 'dynamic' : 'fixed');
  if (mode === 'fixed' && typeof schedule.fixedTime === 'string' && schedule.fixedTime) {
    const [hStr, mStr] = schedule.fixedTime.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(h) || isNaN(m)) return schedule.fixedTime;
    const base = new Date();
    base.setHours(h, m, 0, 0);
    return formatTime12h(base);
  }

  if (mode === 'dynamic' && schedule.baseZman) {
    const targetKey = String(schedule.baseZman).toLowerCase().replace(/[^a-z]/g, '');
    const z = zmanim.find((z) => {
      const normType = (z.type || '').toLowerCase().replace(/[^a-z]/g, '');
      const normLabel = (z.label || '').toLowerCase().replace(/[^a-z]/g, '');
      const normHeb = (z.hebrewLabel || '').toLowerCase().replace(/[^a-z]/g, '');
      return (
        normType.includes(targetKey) ||
        normLabel.includes(targetKey) ||
        normHeb.includes(targetKey)
      );
    });
    if (!z?.time) return '';
    let t = new Date(z.time);
    const offsetMin = schedule.offset ?? 0;
    t = new Date(t.getTime() + offsetMin * 60_000);

    const roundTo = schedule.roundTo ?? 1;
    const mode: 'nearest' | 'before' | 'after' = schedule.roundMode ?? 'nearest';
    if (roundTo > 1) {
      const mins = t.getHours() * 60 + t.getMinutes();
      const q = mins / roundTo;
      let rounded: number;
      if (mode === 'before') rounded = Math.floor(q) * roundTo;
      else if (mode === 'after') rounded = Math.ceil(q) * roundTo;
      else rounded = Math.round(q) * roundTo;
      const rh = Math.floor(rounded / 60);
      const rm = rounded % 60;
      t.setHours(rh, rm, 0, 0);
    }

    if (schedule.limitBefore) {
      const [hStr, mStr] = schedule.limitBefore.split(':');
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      if (!isNaN(h) && !isNaN(m)) {
        const minDate = new Date(t);
        minDate.setHours(h, m, 0, 0);
        if (t < minDate) t = minDate;
      }
    }
    if (schedule.limitAfter) {
      const [hStr, mStr] = schedule.limitAfter.split(':');
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      if (!isNaN(h) && !isNaN(m)) {
        const maxDate = new Date(t);
        maxDate.setHours(h, m, 0, 0);
        if (t > maxDate) t = maxDate;
      }
    }

    return formatTime12h(t);
  }

  return '';
}

function mapSchedulesToMinyanData(schedules: any[], zmanim: ZmanResult[]): MinyanData[] {
  return (schedules || []).map((s) => ({
    id: s.id,
    name: s.name,
    hebrewName: s.hebrewName ?? s.name,
    time: computeMinyanTime(s, zmanim),
    room: s.room,
    type: s.type,
    groupId: s.groupId,
    isPlaceholder: s.isPlaceholder,
    placeholderLabel: s.placeholderLabel,
    durationMinutes: s.durationMinutes,
  }));
}

export interface DisplayAppProps {
  orgId: string;
  screenId: string;
  getStyles: () => Promise<DisplayStyle[]>;
  /** When provided, use this instead of getStyles + getActiveStyle for screen-specific style resolution */
  getResolvedStyle?: (breakpoint: DisplayBreakpoint) => Promise<DisplayStyle | null>;
  getZmanim: (date: Date) => Promise<ZmanResult[]>;
  getCalendarInfo: (date: Date) => Promise<CalendarInfo>;
  getAnnouncements: () => Promise<AnnouncementData[]>;
  getMemorials: (date: Date) => Promise<MemorialData[]>;
  getMinyanSchedule: (date: Date) => Promise<MinyanData[]>;
  getMedia: () => Promise<MediaData[]>;
  getDisplayNames?: () => Promise<DisplayNameOverrides>;
  onError?: (error: Error) => void;
}

interface DisplayState {
  styles: DisplayStyle[];
  activeStyle: DisplayStyle | null;
  visibleObjects: DisplayObject[];
  zmanim: ZmanResult[];
  calendarInfo: CalendarInfo | null;
  announcements: AnnouncementData[];
  memorials: MemorialData[];
  minyans: MinyanData[];
  media: MediaData[];
  displayNames: DisplayNameOverrides;
  loading: boolean;
  error: string | null;
}

const ZMANIM_REFRESH_MS = 60_000;
const SECONDARY_REFRESH_MS = 5 * 60_000;
const STYLE_REFRESH_MS = 10_000;

function getMidnightMs(): number {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

function useScreenScale(
  canvasWidth: number,
  canvasHeight: number,
): { scale: number; offsetX: number; offsetY: number } {
  const [dims, setDims] = useState({ w: typeof window !== 'undefined' ? window.innerWidth : 1920, h: typeof window !== 'undefined' ? window.innerHeight : 1080 });

  useEffect(() => {
    const onResize = () => setDims({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (canvasWidth <= 0 || canvasHeight <= 0) {
    return { scale: 1, offsetX: 0, offsetY: 0 };
  }

  const scaleX = dims.w / canvasWidth;
  const scaleY = dims.h / canvasHeight;
  const scale = Math.min(scaleX, scaleY);
  const offsetX = (dims.w - canvasWidth * scale) / 2;
  const offsetY = (dims.h - canvasHeight * scale) / 2;

  return { scale, offsetX, offsetY };
}

export function DisplayApp({
  orgId,
  screenId,
  getStyles,
  getResolvedStyle,
  getZmanim,
  getCalendarInfo,
  getAnnouncements,
  getMemorials,
  getMinyanSchedule,
  getMedia,
  getDisplayNames,
  onError,
}: DisplayAppProps) {
  const displayBreakpoint = useDisplayBreakpoint();
  const breakpointRef = useRef<DisplayBreakpoint>(displayBreakpoint);
  breakpointRef.current = displayBreakpoint;

  const [state, setState] = useState<DisplayState>({
    styles: [],
    activeStyle: null,
    visibleObjects: [],
    zmanim: [],
    calendarInfo: null,
    announcements: [],
    memorials: [],
    minyans: [],
    media: [],
    displayNames: {},
    loading: true,
    error: null,
  });

  const midnightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zmanimIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const styleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondaryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const handleError = useCallback(
    (err: unknown) => {
      const error = err instanceof Error ? err : new Error(String(err));
      if (onError) onError(error);
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, error: error.message }));
      }
    },
    [onError],
  );

  const resolveVisibleObjects = useCallback(
    (style: DisplayStyle, zmanim: ZmanResult[]): DisplayObject[] => {
      const now = new Date();
      const zmanimMap = new Map<string, Date | null>();
      for (const z of zmanim) {
        zmanimMap.set(z.type, z.time);
      }
      const ctx = buildScheduleContext(now, Intl.DateTimeFormat().resolvedOptions().timeZone, zmanimMap, new Set());
      return getVisibleObjects(style, ctx);
    },
    [],
  );

  const refreshZmanimAndCalendar = useCallback(async () => {
    try {
      const now = new Date();
      const [zmanim, calendarInfo] = await Promise.all([
        getZmanim(now),
        getCalendarInfo(now),
      ]);
      if (!mountedRef.current) return;

      setState((prev) => {
        const visibleObjects = prev.activeStyle
          ? resolveVisibleObjects(prev.activeStyle, zmanim)
          : prev.visibleObjects;
        return { ...prev, zmanim, calendarInfo, visibleObjects };
      });
    } catch (err) {
      handleError(err);
    }
  }, [getZmanim, getCalendarInfo, handleError, resolveVisibleObjects]);

  const refreshSecondary = useCallback(async () => {
    try {
      const now = new Date();
      const promises: [Promise<AnnouncementData[]>, Promise<MemorialData[]>, Promise<MinyanData[]>, Promise<MediaData[]>, Promise<DisplayNameOverrides>] = [
        getAnnouncements(),
        getMemorials(now),
        getMinyanSchedule(now),
        getMedia(),
        getDisplayNames ? getDisplayNames() : Promise.resolve({}),
      ];
      const [announcements, memorials, rawSchedules, media, displayNames] = await Promise.all(promises);
      if (!mountedRef.current) return;
      setState((prev) => ({
        ...prev,
        announcements,
        memorials,
        minyans: mapSchedulesToMinyanData(rawSchedules, prev.zmanim),
        media,
        displayNames,
      }));
    } catch (err) {
      handleError(err);
    }
  }, [getAnnouncements, getMemorials, getMinyanSchedule, getMedia, getDisplayNames, handleError]);

  const refreshStyle = useCallback(async () => {
    try {
      let activeStyle: DisplayStyle | null = null;
      if (getResolvedStyle) {
        activeStyle = await getResolvedStyle(breakpointRef.current);
      } else {
        const styles = await getStyles();
        activeStyle = getActiveStyle(styles, new Date(), false);
      }
      if (!mountedRef.current || !activeStyle) return;

      setState((prev) => {
        if (JSON.stringify(prev.activeStyle) === JSON.stringify(activeStyle)) return prev;
        const visibleObjects = resolveVisibleObjects(activeStyle!, prev.zmanim);
        return {
          ...prev,
          activeStyle,
          visibleObjects,
          styles: activeStyle ? [activeStyle] : prev.styles,
        };
      });
    } catch {
      // Silently ignore style refresh failures to avoid flashing errors
    }
  }, [getResolvedStyle, getStyles, resolveVisibleObjects]);

  const fullRefresh = useCallback(async () => {
    try {
      const now = new Date();
      let activeStyle: DisplayStyle | null = null;

      const displayNamesPromise = getDisplayNames ? getDisplayNames() : Promise.resolve({});

      if (getResolvedStyle) {
        const [resolved, zmanim, calendarInfo, announcements, memorials, rawSchedules, media, displayNames] =
          await Promise.all([
            getResolvedStyle(breakpointRef.current),
            getZmanim(now),
            getCalendarInfo(now),
            getAnnouncements(),
            getMemorials(now),
            getMinyanSchedule(now),
            getMedia(),
            displayNamesPromise,
          ]);
        activeStyle = resolved ?? null;

        if (!mountedRef.current) return;

        const styles = activeStyle ? [activeStyle] : [];
        const visibleObjects = activeStyle
          ? resolveVisibleObjects(activeStyle, zmanim)
          : [];
        const minyans = mapSchedulesToMinyanData(rawSchedules, zmanim);

        setState({
          styles,
          activeStyle,
          visibleObjects,
          zmanim,
          calendarInfo,
          announcements,
          memorials,
          minyans,
          media,
          displayNames,
          loading: false,
          error: null,
        });
      } else {
        const [styles, zmanim, calendarInfo, announcements, memorials, rawSchedules, media, displayNames] =
          await Promise.all([
            getStyles(),
            getZmanim(now),
            getCalendarInfo(now),
            getAnnouncements(),
            getMemorials(now),
            getMinyanSchedule(now),
            getMedia(),
            displayNamesPromise,
          ]);

        if (!mountedRef.current) return;

        activeStyle = getActiveStyle(styles, now, false);
        const visibleObjects = activeStyle
          ? resolveVisibleObjects(activeStyle, zmanim)
          : [];
        const minyans = mapSchedulesToMinyanData(rawSchedules, zmanim);

        setState({
          styles,
          activeStyle,
          visibleObjects,
          zmanim,
          calendarInfo,
          announcements,
          memorials,
          minyans,
          media,
          displayNames,
          loading: false,
          error: null,
        });
      }
    } catch (err) {
      handleError(err);
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, loading: false }));
      }
    }
  }, [
    getStyles,
    getResolvedStyle,
    getZmanim,
    getCalendarInfo,
    getAnnouncements,
    getMemorials,
    getMinyanSchedule,
    getMedia,
    getDisplayNames,
    handleError,
    resolveVisibleObjects,
  ]);

  const scheduleMidnightRefresh = useCallback(() => {
    if (midnightTimerRef.current) clearTimeout(midnightTimerRef.current);
    const ms = getMidnightMs() + 2000;
    midnightTimerRef.current = setTimeout(() => {
      fullRefresh();
      scheduleMidnightRefresh();
    }, ms);
  }, [fullRefresh]);

  useEffect(() => {
    mountedRef.current = true;
    fullRefresh();

    zmanimIntervalRef.current = setInterval(refreshZmanimAndCalendar, ZMANIM_REFRESH_MS);
    secondaryIntervalRef.current = setInterval(refreshSecondary, SECONDARY_REFRESH_MS);
    styleIntervalRef.current = setInterval(refreshStyle, STYLE_REFRESH_MS);
    scheduleMidnightRefresh();

    return () => {
      mountedRef.current = false;
      if (zmanimIntervalRef.current) clearInterval(zmanimIntervalRef.current);
      if (secondaryIntervalRef.current) clearInterval(secondaryIntervalRef.current);
      if (styleIntervalRef.current) clearInterval(styleIntervalRef.current);
      if (midnightTimerRef.current) clearTimeout(midnightTimerRef.current);
    };
  }, [fullRefresh, refreshZmanimAndCalendar, refreshSecondary, refreshStyle, scheduleMidnightRefresh]);

  useEffect(() => {
    if (getResolvedStyle) {
      refreshStyle();
    }
  }, [displayBreakpoint, getResolvedStyle, refreshStyle]);

  const canvasW = state.activeStyle?.canvasWidth ?? 1920;
  const canvasH = state.activeStyle?.canvasHeight ?? 1080;
  const { scale, offsetX, offsetY } = useScreenScale(canvasW, canvasH);

  if (state.loading) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 24,
        }}
      >
        Loading display...
      </div>
    );
  }

  if (state.error && !state.activeStyle) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: '#1a0000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ff6666',
          fontFamily: 'system-ui, sans-serif',
          padding: 48,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>Display Error</div>
        <div style={{ fontSize: 18, opacity: 0.8, maxWidth: 600 }}>{state.error}</div>
      </div>
    );
  }

  if (!state.activeStyle) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 24,
        }}
      >
        No active display style configured
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#000',
        position: 'relative',
      }}
    >
      {/* Scaled canvas (background + content together so they scale identically) */}
      <FrameRenderer frameId={state.activeStyle?.backgroundFrameId} thickness={state.activeStyle?.backgroundFrameThickness ?? 1}>
      <div
        style={{
          position: 'absolute',
          left: offsetX,
          top: offsetY,
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
          width: canvasW,
          height: canvasH,
          ...(state.activeStyle ? resolveCanvasBackground(state.activeStyle, canvasW, canvasH) : { backgroundColor: '#000' }),
        }}
      >
        <BoardRenderer
          objects={state.visibleObjects}
          canvasWidth={canvasW}
          canvasHeight={canvasH}
          canvasBgColor={state.activeStyle?.backgroundColor ?? '#000'}
          canvasBgImage={state.activeStyle?.backgroundImage}
          canvasBgExtras={
            state.activeStyle
              ? {
                  backgroundMode: state.activeStyle.backgroundMode,
                  backgroundGradient: state.activeStyle.backgroundGradient,
                  backgroundTexture: state.activeStyle.backgroundTexture,
                  backgroundImage: state.activeStyle.backgroundImage,
                }
              : undefined
          }
          zmanim={state.zmanim}
          calendarInfo={state.calendarInfo ?? undefined}
          announcements={state.announcements}
          memorials={state.memorials}
          minyans={state.minyans}
          media={state.media}
          displayNames={state.displayNames}
        />
      </div>
      </FrameRenderer>

      {/* Breakpoint debug overlay – shows current breakpoint and viewport size */}
      <div
        style={{
          position: 'absolute',
          top: 4,
          left: 4,
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: '#0f0',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 11,
          fontFamily: 'monospace',
          zIndex: 99999,
          pointerEvents: 'none',
        }}
      >
        bp:{displayBreakpoint} | {typeof window !== 'undefined' ? `${window.innerWidth}×${window.innerHeight}` : '?'}
        {state.activeStyle ? ` | style:${state.activeStyle.name}` : ''}
      </div>

      {/* Error toast overlay */}
      {state.error && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            backgroundColor: 'rgba(180, 0, 0, 0.85)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: 6,
            fontSize: 14,
            fontFamily: 'system-ui, sans-serif',
            maxWidth: 400,
            zIndex: 9999,
          }}
        >
          {state.error}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { DisplayStyle, DisplayObject, DisplayBreakpoint } from '@zmanim-app/core';
import { getActiveStyle, getVisibleObjects } from '@zmanim-app/core';
import { buildScheduleContext } from '@zmanim-app/core';
import { useDisplayBreakpoint } from '../shared/useDisplayBreakpoint';
import { BoardRenderer } from './BoardRenderer';
import { FrameRenderer } from './FrameRenderer';
import { resolveCanvasBackground } from '../shared/backgroundUtils';
import type { DisplayNameOverrides } from '@zmanim-app/core';
import type { CalendarInfo, AnnouncementData, MemorialData, MinyanData, MediaData, ZmanResult } from '../shared/types';
import { formatTime12h, addDays } from '../shared/timeUtils';

function computeMinyanTime(schedule: any, zmanim: ZmanResult[], refDay: Date): string {
  if (schedule.isPlaceholder) return '';
  if (typeof schedule.time === 'string' && schedule.time) return schedule.time;

  // Server-resolved time for weekly/monthly refresh modes
  if (schedule.resolvedFixedTime) {
    const [hStr, mStr] = schedule.resolvedFixedTime.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (!isNaN(h) && !isNaN(m)) {
      const base = new Date(refDay);
      base.setHours(h, m, 0, 0);
      return formatTime12h(base);
    }
  }

  const mode: 'fixed' | 'dynamic' =
    schedule.timeMode ?? (schedule.baseZman ? 'dynamic' : 'fixed');
  if (mode === 'fixed' && typeof schedule.fixedTime === 'string' && schedule.fixedTime) {
    const [hStr, mStr] = schedule.fixedTime.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(h) || isNaN(m)) return schedule.fixedTime;
    const base = new Date(refDay);
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

function mapSchedulesToMinyanData(schedules: any[], zmanim: ZmanResult[], refDay: Date): MinyanData[] {
  return (schedules || []).map((s) => ({
    id: s.id,
    name: s.name,
    hebrewName: s.hebrewName ?? s.name,
    time: computeMinyanTime(s, zmanim, refDay),
    room: s.room,
    type: s.type,
    groupId: s.groupId,
    isPlaceholder: s.isPlaceholder,
    placeholderLabel: s.placeholderLabel,
    durationMinutes: s.durationMinutes,
  }));
}

/** Unique `daysAhead` offsets used by events/zmanim tables, always including 0. */
function collectDaysAheadOffsets(style: DisplayStyle | null): number[] {
  if (!style?.objects) return [0];
  const s = new Set<number>([0]);
  for (const obj of style.objects) {
    if (obj.type === 'EVENTS_TABLE' || obj.type === 'ZMANIM_TABLE') {
      const d = obj.content?.daysAhead;
      s.add(typeof d === 'number' && Number.isFinite(d) ? Math.trunc(d) : 0);
    }
  }
  return [...s].sort((a, b) => a - b);
}

export interface DisplayAppProps {
  orgId: string;
  screenId: string;
  getStyles: () => Promise<DisplayStyle[]>;
  /** When provided, use this instead of getStyles + getActiveStyle for screen-specific style resolution */
  getResolvedStyle?: (breakpoint: DisplayBreakpoint, atDate: Date) => Promise<DisplayStyle | null>;
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
  /** Zmanim per `daysAhead` offset from the effective display date */
  zmanimByOffset: Record<number, ZmanResult[]>;
  rawSchedules: any[];
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

export type DisplayScaleMode = 'fit' | 'width-fit';

function useScreenScale(
  canvasWidth: number,
  canvasHeight: number,
  mode: DisplayScaleMode = 'fit',
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
  if (mode === 'width-fit') {
    const scale = scaleX;
    const offsetX = (dims.w - canvasWidth * scale) / 2;
    const offsetY = 0;
    return { scale, offsetX, offsetY };
  }
  const scale = Math.min(scaleX, scaleY);
  const offsetX = (dims.w - canvasWidth * scale) / 2;
  const offsetY = (dims.h - canvasHeight * scale) / 2;

  return { scale, offsetX, offsetY };
}

const MOBILE_SCROLL_BODY_CLASS = 'dsp-display-mobile-scroll';

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
    zmanimByOffset: { 0: [] },
    rawSchedules: [],
    calendarInfo: null,
    announcements: [],
    memorials: [],
    minyans: [],
    media: [],
    displayNames: {},
    loading: true,
    error: null,
  });

  const [dateOverride, setDateOverride] = useState<Date | null>(null);
  const [wallClock, setWallClock] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setWallClock(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onPick = (e: Event) => {
      const d = (e as CustomEvent<Date>).detail;
      if (d instanceof Date && !isNaN(d.getTime())) setDateOverride(new Date(d.getTime()));
    };
    window.addEventListener('zmanim-display-date-override', onPick as EventListener);
    return () => window.removeEventListener('zmanim-display-date-override', onPick as EventListener);
  }, []);

  const effectiveDisplayDate = dateOverride ?? wallClock;

  const midnightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zmanimIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const styleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondaryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const activeStyleRef = useRef<DisplayStyle | null>(null);
  activeStyleRef.current = state.activeStyle;
  const effectiveDisplayDateRef = useRef(effectiveDisplayDate);
  effectiveDisplayDateRef.current = effectiveDisplayDate;

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
    (style: DisplayStyle, zmanim: ZmanResult[], effective: Date): DisplayObject[] => {
      const zmanimMap = new Map<string, Date | null>();
      for (const z of zmanim) {
        zmanimMap.set(z.type, z.time);
      }
      const ctx = buildScheduleContext(
        effective,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        zmanimMap,
        new Set(),
      );
      return getVisibleObjects(style, ctx);
    },
    [],
  );

  const refreshZmanimAndCalendar = useCallback(async () => {
    try {
      const effective = effectiveDisplayDateRef.current;
      const style = activeStyleRef.current;
      const offsets = style ? collectDaysAheadOffsets(style) : [0];
      const zmanimResults = await Promise.all(offsets.map((off) => getZmanim(addDays(effective, off))));
      const zmanimByOffset: Record<number, ZmanResult[]> = {};
      offsets.forEach((off, i) => {
        zmanimByOffset[off] = zmanimResults[i] ?? [];
      });
      const zmanim = zmanimByOffset[0] ?? [];
      const calendarInfo = await getCalendarInfo(effective);
      if (!mountedRef.current) return;

      setState((prev) => {
        const visibleObjects = prev.activeStyle
          ? resolveVisibleObjects(prev.activeStyle, zmanim, effective)
          : prev.visibleObjects;
        return { ...prev, zmanim, zmanimByOffset, calendarInfo, visibleObjects };
      });
    } catch (err) {
      handleError(err);
    }
  }, [getZmanim, getCalendarInfo, handleError, resolveVisibleObjects]);

  const refreshSecondary = useCallback(async () => {
    try {
      const effective = effectiveDisplayDateRef.current;
      const promises: [Promise<AnnouncementData[]>, Promise<MemorialData[]>, Promise<any[]>, Promise<MediaData[]>, Promise<DisplayNameOverrides>] = [
        getAnnouncements(),
        getMemorials(effective),
        getMinyanSchedule(effective),
        getMedia(),
        getDisplayNames ? getDisplayNames() : Promise.resolve({}),
      ];
      const [announcements, memorials, rawSchedules, media, displayNames] = await Promise.all(promises);
      if (!mountedRef.current) return;
      setState((prev) => {
        const z0 = prev.zmanimByOffset[0] ?? prev.zmanim;
        return {
          ...prev,
          announcements,
          memorials,
          rawSchedules,
          minyans: mapSchedulesToMinyanData(rawSchedules, z0, effective),
          media,
          displayNames,
        };
      });
    } catch (err) {
      handleError(err);
    }
  }, [getAnnouncements, getMemorials, getMinyanSchedule, getMedia, getDisplayNames, handleError]);

  const refreshStyle = useCallback(async () => {
    try {
      const effective = effectiveDisplayDateRef.current;
      let activeStyle: DisplayStyle | null = null;
      if (getResolvedStyle) {
        activeStyle = await getResolvedStyle(breakpointRef.current, effective);
      } else {
        const styles = await getStyles();
        activeStyle = getActiveStyle(styles, effective, false);
      }
      if (!mountedRef.current || !activeStyle) return;

      setState((prev) => {
        if (JSON.stringify(prev.activeStyle) === JSON.stringify(activeStyle)) return prev;
        const visibleObjects = resolveVisibleObjects(activeStyle!, prev.zmanim, effective);
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
      const effective = effectiveDisplayDateRef.current;
      const displayNamesPromise = getDisplayNames ? getDisplayNames() : Promise.resolve({});

      if (getResolvedStyle) {
        const resolved = await getResolvedStyle(breakpointRef.current, effective);
        const activeStyle = resolved ?? null;
        const offsets = activeStyle ? collectDaysAheadOffsets(activeStyle) : [0];
        const zmanimResults = await Promise.all(offsets.map((off) => getZmanim(addDays(effective, off))));
        const zmanimByOffset: Record<number, ZmanResult[]> = {};
        offsets.forEach((off, i) => {
          zmanimByOffset[off] = zmanimResults[i] ?? [];
        });
        const zmanim = zmanimByOffset[0] ?? [];

        const [calendarInfo, announcements, memorials, rawSchedules, media, displayNames] = await Promise.all([
          getCalendarInfo(effective),
          getAnnouncements(),
          getMemorials(effective),
          getMinyanSchedule(effective),
          getMedia(),
          displayNamesPromise,
        ]);

        if (!mountedRef.current) return;

        const styles = activeStyle ? [activeStyle] : [];
        const visibleObjects = activeStyle ? resolveVisibleObjects(activeStyle, zmanim, effective) : [];
        const minyans = mapSchedulesToMinyanData(rawSchedules, zmanim, effective);

        setState({
          styles,
          activeStyle,
          visibleObjects,
          zmanim,
          zmanimByOffset,
          rawSchedules,
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
        const styles = await getStyles();
        const activeStyle = getActiveStyle(styles, effective, false);
        const offsets = activeStyle ? collectDaysAheadOffsets(activeStyle) : [0];
        const zmanimResults = await Promise.all(offsets.map((off) => getZmanim(addDays(effective, off))));
        const zmanimByOffset: Record<number, ZmanResult[]> = {};
        offsets.forEach((off, i) => {
          zmanimByOffset[off] = zmanimResults[i] ?? [];
        });
        const zmanim = zmanimByOffset[0] ?? [];

        const [calendarInfo, announcements, memorials, rawSchedules, media, displayNames] = await Promise.all([
          getCalendarInfo(effective),
          getAnnouncements(),
          getMemorials(effective),
          getMinyanSchedule(effective),
          getMedia(),
          displayNamesPromise,
        ]);

        if (!mountedRef.current) return;

        const visibleObjects = activeStyle ? resolveVisibleObjects(activeStyle, zmanim, effective) : [];
        const minyans = mapSchedulesToMinyanData(rawSchedules, zmanim, effective);

        setState({
          styles,
          activeStyle,
          visibleObjects,
          zmanim,
          zmanimByOffset,
          rawSchedules,
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

  const fullRefreshRef = useRef(fullRefresh);
  fullRefreshRef.current = fullRefresh;

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

  const mobileVerticalScroll = displayBreakpoint === 'mobile';
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;
    if (mobileVerticalScroll) {
      root.classList.add(MOBILE_SCROLL_BODY_CLASS);
      body.classList.add(MOBILE_SCROLL_BODY_CLASS);
    } else {
      root.classList.remove(MOBILE_SCROLL_BODY_CLASS);
      body.classList.remove(MOBILE_SCROLL_BODY_CLASS);
    }
    return () => {
      root.classList.remove(MOBILE_SCROLL_BODY_CLASS);
      body.classList.remove(MOBILE_SCROLL_BODY_CLASS);
    };
  }, [mobileVerticalScroll]);

  const minyansByOffsetComputed = useMemo(() => {
    const raw = state.rawSchedules;
    const zb = state.zmanimByOffset;
    if (!raw.length || !Object.keys(zb).length) return {} as Record<number, MinyanData[]>;
    const out: Record<number, MinyanData[]> = {};
    for (const off of Object.keys(zb).map(Number)) {
      const z = zb[off] ?? state.zmanim;
      out[off] = mapSchedulesToMinyanData(raw, z, addDays(effectiveDisplayDate, off));
    }
    return out;
  }, [state.rawSchedules, state.zmanimByOffset, state.zmanim, effectiveDisplayDate]);

  useEffect(() => {
    if (!dateOverride) return;
    void fullRefreshRef.current();
  }, [dateOverride]);

  const canvasW = state.activeStyle?.canvasWidth ?? 1920;
  const canvasH = state.activeStyle?.canvasHeight ?? 1080;
  const { scale, offsetX, offsetY } = useScreenScale(
    canvasW,
    canvasH,
    mobileVerticalScroll ? 'width-fit' : 'fit',
  );

  if (state.loading) {
    return <div className="dsp-loading">Loading display...</div>;
  }

  if (state.error && !state.activeStyle) {
    return (
      <div className="dsp-fatalError">
        <div className="dsp-fatalErrorTitle">Display Error</div>
        <div className="dsp-fatalErrorMsg">{state.error}</div>
      </div>
    );
  }

  if (!state.activeStyle) {
    return <div className="dsp-noStyle">No active display style configured</div>;
  }

  return (
    <div
      className={mobileVerticalScroll ? 'dsp-root dsp-root--mobileScroll' : 'dsp-root'}
      style={
        mobileVerticalScroll
          ? {
              minHeight: `max(100vh, ${offsetY + canvasH * scale}px)`,
            }
          : undefined
      }
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
          mobileVerticalScroll={mobileVerticalScroll}
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
          zmanimByOffset={state.zmanimByOffset}
          calendarInfo={state.calendarInfo ?? undefined}
          announcements={state.announcements}
          memorials={state.memorials}
          minyans={state.minyans}
          minyansByOffset={minyansByOffsetComputed}
          media={state.media}
          displayNames={state.displayNames}
          referenceDate={effectiveDisplayDate}
        />
      </div>
      </FrameRenderer>

      {/* Error toast overlay */}
      {state.error && <div className="dsp-errorToast">{state.error}</div>}
    </div>
  );
}

'use client';

import { DisplayApp } from '@zmanim-app/ui';
import { ScreenManager } from '@zmanim-app/core';
import type { DisplayBreakpoint, ScreenStyleSchedule } from '@zmanim-app/core';
import { use, useCallback } from 'react';
import { apiFetch } from '../../../_lib/api-fetch';

type Props = {
  params: Promise<{ orgSlug: string; screenId: string }>;
};

/**
 * Public display boards live under /show/... so they never collide with
 * /login/* (e.g. /login/sso-callback for Clerk OAuth).
 */
export default function DisplayPage({ params }: Props) {
  const { orgSlug, screenId } = use(params);

  const orgId = orgSlug;

  const getStyles = useCallback(async () => {
    return apiFetch(`/api/org/${orgId}/styles`);
  }, [orgId]);

  const getResolvedStyle = useCallback(async (breakpoint: DisplayBreakpoint, atDate: Date) => {
    const [screenRes, styles, org] = await Promise.all([
      apiFetch<{
        id: string;
        orgId: string;
        name: string;
        styleId?: string;
        styleSchedules?: ScreenStyleSchedule[] | null;
        active?: boolean;
        resolution?: { width: number; height: number };
      }>(`/api/org/${orgId}/screens/${screenId}`),
      apiFetch(`/api/org/${orgId}/styles`),
      apiFetch<{ location?: { inIsrael?: boolean } }>(`/api/org/${orgId}`),
    ]);
    const screenConfig = {
      id: screenRes.id,
      name: screenRes.name,
      orgId: screenRes.orgId,
      assignedStyleId: screenRes.styleId || undefined,
      styleSchedules: screenRes.styleSchedules ?? null,
      resolution: screenRes.resolution ?? { width: 1920, height: 1080 },
      isActive: screenRes.active ?? true,
    };
    const manager = new ScreenManager();
    return manager.resolveStyleForScreen(
      screenConfig,
      styles,
      atDate,
      org?.location?.inIsrael ?? false,
      breakpoint,
    );
  }, [orgId, screenId]);

  const getZmanim = useCallback(
    async (date: Date) => {
      const res = await apiFetch<{ zmanim: any[] }>(
        `/api/zmanim?date=${date.toISOString()}&orgId=${orgId}`,
      );
      return (res.zmanim ?? []).map((z: any) => ({
        ...z,
        time: z.time ? new Date(z.time) : null,
        originalTime: z.originalTime ? new Date(z.originalTime) : null,
      }));
    },
    [orgId],
  );

  const getCalendarInfo = useCallback(async (date: Date) => {
    const res = await apiFetch<any>(
      `/api/calendar?date=${date.toISOString()}`,
    );
    return {
      date: res.jewishDate,
      parsha: res.parsha,
      holiday: res.holiday,
      omer: res.omer,
      dafYomi: res.dafYomi,
      tefilah: res.tefilah,
    };
  }, []);

  const getAnnouncements = useCallback(async () => {
    return apiFetch(`/api/org/${orgId}/announcements`);
  }, [orgId]);

  const getMemorials = useCallback(
    async (_date: Date) => {
      return apiFetch(`/api/org/${orgId}/memorials`);
    },
    [orgId],
  );

  const getMinyanSchedule = useCallback(
    async (_date: Date) => {
      return apiFetch(`/api/org/${orgId}/schedules`);
    },
    [orgId],
  );

  const getMedia = useCallback(async () => {
    return apiFetch(`/api/org/${orgId}/media`);
  }, [orgId]);

  const getDisplayNames = useCallback(async () => {
    const org = await apiFetch<{ settings?: { displayNames?: Record<string, any> } }>(`/api/org/${orgId}`);
    return org?.settings?.displayNames ?? {};
  }, [orgId]);

  const handleError = useCallback((err: Error) => {
    console.error('Display error:', err);
  }, []);

  return (
    <>
      <style>{`
        html, body { margin: 0; padding: 0; width: 100vw; min-height: 100vh; }
        /* Default: letterboxed display (no scroll). Mobile scroll overrides via .dsp-display-mobile-scroll from DisplayApp */
        html:not(.dsp-display-mobile-scroll),
        body:not(.dsp-display-mobile-scroll) {
          overflow: hidden;
          height: 100vh;
        }
      `}</style>
      <DisplayApp
        orgId={orgId}
        screenId={screenId}
        getStyles={getStyles}
        getResolvedStyle={getResolvedStyle}
        getZmanim={getZmanim}
        getCalendarInfo={getCalendarInfo}
        getAnnouncements={getAnnouncements}
        getMemorials={getMemorials}
        getMinyanSchedule={getMinyanSchedule}
        getMedia={getMedia}
        getDisplayNames={getDisplayNames}
        onError={handleError}
      />
    </>
  );
}

'use client';

import { MobileApp } from '@zmanim-app/ui';
import { useCallback } from 'react';

const DEFAULT_ORG_ID = 'default';

async function apiFetch<T = any>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export default function MobilePage() {
  const orgId = DEFAULT_ORG_ID;

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
      hebrewDate: res.jewishDate?.formattedHebrew ?? '',
      jewishDate: res.jewishDate,
      parsha: res.parsha,
      holiday: res.holiday,
      omer: res.omer,
      dafYomi: res.dafYomi,
      tefilah: res.tefilah,
    };
  }, []);

  const getSchedule = useCallback(
    async (_date: Date) => {
      return apiFetch(`/api/org/${orgId}/schedules`);
    },
    [orgId],
  );

  const getAnnouncements = useCallback(async () => {
    return apiFetch(`/api/org/${orgId}/announcements`);
  }, [orgId]);

  return (
    <MobileApp
      getZmanim={getZmanim}
      getCalendarInfo={getCalendarInfo}
      getSchedule={getSchedule}
      getAnnouncements={getAnnouncements}
      orgName="Zmanim App"
      orgNameHebrew="לוח זמנים"
    />
  );
}

'use client';

import { AdminApp } from '@zmanim-app/ui';
import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../_lib/api-fetch';

interface UserMembership {
  orgId: string;
  orgName: string;
  orgSlug: string;
  orgStatus: string;
  role: string;
}

interface MeData {
  user: { id: string; clerkUserId: string; email: string; name: string; isSuperAdmin: boolean };
  memberships: UserMembership[];
}

const ORG_STORAGE_KEY = 'zmanim-selected-org';

export default function AdminPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeData | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<UserMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lockInfo, setLockInfo] = useState<{ locked: boolean; lockedBy?: string } | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const meData: MeData = await apiFetch('/api/me');
        setMe(meData);

        const active = meData.memberships.filter((m) => m.orgStatus === 'active');
        if (active.length === 0 && !meData.user.isSuperAdmin) {
          const pending = meData.memberships.filter((m) => m.orgStatus === 'pending');
          if (pending.length > 0) {
            router.push('/onboarding');
            return;
          }
          if (meData.memberships.length === 0) {
            router.push('/onboarding');
            return;
          }
        }

        setMemberships(meData.user.isSuperAdmin ? meData.memberships : active);

        const stored = localStorage.getItem(ORG_STORAGE_KEY);
        const validStored = active.find((m) => m.orgId === stored);
        const selectedOrg = validStored?.orgId ?? active[0]?.orgId;

        if (selectedOrg) {
          setOrgId(selectedOrg);
          localStorage.setItem(ORG_STORAGE_KEY, selectedOrg);
        } else if (meData.user.isSuperAdmin) {
          setOrgId(meData.memberships[0]?.orgId ?? 'demo');
        }

        setLoading(false);
      } catch (err: any) {
        if (err.message?.includes('User not found')) {
          setTimeout(() => window.location.reload(), 2000);
          return;
        }
        setError(err.message);
        setLoading(false);
      }
    };
    init();
  }, [router]);

  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!orgId) return;

    const tryLock = async () => {
      try {
        const res = await fetch(`/api/org/${orgId}/lock`, { method: 'POST' });
        const data = await res.json();
        if (res.status === 423) {
          setLockInfo({ locked: true, lockedBy: data.lockedBy });
        } else {
          setLockInfo({ locked: false });
          heartbeatRef.current = setInterval(async () => {
            try {
              await fetch(`/api/org/${orgId}/lock`, { method: 'PUT' });
            } catch { /* ignore */ }
          }, 2 * 60 * 1000);
        }
      } catch {
        setLockInfo({ locked: false });
      }
    };

    tryLock();

    const releaseLock = () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      navigator.sendBeacon?.(`/api/org/${orgId}/lock?_method=DELETE`);
    };

    window.addEventListener('beforeunload', releaseLock);
    return () => {
      releaseLock();
      window.removeEventListener('beforeunload', releaseLock);
      fetch(`/api/org/${orgId}/lock`, { method: 'DELETE' }).catch(() => {});
    };
  }, [orgId]);

  const switchOrg = useCallback((newOrgId: string) => {
    if (orgId) {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      fetch(`/api/org/${orgId}/lock`, { method: 'DELETE' }).catch(() => {});
    }
    setOrgId(newOrgId);
    localStorage.setItem(ORG_STORAGE_KEY, newOrgId);
  }, [orgId]);

  const onSave = useCallback(
    async (entity: string, data: any) => {
      if (!orgId) return;
      const base = `/api/org/${orgId}`;

      switch (entity) {
        case 'location':
          await apiFetch(`${base}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location: data }),
          });
          break;

        case 'schedules':
          await apiFetch(`${base}/schedules`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          break;

        case 'groups':
          await apiFetch(`${base}/groups`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          break;

        case 'announcements':
          for (const a of data) {
            if (a.id?.startsWith('ann-')) {
              await apiFetch(`${base}/announcements`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(a),
              });
            } else {
              await apiFetch(`${base}/announcements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(a),
              });
            }
          }
          break;

        case 'memorials':
          for (const m of data) {
            if (!m.id?.startsWith('mem-')) {
              await apiFetch(`${base}/memorials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(m),
              });
            }
          }
          break;

        case 'sponsors':
          await apiFetch(`${base}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings: { sponsors: data } }),
          });
          break;

        case 'media-upload': {
          const formData = new FormData();
          formData.append('file', data as File);
          await apiFetch(`${base}/media`, {
            method: 'POST',
            body: formData,
          });
          break;
        }

        case 'styles':
          if (data?.id) {
            try {
              await apiFetch(`${base}/styles/${data.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
              });
            } catch {
              await apiFetch(`${base}/styles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
              });
            }
          }
          break;

        case 'media':
          break;

        case 'displaySettings':
          await apiFetch(`${base}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings: { display: data } }),
          });
          break;

        case 'displayNames':
          await apiFetch(`${base}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings: { displayNames: data } }),
          });
          break;

        case 'screens':
          for (const s of data) {
            const url = `${base}/screens/${encodeURIComponent(s.id)}`;
            const res = await fetch(url, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(s),
            });
            if (res.status === 404) {
              await apiFetch(`${base}/screens`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(s),
              });
            } else if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              throw new Error(body.error ?? `Request failed: ${res.status}`);
            }
          }
          break;

        case 'export':
          window.open(`${base}/export?type=${data.type}`, '_blank');
          break;

        default:
          console.warn(`Unhandled save entity: ${entity}`);
      }
    },
    [orgId],
  );

  const onLoad = useCallback(
    async (entity: string, query?: any) => {
      if (!orgId) return null;
      const base = `/api/org/${orgId}`;

      switch (entity) {
        case 'schedules':
          return apiFetch(`${base}/schedules`);
        case 'groups':
          return apiFetch(`${base}/groups`);
        case 'announcements':
          return apiFetch(`${base}/announcements`);
        case 'memorials':
          return apiFetch(`${base}/memorials`);
        case 'media':
          return apiFetch(`${base}/media`);
        case 'screens':
          return apiFetch(`${base}/screens`);
        case 'styles':
          return apiFetch(`${base}/styles`);
        case 'displayNames': {
          const org = await apiFetch(`${base}`);
          return org?.settings?.displayNames ?? {};
        }
        case 'calendar':
          return apiFetch(`/api/calendar?date=${new Date().toISOString()}`);
        case 'zmanim':
          return apiFetch(`/api/zmanim?date=${new Date().toISOString()}`);
        case 'import':
          return apiFetch(`${base}/import`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query),
          });
        case 'org':
          return apiFetch(`${base}`);
        default:
          return null;
      }
    },
    [orgId],
  );

  const onDelete = useCallback(
    async (entity: string, id: string) => {
      if (!orgId) return;
      const base = `/api/org/${orgId}`;

      switch (entity) {
        case 'media':
          await apiFetch(`${base}/media/${id}`, { method: 'DELETE' });
          break;
        case 'styles':
          await apiFetch(`${base}/styles/${id}`, { method: 'DELETE' });
          break;
        default:
          console.warn(`Unhandled delete entity: ${entity}`);
      }
    },
    [orgId],
  );

  const weekExportFetcher = useMemo(() => ({
    fetchZmanim: async (date: Date) => {
      const res = await apiFetch<{ zmanim: any[] }>(`/api/zmanim?date=${date.toISOString()}`);
      return (res.zmanim ?? []).map((z: any) => ({
        ...z,
        time: z.time ? new Date(z.time) : null,
      }));
    },
    fetchCalendar: async (date: Date) => {
      return apiFetch(`/api/calendar?date=${date.toISOString()}`);
    },
  }), []);

  if (loading) {
    return <main className="web-mainCenter">Loading admin panel...</main>;
  }

  if (error) {
    return (
      <main className="web-mainError">
        <div className="web-errorTitle">Failed to load admin panel</div>
        <div className="web-errorText">{error}</div>
        <button type="button" onClick={() => window.location.reload()} className="web-btnRetry">
          Retry
        </button>
      </main>
    );
  }

  if (!orgId) {
    return (
      <main className="web-mainCenter">No organization found. Please contact the administrator.</main>
    );
  }

  return (
    <div>
      {memberships.length > 1 && (
        <div className="web-orgBar">
          <span className="web-orgLabel">Organization:</span>
          <select value={orgId} onChange={(e) => switchOrg(e.target.value)} className="web-orgSelect">
            {memberships.map((m) => (
              <option key={m.orgId} value={m.orgId}>
                {m.orgName} ({m.role})
              </option>
            ))}
          </select>
          {me?.user.isSuperAdmin && (
            <a href="/admin/super" className="web-superLink">
              Super Admin
            </a>
          )}
        </div>
      )}
      {me?.user.isSuperAdmin && memberships.length <= 1 && (
        <div className="web-orgBarEnd">
          <a href="/admin/super" className="web-superLink">
            Super Admin
          </a>
        </div>
      )}
      {lockInfo?.locked && (
        <div className="web-lockBanner">
          This organization is currently being edited by <strong>{lockInfo.lockedBy}</strong>.
          You are in read-only mode.
        </div>
      )}
      <AdminApp
        orgId={orgId}
        onSave={onSave}
        onLoad={onLoad}
        onDelete={onDelete}
        weekExportFetcher={weekExportFetcher}
      />
    </div>
  );
}

'use client';

import { AdminApp } from '@zmanim-app/ui';
import { useCallback, useState, useEffect } from 'react';

const DEFAULT_ORG_ID = 'demo';

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export default function AdminPage() {
  const [orgId] = useState(DEFAULT_ORG_ID);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`/api/org/${orgId}`)
      .then(() => setLoading(false))
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [orgId]);

  const onSave = useCallback(
    async (entity: string, data: any) => {
      const base = `/api/org/${orgId}`;

      switch (entity) {
        case 'location':
          await apiFetch(`${base}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location: data }),
          });
          break;

        case 'zmanimConfigs':
          await apiFetch(`${base}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings: { zmanimConfigs: data } }),
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
            if (!s.id?.startsWith('screen-')) {
              await apiFetch(`${base}/screens`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(s),
              });
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
        default:
          return null;
      }
    },
    [orgId],
  );

  const onDelete = useCallback(
    async (entity: string, id: string) => {
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

  if (loading) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 18,
          color: '#6b7280',
        }}
      >
        Loading admin panel...
      </main>
    );
  }

  if (error) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 600, color: '#dc2626' }}>
          Failed to load admin panel
        </div>
        <div style={{ color: '#6b7280' }}>{error}</div>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 8,
            padding: '8px 20px',
            fontSize: 14,
            fontWeight: 600,
            border: 'none',
            borderRadius: 6,
            backgroundColor: '#3b82f6',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </main>
    );
  }

  return (
    <AdminApp
      orgId={orgId}
      onSave={onSave}
      onLoad={onLoad}
      onDelete={onDelete}
    />
  );
}

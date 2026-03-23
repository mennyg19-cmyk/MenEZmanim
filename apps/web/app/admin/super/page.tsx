'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface OrgRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  timezone: string;
  createdAt: string;
}

interface UserRow {
  id: string;
  clerkUserId: string;
  email: string;
  name: string;
  isSuperAdmin: boolean;
  memberships: { orgId: string; role: string; organization: { name: string; slug: string } }[];
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export default function SuperAdminPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'orgs' | 'users' | 'tools'>('orgs');
  const [cloneSource, setCloneSource] = useState('');
  const [cloneTarget, setCloneTarget] = useState('');
  const [toolMsg, setToolMsg] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [orgsData, usersData] = await Promise.all([
        apiFetch('/api/admin/orgs'),
        apiFetch('/api/admin/users'),
      ]);
      setOrgs(orgsData);
      setUsers(usersData);
    } catch (err: any) {
      if (err.message?.includes('Forbidden')) {
        router.push('/admin');
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateOrgStatus = async (orgId: string, status: string) => {
    try {
      await apiFetch(`/api/admin/orgs/${orgId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <main style={styles.container}>
        <p style={{ color: '#6b7280' }}>Loading super admin dashboard...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={styles.container}>
        <div style={{ color: '#dc2626', marginBottom: 16 }}>{error}</div>
        <button onClick={() => window.location.reload()} style={styles.btn}>Retry</button>
      </main>
    );
  }

  const pendingOrgs = orgs.filter((o) => o.status === 'pending');
  const activeOrgs = orgs.filter((o) => o.status === 'active');
  const suspendedOrgs = orgs.filter((o) => o.status === 'suspended');

  return (
    <main style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Super Admin Dashboard</h1>
        <a href="/admin" style={styles.backLink}>Back to Admin</a>
      </div>

      <div style={styles.tabs}>
        <button
          onClick={() => setTab('orgs')}
          style={{ ...styles.tab, ...(tab === 'orgs' ? styles.tabActive : {}) }}
        >
          Organizations ({orgs.length})
        </button>
        <button
          onClick={() => setTab('users')}
          style={{ ...styles.tab, ...(tab === 'users' ? styles.tabActive : {}) }}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => setTab('tools')}
          style={{ ...styles.tab, ...(tab === 'tools' ? styles.tabActive : {}) }}
        >
          Tools
        </button>
      </div>

      {tab === 'orgs' && (
        <div>
          {pendingOrgs.length > 0 && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>
                Pending Approval ({pendingOrgs.length})
              </h2>
              {pendingOrgs.map((org) => (
                <div key={org.id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <strong>{org.name}</strong>
                    <span style={styles.badge('pending')}>Pending</span>
                  </div>
                  <div style={styles.cardMeta}>
                    Slug: {org.slug} | TZ: {org.timezone} | Created: {new Date(org.createdAt).toLocaleDateString()}
                  </div>
                  <div style={styles.cardActions}>
                    <button
                      onClick={() => updateOrgStatus(org.id, 'active')}
                      style={{ ...styles.btn, background: '#22c55e' }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateOrgStatus(org.id, 'suspended')}
                      style={{ ...styles.btn, background: '#ef4444' }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </section>
          )}

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Active Organizations ({activeOrgs.length})</h2>
            {activeOrgs.map((org) => (
              <div key={org.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <strong>{org.name}</strong>
                  <span style={styles.badge('active')}>Active</span>
                </div>
                <div style={styles.cardMeta}>
                  Slug: {org.slug} | TZ: {org.timezone}
                </div>
                <div style={styles.cardActions}>
                  <button
                    onClick={() => updateOrgStatus(org.id, 'suspended')}
                    style={{ ...styles.btn, background: '#f59e0b' }}
                  >
                    Suspend
                  </button>
                  <a
                    href={`/show/${org.slug}/1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...styles.btn, background: '#3b82f6', textDecoration: 'none' }}
                  >
                    View Display
                  </a>
                </div>
              </div>
            ))}
          </section>

          {suspendedOrgs.length > 0 && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Suspended ({suspendedOrgs.length})</h2>
              {suspendedOrgs.map((org) => (
                <div key={org.id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <strong>{org.name}</strong>
                    <span style={styles.badge('suspended')}>Suspended</span>
                  </div>
                  <div style={styles.cardMeta}>Slug: {org.slug}</div>
                  <div style={styles.cardActions}>
                    <button
                      onClick={() => updateOrgStatus(org.id, 'active')}
                      style={{ ...styles.btn, background: '#22c55e' }}
                    >
                      Reactivate
                    </button>
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      )}

      {tab === 'users' && (
        <div>
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>All Users</h2>
            {users.map((user) => (
              <div key={user.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <strong>{user.name}</strong>
                  {user.isSuperAdmin && <span style={styles.badge('super')}>Super Admin</span>}
                </div>
                <div style={styles.cardMeta}>
                  {user.email}
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
                  {user.memberships.length > 0
                    ? user.memberships.map((m) => `${m.organization.name} (${m.role})`).join(', ')
                    : 'No org memberships'}
                </div>
              </div>
            ))}
          </section>
        </div>
      )}

      {tab === 'tools' && (
        <div>
          {toolMsg && (
            <div style={{ padding: '10px 16px', borderRadius: 8, marginBottom: 16, background: toolMsg.startsWith('Error') ? '#fee2e2' : '#dcfce7', color: toolMsg.startsWith('Error') ? '#991b1b' : '#166534', fontSize: 13 }}>
              {toolMsg}
            </div>
          )}

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Re-seed Demo Organization</h2>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
              Resets the demo org layout, schedules, announcements, and memorials to the latest defaults.
            </p>
            <button
              onClick={async () => {
                setToolMsg('');
                try {
                  await apiFetch('/api/admin/reseed-demo', { method: 'POST' });
                  setToolMsg('Demo organization re-seeded successfully!');
                } catch (err: any) {
                  setToolMsg(`Error: ${err.message}`);
                }
              }}
              style={{ ...styles.btn, background: '#8b5cf6' }}
            >
              Re-seed Demo
            </button>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Clone Data Between Organizations</h2>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
              Copies schedules, groups, announcements, memorials, styles, and display objects from one org to another.
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Source Org</label>
                <select
                  value={cloneSource}
                  onChange={(e) => setCloneSource(e.target.value)}
                  style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                >
                  <option value="">Select source...</option>
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>{o.name} ({o.slug})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Target Org</label>
                <select
                  value={cloneTarget}
                  onChange={(e) => setCloneTarget(e.target.value)}
                  style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                >
                  <option value="">Select target...</option>
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>{o.name} ({o.slug})</option>
                  ))}
                </select>
              </div>
              <button
                onClick={async () => {
                  if (!cloneSource || !cloneTarget) {
                    setToolMsg('Error: Select both source and target organizations');
                    return;
                  }
                  if (cloneSource === cloneTarget) {
                    setToolMsg('Error: Source and target must be different');
                    return;
                  }
                  setToolMsg('');
                  try {
                    const result = await apiFetch('/api/admin/clone', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ sourceOrgId: cloneSource, targetOrgId: cloneTarget }),
                    });
                    const c = result.cloned;
                    setToolMsg(`Cloned: ${c.groups} groups, ${c.schedules} schedules, ${c.announcements} announcements, ${c.memorials} memorials, ${c.styles} styles`);
                  } catch (err: any) {
                    setToolMsg(`Error: ${err.message}`);
                  }
                }}
                disabled={!cloneSource || !cloneTarget}
                style={{ ...styles.btn, background: cloneSource && cloneTarget ? '#3b82f6' : '#94a3b8' }}
              >
                Clone Data
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

const styles: Record<string, any> = {
  container: {
    maxWidth: 900,
    margin: '0 auto',
    padding: '24px 20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#1e293b',
  },
  backLink: {
    fontSize: 13,
    color: '#3b82f6',
    textDecoration: 'none',
  },
  tabs: {
    display: 'flex',
    gap: 4,
    marginBottom: 24,
    borderBottom: '2px solid #e2e8f0',
  },
  tab: {
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: '#64748b',
    borderBottom: '2px solid transparent',
    marginBottom: -2,
  },
  tabActive: {
    color: '#3b82f6',
    borderBottomColor: '#3b82f6',
  },
  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#334155',
    marginBottom: 12,
  },
  card: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    padding: '16px 20px',
    marginBottom: 10,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 12,
    color: '#64748b',
  },
  cardActions: {
    display: 'flex',
    gap: 8,
    marginTop: 12,
  },
  btn: {
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 600,
    border: 'none',
    borderRadius: 6,
    color: '#fff',
    cursor: 'pointer',
    background: '#3b82f6',
  },
  badge: (type: string) => ({
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 10,
    ...(type === 'pending' ? { background: '#fef3c7', color: '#92400e' } : {}),
    ...(type === 'active' ? { background: '#dcfce7', color: '#166534' } : {}),
    ...(type === 'suspended' ? { background: '#fee2e2', color: '#991b1b' } : {}),
    ...(type === 'super' ? { background: '#ede9fe', color: '#5b21b6' } : {}),
  }),
};

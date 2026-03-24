'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../_lib/api-fetch';

interface OrgRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  timezone: string;
  createdAt: string;
  plan?: string;
}

interface UserRow {
  id: string;
  clerkUserId: string;
  email: string;
  name: string;
  isSuperAdmin: boolean;
  memberships: { orgId: string; role: string; organization: { name: string; slug: string } }[];
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

  const updateOrgPlan = async (orgId: string, plan: string) => {
    try {
      await apiFetch(`/api/admin/orgs/${orgId}/plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <main className="web-superMain">
        <p className="web-onboardMuted">Loading super admin dashboard...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="web-superMain">
        <div className="web-errorTitle" style={{ marginBottom: 16 }}>
          {error}
        </div>
        <button type="button" onClick={() => window.location.reload()} className="web-superBtn web-superBtn--primary">
          Retry
        </button>
      </main>
    );
  }

  const pendingOrgs = orgs.filter((o) => o.status === 'pending');
  const activeOrgs = orgs.filter((o) => o.status === 'active');
  const suspendedOrgs = orgs.filter((o) => o.status === 'suspended');

  return (
    <main className="web-superMain">
      <div className="web-superHeader">
        <h1 className="web-superTitle">Super Admin Dashboard</h1>
        <a href="/admin" className="web-superBack">
          Back to Admin
        </a>
      </div>

      <div className="web-superTabs">
        <button
          type="button"
          onClick={() => setTab('orgs')}
          className={tab === 'orgs' ? 'web-superTabActive' : 'web-superTab'}
        >
          Organizations ({orgs.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('users')}
          className={tab === 'users' ? 'web-superTabActive' : 'web-superTab'}
        >
          Users ({users.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('tools')}
          className={tab === 'tools' ? 'web-superTabActive' : 'web-superTab'}
        >
          Tools
        </button>
      </div>

      {tab === 'orgs' && (
        <div>
          {pendingOrgs.length > 0 && (
            <section className="web-superSection">
              <h2 className="web-superSectionTitle">Pending Approval ({pendingOrgs.length})</h2>
              {pendingOrgs.map((org) => (
                <div key={org.id} className="web-superCard">
                  <div className="web-superCardHeader">
                    <strong>{org.name}</strong>
                    <span className="web-badge web-badge--pending">Pending</span>
                  </div>
                  <div className="web-superCardMeta">
                    Slug: {org.slug} | TZ: {org.timezone} | Created:{' '}
                    {new Date(org.createdAt).toLocaleDateString()}
                  </div>
                  <div className="web-superCardActions">
                    <button
                      type="button"
                      onClick={() => updateOrgStatus(org.id, 'active')}
                      className="web-superBtn web-superBtn--success"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => updateOrgStatus(org.id, 'suspended')}
                      className="web-superBtn web-superBtn--danger"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </section>
          )}

          <section className="web-superSection">
            <h2 className="web-superSectionTitle">Active Organizations ({activeOrgs.length})</h2>
            {activeOrgs.map((org) => (
              <div key={org.id} className="web-superCard">
                <div className="web-superCardHeader">
                  <strong>{org.name}</strong>
                  <span className="web-badge web-badge--active">Active</span>
                </div>
                <div className="web-superCardMeta">
                  Slug: {org.slug} | TZ: {org.timezone}
                </div>
                <div style={{ marginTop: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    Plan:
                    <select
                      value={org.plan ?? 'free'}
                      onChange={(e) => updateOrgPlan(org.id, e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                    >
                      <option value="free">free</option>
                      <option value="basic">basic</option>
                      <option value="pro">pro</option>
                      <option value="enterprise">enterprise</option>
                    </select>
                  </label>
                </div>
                <div className="web-superCardActions">
                  <button
                    type="button"
                    onClick={() => updateOrgStatus(org.id, 'suspended')}
                    className="web-superBtn web-superBtn--warn"
                  >
                    Suspend
                  </button>
                  <a
                    href={`/show/${org.slug}/1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="web-superBtn web-superBtn--link"
                  >
                    View Display
                  </a>
                </div>
              </div>
            ))}
          </section>

          {suspendedOrgs.length > 0 && (
            <section className="web-superSection">
              <h2 className="web-superSectionTitle">Suspended ({suspendedOrgs.length})</h2>
              {suspendedOrgs.map((org) => (
                <div key={org.id} className="web-superCard">
                  <div className="web-superCardHeader">
                    <strong>{org.name}</strong>
                    <span className="web-badge web-badge--suspended">Suspended</span>
                  </div>
                  <div className="web-superCardMeta">Slug: {org.slug}</div>
                  <div className="web-superCardActions">
                    <button
                      type="button"
                      onClick={() => updateOrgStatus(org.id, 'active')}
                      className="web-superBtn web-superBtn--success"
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
          <section className="web-superSection">
            <h2 className="web-superSectionTitle">All Users</h2>
            {users.map((user) => (
              <div key={user.id} className="web-superCard">
                <div className="web-superCardHeader">
                  <strong>{user.name}</strong>
                  {user.isSuperAdmin && <span className="web-badge web-badge--super">Super Admin</span>}
                </div>
                <div className="web-superCardMeta">{user.email}</div>
                <div className="web-superUserMeta">
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
            <div
              className={`web-toolMsg ${toolMsg.startsWith('Error') ? 'web-toolMsg--err' : 'web-toolMsg--ok'}`}
            >
              {toolMsg}
            </div>
          )}

          <section className="web-superSection">
            <h2 className="web-superSectionTitle">Re-seed Demo Organization</h2>
            <p className="web-superHint">
              Resets the demo org layout, schedules, announcements, and memorials to the latest defaults.
            </p>
            <button
              type="button"
              onClick={async () => {
                setToolMsg('');
                try {
                  await apiFetch('/api/admin/reseed-demo', { method: 'POST' });
                  setToolMsg('Demo organization re-seeded successfully!');
                } catch (err: any) {
                  setToolMsg(`Error: ${err.message}`);
                }
              }}
              className="web-superBtn web-superBtn--purple"
            >
              Re-seed Demo
            </button>
          </section>

          <section className="web-superSection">
            <h2 className="web-superSectionTitle">Clone Data Between Organizations</h2>
            <p className="web-superHint">
              Copies schedules, groups, announcements, memorials, styles, and display objects from one org to
              another.
            </p>
            <div className="web-superToolRow">
              <div>
                <label className="web-superLabel" htmlFor="clone-source">
                  Source Org
                </label>
                <select
                  id="clone-source"
                  value={cloneSource}
                  onChange={(e) => setCloneSource(e.target.value)}
                  className="web-superSelect"
                >
                  <option value="">Select source...</option>
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.slug})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="web-superLabel" htmlFor="clone-target">
                  Target Org
                </label>
                <select
                  id="clone-target"
                  value={cloneTarget}
                  onChange={(e) => setCloneTarget(e.target.value)}
                  className="web-superSelect"
                >
                  <option value="">Select target...</option>
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.slug})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
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
                    const result: { cloned: Record<string, number> } = await apiFetch('/api/admin/clone', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ sourceOrgId: cloneSource, targetOrgId: cloneTarget }),
                    });
                    const c = result.cloned;
                    setToolMsg(
                      `Cloned: ${c.groups} groups, ${c.schedules} schedules, ${c.announcements} announcements, ${c.memorials} memorials, ${c.styles} styles`,
                    );
                  } catch (err: any) {
                    setToolMsg(`Error: ${err.message}`);
                  }
                }}
                disabled={!cloneSource || !cloneTarget}
                className={`web-superBtn ${cloneSource && cloneTarget ? 'web-superBtn--primary' : 'web-superBtn--muted'}`}
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

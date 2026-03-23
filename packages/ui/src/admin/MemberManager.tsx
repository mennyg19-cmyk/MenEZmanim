'use client';

import React, { useCallback, useEffect, useState } from 'react';

type MemberRow = {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  user: { id: string; email: string; name: string };
};

type InviteRow = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
};

export function MemberManager({ orgId }: { orgId: string }) {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [mRes, iRes] = await Promise.all([
        fetch(`/api/org/${orgId}/members`),
        fetch(`/api/org/${orgId}/invites`),
      ]);
      if (!mRes.ok) {
        const b = await mRes.json().catch(() => ({}));
        throw new Error(b.error ?? `Members failed: ${mRes.status}`);
      }
      if (!iRes.ok) {
        const b = await iRes.json().catch(() => ({}));
        throw new Error(b.error ?? `Invites failed: ${iRes.status}`);
      }
      const m = await mRes.json();
      const inv = await iRes.json();
      setMembers(Array.isArray(m) ? m : []);
      setInvites(Array.isArray(inv) ? inv : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const handleInvite = async () => {
    const em = email.trim().toLowerCase();
    if (!em) {
      setError('Enter an email address');
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/org/${orgId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em, role }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Invite failed: ${res.status}`);
      setEmail('');
      setMessage(`Invitation sent to ${em}`);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Invite failed');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (membershipId: string, label: string) => {
    if (!window.confirm(`Remove ${label} from this organization?`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/org/${orgId}/members/${encodeURIComponent(membershipId)}`, {
        method: 'DELETE',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Remove failed: ${res.status}`);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Remove failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="adm-card">
        <p style={{ margin: 0, color: 'var(--adm-text-muted)' }}>Loading members…</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="adm-pageTitle" style={{ margin: '0 0 8px', fontSize: 24 }}>
        Members
      </h2>
      <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--adm-text-muted)' }}>
        Invite people by email and manage who can access this organization.
      </p>

      {error && (
        <div
          className="adm-cardCompact"
          style={{ marginBottom: 16, borderLeft: '4px solid var(--adm-danger)', color: 'var(--adm-danger)' }}
        >
          {error}
        </div>
      )}
      {message && (
        <div
          className="adm-cardCompact"
          style={{ marginBottom: 16, borderLeft: '4px solid var(--adm-success)', color: 'var(--adm-success)' }}
        >
          {message}
        </div>
      )}

      <div className="adm-settingsGrid">
        <div className="adm-card">
          <div className="adm-sectionHeader">
            <h3 className="adm-sectionTitle">Invite member</h3>
          </div>
          <div className="adm-fieldGroup">
            <label className="adm-label">Email</label>
            <input
              className="adm-inputLg"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              disabled={busy}
            />
          </div>
          <div className="adm-fieldGroup">
            <label className="adm-label">Role</label>
            <select className="adm-inputLg" value={role} onChange={(e) => setRole(e.target.value)} disabled={busy}>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <button type="button" className="adm-btnPrimary" onClick={handleInvite} disabled={busy}>
            {busy ? 'Sending…' : 'Send invite'}
          </button>
        </div>

        <div className="adm-card">
          <div className="adm-sectionHeader">
            <h3 className="adm-sectionTitle">Pending invites</h3>
          </div>
          {invites.length === 0 ? (
            <p style={{ margin: 0, fontSize: 14, color: 'var(--adm-text-muted)' }}>No pending invitations.</p>
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <th className="adm-th">Email</th>
                  <th className="adm-th">Role</th>
                  <th className="adm-th">Expires</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((inv) => (
                  <tr key={inv.id}>
                    <td className="adm-td">{inv.email}</td>
                    <td className="adm-td">{inv.role}</td>
                    <td className="adm-td" style={{ fontSize: 12 }}>
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="adm-card" style={{ gridColumn: '1 / -1' }}>
          <div className="adm-sectionHeader">
            <h3 className="adm-sectionTitle">Current members</h3>
          </div>
          {members.length === 0 ? (
            <p style={{ margin: 0, fontSize: 14, color: 'var(--adm-text-muted)' }}>No members found.</p>
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <th className="adm-th">Name</th>
                  <th className="adm-th">Email</th>
                  <th className="adm-th">Role</th>
                  <th className="adm-th">Joined</th>
                  <th className="adm-tdActions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td className="adm-td">{m.user?.name ?? '—'}</td>
                    <td className="adm-td">{m.user?.email ?? '—'}</td>
                    <td className="adm-td">
                      <span className="adm-badgeMuted">{m.role}</span>
                    </td>
                    <td className="adm-td" style={{ fontSize: 12 }}>
                      {new Date(m.createdAt).toLocaleDateString()}
                    </td>
                    <td className="adm-tdActions">
                      <button
                        type="button"
                        className="adm-btnSmallDanger"
                        disabled={busy}
                        onClick={() => handleRemove(m.id, m.user?.email ?? 'this member')}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

interface PendingInvite {
  id: string;
  token: string;
  role: string;
  organization: { name: string; slug: string };
}

interface MeData {
  user: { id: string; email: string; name: string; isSuperAdmin: boolean };
  memberships: { orgId: string; orgName: string; orgSlug: string; orgStatus: string; role: string }[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: clerkUser, isLoaded } = useUser();
  const [me, setMe] = useState<MeData | null>(null);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'choose' | 'create' | 'pending'>('choose');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [latitude, setLatitude] = useState('31.7683');
  const [longitude, setLongitude] = useState('35.2137');
  const [timezone, setTimezone] = useState('');

  useEffect(() => {
    if (!isLoaded) return;
    if (!clerkUser) {
      router.push('/login');
      return;
    }

    const init = async () => {
      try {
        const meRes = await fetch('/api/me');
        if (meRes.ok) {
          const meData: MeData = await meRes.json();
          setMe(meData);
          const active = meData.memberships.filter((m) => m.orgStatus === 'active');
          if (active.length > 0) {
            router.push('/admin');
            return;
          }
          const pending = meData.memberships.filter((m) => m.orgStatus === 'pending');
          if (pending.length > 0) {
            setMode('pending');
          }
        }

        const inviteToken = searchParams.get('invite');
        if (inviteToken) {
          try {
            const acceptRes = await fetch('/api/onboarding', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'accept-invite', token: inviteToken }),
            });
            if (acceptRes.ok) {
              router.push('/admin');
              return;
            }
          } catch { /* fall through to show page */ }
        }

        const invRes = await fetch(`/api/invites/pending`);
        if (invRes.ok) {
          const invites = await invRes.json();
          setPendingInvites(invites);
        }
      } catch {
        // user may not exist in DB yet
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [isLoaded, clerkUser, router]);

  useEffect(() => {
    try {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {
      setTimezone('America/New_York');
    }
  }, []);

  useEffect(() => {
    setOrgSlug(orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  }, [orgName]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-org',
          name: orgName,
          slug: orgSlug,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          timezone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to create organization');
        return;
      }
      setMode('pending');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptInvite = async (token: string) => {
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept-invite', token }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to accept invite');
        return;
      }
      router.push('/admin');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <main style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner} />
          <p style={{ color: '#6b7280', marginTop: 16 }}>Loading...</p>
        </div>
      </main>
    );
  }

  if (mode === 'pending') {
    return (
      <main style={styles.container}>
        <div style={styles.card}>
          <div style={{ fontSize: 48, textAlign: 'center' as const }}>⏳</div>
          <h1 style={styles.title}>Pending Approval</h1>
          <p style={styles.subtitle}>
            Your organization has been created and is pending approval by the site administrator.
            You will be able to access the admin panel once approved.
          </p>
          <button onClick={() => window.location.reload()} style={styles.btnSecondary}>
            Check Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome to Zmanim App</h1>
        <p style={styles.subtitle}>Set up your organization to get started.</p>

        {error && <div style={styles.error}>{error}</div>}

        {pendingInvites.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Pending Invitations</h2>
            {pendingInvites.map((inv) => (
              <div key={inv.id} style={styles.inviteRow}>
                <div>
                  <strong>{inv.organization.name}</strong>
                  <span style={{ color: '#6b7280', marginLeft: 8 }}>({inv.role})</span>
                </div>
                <button
                  onClick={() => handleAcceptInvite(inv.token)}
                  disabled={submitting}
                  style={styles.btnPrimary}
                >
                  Accept
                </button>
              </div>
            ))}
          </div>
        )}

        {mode === 'choose' && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Create New Organization</h2>
            <form onSubmit={handleCreateOrg}>
              <div style={styles.field}>
                <label style={styles.label}>Organization Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Congregation Beth Israel"
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>URL Slug</label>
                <input
                  type="text"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                  placeholder="e.g. beth-israel"
                  required
                  style={styles.input}
                />
                <small style={{ color: '#6b7280' }}>
                  Your display will be at /show/{orgSlug || 'your-slug'}/1
                </small>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ ...styles.field, flex: 1 }}>
                  <label style={styles.label}>Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    required
                    style={styles.input}
                  />
                </div>
                <div style={{ ...styles.field, flex: 1 }}>
                  <label style={styles.label}>Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    required
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Timezone</label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
              <button type="submit" disabled={submitting} style={styles.btnPrimary}>
                {submitting ? 'Creating...' : 'Create Organization'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    padding: 20,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: 40,
    maxWidth: 520,
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#1e293b',
    textAlign: 'center' as const,
    margin: '12px 0 4px',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  section: { marginTop: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#334155',
    marginBottom: 12,
  },
  field: { marginBottom: 16 },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#475569',
    marginBottom: 4,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    border: '1px solid #d1d5db',
    borderRadius: 8,
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  btnPrimary: {
    width: '100%',
    padding: '12px 20px',
    fontSize: 15,
    fontWeight: 600,
    border: 'none',
    borderRadius: 10,
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: '#fff',
    cursor: 'pointer',
    marginTop: 8,
  },
  btnSecondary: {
    width: '100%',
    padding: '12px 20px',
    fontSize: 15,
    fontWeight: 600,
    border: '1px solid #d1d5db',
    borderRadius: 10,
    background: '#fff',
    color: '#374151',
    cursor: 'pointer',
    marginTop: 16,
  },
  error: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 16,
  },
  inviteRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: '#f8fafc',
    borderRadius: 8,
    marginBottom: 8,
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #e5e7eb',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto',
  },
};

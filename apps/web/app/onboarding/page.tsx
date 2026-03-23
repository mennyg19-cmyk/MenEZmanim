'use client';

import { Suspense, useEffect, useState } from 'react';
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
  return (
    <Suspense
      fallback={
        <main className="web-onboardShell">
          <div className="web-onboardCard">
            <p className="web-onboardCenterText">Loading...</p>
          </div>
        </main>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: clerkUser, isLoaded } = useUser();
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
          } catch {
            /* fall through to show page */
          }
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
  }, [isLoaded, clerkUser, router, searchParams]);

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
      <main className="web-onboardShell">
        <div className="web-onboardCard">
          <div className="web-onboardSpinner" />
          <p className="web-onboardLoadingText">Loading...</p>
        </div>
      </main>
    );
  }

  if (mode === 'pending') {
    return (
      <main className="web-onboardShell">
        <div className="web-onboardCard">
          <div className="web-onboardEmoji">⏳</div>
          <h1 className="web-onboardTitle">Pending Approval</h1>
          <p className="web-onboardSubtitle">
            Your organization has been created and is pending approval by the site administrator. You will be able
            to access the admin panel once approved.
          </p>
          <button type="button" onClick={() => window.location.reload()} className="web-onboardBtnSecondary">
            Check Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="web-onboardShell">
      <div className="web-onboardCard">
        <h1 className="web-onboardTitle">Welcome to Zmanim App</h1>
        <p className="web-onboardSubtitle">Set up your organization to get started.</p>

        {error && <div className="web-onboardError">{error}</div>}

        {pendingInvites.length > 0 && (
          <div className="web-onboardSection">
            <h2 className="web-onboardSectionTitle">Pending Invitations</h2>
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="web-onboardInviteRow">
                <div>
                  <strong>{inv.organization.name}</strong>
                  <span className="web-onboardMuted" style={{ marginLeft: 8 }}>
                    ({inv.role})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAcceptInvite(inv.token)}
                  disabled={submitting}
                  className="web-superBtn web-superBtn--primary"
                >
                  Accept
                </button>
              </div>
            ))}
          </div>
        )}

        {mode === 'choose' && (
          <div className="web-onboardSection">
            <h2 className="web-onboardSectionTitle">Create New Organization</h2>
            <form onSubmit={handleCreateOrg}>
              <div className="web-onboardField">
                <label className="web-onboardLabel" htmlFor="org-name">
                  Organization Name
                </label>
                <input
                  id="org-name"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Congregation Beth Israel"
                  required
                  className="web-onboardInput"
                />
              </div>
              <div className="web-onboardField">
                <label className="web-onboardLabel" htmlFor="org-slug">
                  URL Slug
                </label>
                <input
                  id="org-slug"
                  type="text"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                  placeholder="e.g. beth-israel"
                  required
                  className="web-onboardInput"
                />
                <small className="web-onboardMuted">
                  Your display will be at /show/{orgSlug || 'your-slug'}/1
                </small>
              </div>
              <div className="web-onboardFieldRow">
                <div className="web-onboardFieldGrow">
                  <label className="web-onboardLabel" htmlFor="lat">
                    Latitude
                  </label>
                  <input
                    id="lat"
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    required
                    className="web-onboardInput"
                  />
                </div>
                <div className="web-onboardFieldGrow">
                  <label className="web-onboardLabel" htmlFor="lng">
                    Longitude
                  </label>
                  <input
                    id="lng"
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    required
                    className="web-onboardInput"
                  />
                </div>
              </div>
              <div className="web-onboardField">
                <label className="web-onboardLabel" htmlFor="tz">
                  Timezone
                </label>
                <input
                  id="tz"
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  required
                  className="web-onboardInput"
                />
              </div>
              <button type="submit" disabled={submitting} className="web-onboardBtnPrimary">
                {submitting ? 'Creating...' : 'Create Organization'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { COOKIE, passwordIsSet, verifyToken } from '@/lib/analytics/auth';
import { summarise } from '@/lib/analytics/aggregate';
import { readEvents, storeKind } from '@/lib/analytics/store';
import { StatsDashboard } from '@/components/stats/StatsDashboard';

/**
 * The private analytics screen. Only someone with the STATS_PASSWORD sees
 * data; everyone else gets the sign-in form. Never indexed, never linked.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Site analytics',
  robots: { index: false, follow: false, nocache: true },
};

const PERIODS = [7, 30, 90] as const;

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ days?: string; error?: string }> }) {
  const params = await searchParams;
  const jar = await cookies();
  const signedIn = verifyToken(jar.get(COOKIE)?.value);

  if (!signedIn) return <SignIn error={params.error === '1'} configured={passwordIsSet()} />;

  const days = PERIODS.find((p) => String(p) === params.days) ?? 30;
  let summary;
  let failed = false;
  try {
    summary = summarise(await readEvents(days), days);
  } catch {
    failed = true;
    summary = summarise([], days);
  }

  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3210';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');

  return (
    <StatsDashboard
      summary={summary}
      periods={[...PERIODS]}
      storage={storeKind}
      failed={failed}
      origin={`${proto}://${host}`}
    />
  );
}

function SignIn({ error, configured }: { error: boolean; configured: boolean }) {
  return (
    <div className="st-signin" data-tone="light">
      <form className="st-signin__card" method="post" action="/api/stats/login">
        <p className="st-mark" aria-hidden="true">
          RL
        </p>
        <h1>Site analytics</h1>
        {configured ? (
          <>
            <p className="st-muted">Private. Enter your password to see who visited and what they looked at.</p>
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus />
            {error && (
              <p className="st-error" role="alert">
                That password is not right.
              </p>
            )}
            <button type="submit" className="btn">
              Open the dashboard
            </button>
          </>
        ) : (
          <p className="st-muted">
            The dashboard is locked until a password is set. In Vercel, open the project, go to Settings, then
            Environment Variables, and add <code>STATS_PASSWORD</code> with a password of 8 characters or more.
            Redeploy, then come back here.
          </p>
        )}
      </form>
    </div>
  );
}

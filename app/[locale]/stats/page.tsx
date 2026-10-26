import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { COOKIE, passwordIsSet, verifyToken } from '@/lib/analytics/auth';
import { FILTER_KEYS, buildVisits, type Filters, type VisitRecord } from '@/lib/analytics/report';
import { readEvents, storeKind } from '@/lib/analytics/store';
import { DAILY_CAP, RETAIN_DAYS, dayOf, daysBetween, shiftDay, type StoredEvent } from '@/lib/analytics/types';
import { StatsDashboard, type Range } from '@/components/stats/StatsDashboard';

/**
 * The private analytics screen. Only someone with the STATS_PASSWORD sees
 * data; everyone else gets the sign-in form. Never indexed, never linked.
 *
 * The dates chosen decide what is read from storage, along with the same
 * number of days before them for comparison. Every other filter works in the
 * browser on the visits sent here.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Site analytics',
  robots: { index: false, follow: false, nocache: true },
};

const PRESETS = [1, 7, 30, 90, RETAIN_DAYS];
/** The most visits sent to the browser, newest kept, so the page stays light. */
const MAX_VISITS = 4000;

type Params = Partial<Record<'range' | 'from' | 'to' | 'error' | FilterKeyParam, string>>;
type FilterKeyParam = (typeof FILTER_KEYS)[number];

const isDay = (v?: string): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

function rangeOf(params: Params): Range {
  const today = dayOf(Date.now());
  const oldest = shiftDay(today, -(RETAIN_DAYS - 1));
  const clamp = (d: string) => (d < oldest ? oldest : d > today ? today : d);

  let from: string;
  let to: string;
  let preset: number | null = null;
  if (isDay(params.from) || isDay(params.to)) {
    from = clamp(isDay(params.from) ? params.from : oldest);
    to = clamp(isDay(params.to) ? params.to : today);
    if (from > to) [from, to] = [to, from];
  } else {
    preset = PRESETS.find((p) => String(p) === params.range) ?? 30;
    to = today;
    from = shiftDay(today, -(preset - 1));
  }

  const length = daysBetween(from, to).length;
  const prevTo = shiftDay(from, -1);
  const prevFrom = shiftDay(from, -length);
  const hasPrev = prevTo >= oldest;
  return {
    from,
    to,
    preset,
    presets: PRESETS,
    oldest,
    today,
    prevFrom: hasPrev ? (prevFrom < oldest ? oldest : prevFrom) : null,
    prevTo: hasPrev ? prevTo : null,
  };
}

export default async function StatsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const jar = await cookies();
  const signedIn = verifyToken(jar.get(COOKIE)?.value);

  if (!signedIn) return <SignIn error={params.error === '1'} configured={passwordIsSet()} />;

  const range = rangeOf(params);
  const days = daysBetween(range.from, range.to);
  const prevDays = range.prevFrom && range.prevTo ? daysBetween(range.prevFrom, range.prevTo) : [];

  let events: StoredEvent[] = [];
  let failed = false;
  try {
    events = await readEvents([...prevDays, ...days]);
  } catch {
    failed = true;
  }

  const perDay = new Map<string, number>();
  for (const e of events) {
    const d = dayOf(e.at);
    if (d >= range.from) perDay.set(d, (perDay.get(d) ?? 0) + 1);
  }

  // Built together, so a visit in the dates can be known as a return from the days before.
  const all = buildVisits(events);
  const visits: VisitRecord[] = all.filter((v) => v.day >= range.from).slice(0, MAX_VISITS);
  const prevVisits: VisitRecord[] = all
    .filter((v) => v.day < range.from)
    .slice(0, MAX_VISITS)
    .map((v) => ({ ...v, journey: [] }));

  const filters: Filters = {};
  for (const k of FILTER_KEYS) if (params[k]) filters[k] = String(params[k]).slice(0, 80);

  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3210';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');

  return (
    <StatsDashboard
      visits={visits}
      prevVisits={prevVisits}
      truncated={all.length > visits.length + prevVisits.length}
      range={range}
      initialFilters={filters}
      cappedDays={[...perDay.values()].filter((n) => n >= DAILY_CAP).length}
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

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from 'react';
import {
  CONTACT_KINDS,
  FILTER_KEYS,
  OUTCOMES,
  conclude,
  duration,
  matches,
  share,
  summarise,
  type FilterKey,
  type Filters,
  type Insight,
  type LiveVisit,
  type Ranked,
  type Summary,
  type VisitRecord,
} from '@/lib/analytics/report';
import type { StoreKind } from '@/lib/analytics/store';
import { DAILY_CAP, TIME_ZONE, daysBetween } from '@/lib/analytics/types';
import { OWNER } from '@/lib/analytics/client';

/**
 * The private analytics screen, built to answer three questions in order:
 * what do the numbers say (the conclusions), who were the visitors (the visits
 * list), and why (the breakdowns). Every panel follows the same filters, and
 * any bar can be clicked to filter by it.
 */

export interface Range {
  from: string;
  to: string;
  /** The preset in use, in days, or null for dates picked by hand. */
  preset: number | null;
  presets: number[];
  oldest: string;
  today: string;
  prevFrom: string | null;
  prevTo: string | null;
}

const fmtWhen = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const fmtTime = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', second: '2-digit' });
const fmtDay = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const nf = new Intl.NumberFormat('en-US');
const dayLabel = (iso: string) => fmtDay.format(new Date(`${iso}T00:00:00Z`));

let regionNames: Intl.DisplayNames | null = null;
function countryName(code: string) {
  if (code === 'Unknown' || code.length !== 2) return code;
  try {
    regionNames ??= new Intl.DisplayNames(['en'], { type: 'region' });
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

const presetName = (p: number) => (p === 1 ? 'Today' : `${p} days`);

const FILTER_NAMES: Record<FilterKey, string> = {
  source: 'Source',
  country: 'Country',
  device: 'Device',
  lang: 'Language',
  visitor: 'Visitor',
  page: 'Opened',
  outcome: 'Outcome',
  click: 'Clicked',
};

/** The query string for the same view, with some parameters changed. */
function query(base: Record<string, string | number | null | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(base)) if (v !== null && v !== undefined && v !== '') q.set(k, String(v));
  const s = q.toString();
  return s ? `/stats?${s}` : '/stats';
}

export function StatsDashboard({
  visits,
  prevVisits,
  truncated,
  range,
  initialFilters,
  cappedDays,
  storage,
  failed,
  origin,
}: {
  visits: VisitRecord[];
  prevVisits: VisitRecord[];
  truncated: boolean;
  range: Range;
  initialFilters: Filters;
  cappedDays: number;
  storage: StoreKind;
  failed: boolean;
  origin: string;
}) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [linkOpen, setLinkOpen] = useState(false);
  const [counting, setCounting] = useState(false);
  const [recordDays, setRecordDays] = useState<{ from: string; to: string }>({ from: range.from, to: range.to });
  const recordsRef = useRef<HTMLElement | null>(null);
  const router = useRouter();
  const [, startRefresh] = useTransition();

  // New visits since the dashboard opened: an alert on the page, and on the desktop when allowed.
  const [fresh, setFresh] = useState<LiveVisit[]>([]);
  const [highlight, setHighlight] = useState<string[]>([]);
  const [focusKey, setFocusKey] = useState(0);
  const freshRef = useRef(fresh);
  freshRef.current = fresh;
  const alerts = useDesktopAlerts();
  const openFreshRef = useRef<() => void>(() => {});
  const knownSids = useMemo(() => [...visits, ...prevVisits].map((v) => v.sid), [visits, prevVisits]);
  const onNew = useCallback(
    (news: LiveVisit[]) => {
      setFresh((f) => [...news, ...f]);
      alerts.notify(news, () => openFreshRef.current());
    },
    [alerts],
  );
  const live = useLiveVisits(storage !== 'none' && !failed, knownSids, onNew);

  /** Loads the new visits into the page and takes the reader to them. */
  const openFresh = () => {
    const sids = freshRef.current.map((v) => v.sid);
    setFresh([]);
    setHighlight(sids);
    if (range.to < range.today) {
      // Dates picked by hand that end before today cannot show them: move to the last 30 days.
      router.push(`${query({ range: 30, ...filters })}#visits`);
      return;
    }
    setRecordDays({ from: range.from, to: range.to });
    setFocusKey((k) => k + 1);
    startRefresh(() => router.refresh());
    recordsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  openFreshRef.current = openFresh;

  // The tab's title counts the visits waiting, so they show from another tab.
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, '');
    document.title = fresh.length ? `(${fresh.length}) ${base}` : base;
  }, [fresh.length]);

  // Signing in here marks this device as the owner's, so its visits are not counted.
  useEffect(() => {
    try {
      if (localStorage.getItem(OWNER) !== '1') localStorage.setItem(OWNER, '1');
      setCounting(false);
    } catch {
      setCounting(true);
    }
  }, []);

  // New dates from the server replace the visit list's own dates.
  useEffect(() => setRecordDays({ from: range.from, to: range.to }), [range.from, range.to]);

  const rangeParams = range.preset ? { range: range.preset } : { from: range.from, to: range.to };

  // The address keeps the filters, so a view can be reloaded or bookmarked.
  useEffect(() => {
    window.history.replaceState(null, '', query({ ...rangeParams, ...filters }));
    // rangeParams changes only with a new page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const setFilter = (key: FilterKey, value?: string) =>
    setFilters((f) => {
      const next = { ...f };
      if (!value || f[key] === value) delete next[key];
      else next[key] = value;
      return next;
    });
  const pick = (key: FilterKey) => (value: string) => setFilter(key, value);
  const active = Object.keys(filters).length > 0;

  const days = useMemo(() => daysBetween(range.from, range.to), [range.from, range.to]);
  const prevDays = useMemo(
    () => (range.prevFrom && range.prevTo ? daysBetween(range.prevFrom, range.prevTo) : []),
    [range.prevFrom, range.prevTo],
  );
  const filtered = useMemo(() => visits.filter((v) => matches(v, filters)), [visits, filters]);
  const prevFiltered = useMemo(() => prevVisits.filter((v) => matches(v, filters)), [prevVisits, filters]);
  const cur = useMemo(() => summarise(filtered, days), [filtered, days]);
  const prev = useMemo(() => (prevDays.length ? summarise(prevFiltered, prevDays) : null), [prevFiltered, prevDays]);
  const periodName = `${days.length === 1 ? 'day' : `${days.length} days`}`;
  const insights = useMemo(() => conclude(filtered, cur, prev, periodName), [filtered, cur, prev, periodName]);

  // What each filter can be set to, with how many visits in the dates have it.
  const options = useMemo(() => {
    const count = (get: (v: VisitRecord) => string[]) => {
      const m = new Map<string, number>();
      for (const v of visits) for (const k of new Set(get(v))) m.set(k, (m.get(k) ?? 0) + 1);
      return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    };
    return {
      source: count((v) => [v.source]),
      country: count((v) => [v.country]),
      device: count((v) => [v.device]),
      lang: count((v) => [v.lang]),
      visitor: count((v) => [v.returning ? 'Returning' : 'New']),
      page: count((v) => [...(v.sawHome ? ['Home page'] : []), ...v.cases]),
      outcome: OUTCOMES.map((o) => [o, visits.filter((v) => matches(v, { outcome: o })).length] as [string, number]),
      click: count((v) => v.clicks.map((c) => c.what)).slice(0, 30),
    } satisfies Record<FilterKey, [string, number][]>;
  }, [visits]);

  const showDay = (day: string) => {
    setRecordDays({ from: day, to: day });
    recordsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const rangeText = range.from === range.to ? dayLabel(range.from) : `${dayLabel(range.from)} to ${dayLabel(range.to)}`;

  return (
    <div className="st" data-tone="light">
      <header className="st-top">
        <div className="st-top__in">
          <span className="st-brand">
            <span className="st-mark" aria-hidden="true">
              RL
            </span>
            <span>
              <b>Ran Levi</b>
              <span className="st-muted"> / Site analytics</span>
            </span>
          </span>
          <span className="st-top__right">
            {live && (
              <span className="st-live" title="Checks for new visits every 45 seconds while this page is open">
                <i aria-hidden="true" /> Live
              </span>
            )}
            {live && alerts.state !== 'unsupported' && (
              <button
                type="button"
                className="st-btn st-btn--ghost"
                onClick={alerts.toggle}
                disabled={alerts.state === 'blocked'}
                aria-pressed={alerts.state === 'on'}
                title={alerts.state === 'blocked' ? 'Notifications are blocked for this site in the browser settings' : 'A desktop notification for each new visit while this tab is in the background'}
              >
                {alerts.state === 'on' ? 'Desktop alerts on' : alerts.state === 'blocked' ? 'Alerts blocked' : 'Desktop alerts'}
              </button>
            )}
            <Link href="/" className="st-link">
              View the site
            </Link>
            <form method="post" action="/api/stats/logout">
              <button type="submit" className="st-btn st-btn--ghost">
                Sign out
              </button>
            </form>
          </span>
        </div>
      </header>

      <main className="st-canvas">
        <div className="st-title">
          <div>
            <h1>Site analytics</h1>
            <p className="st-muted">
              {rangeText}
              {prev ? `, compared with ${dayLabel(range.prevFrom!)} to ${dayLabel(range.prevTo!)}` : ''}
            </p>
          </div>
          <div className="st-title__actions">
            <button type="button" className="st-btn st-btn--ghost" onClick={() => downloadCsv(filtered)} disabled={!filtered.length}>
              Export CSV
            </button>
            <button type="button" className="st-btn" onClick={() => setLinkOpen((o) => !o)} aria-expanded={linkOpen}>
              New tracking link
            </button>
          </div>
        </div>

        {linkOpen && <LinkBuilder origin={origin} onClose={() => setLinkOpen(false)} />}

        {storage === 'none' && (
          <div className="st-notice" role="status">
            <b>Visits are not being saved yet.</b> In Vercel, open the project, choose Storage, add Upstash for
            Redis on the Free plan (no payment method) and connect it to this project. Then redeploy; visits start
            appearing here.
          </div>
        )}
        {cappedDays > 0 && (
          <div className="st-notice" role="status">
            <b>{cappedDays === 1 ? 'One day' : `${cappedDays} days`} reached the daily limit.</b> To stay on the free
            plan each day keeps its first {nf.format(DAILY_CAP)} events; later visits on those days were not saved.
          </div>
        )}
        {truncated && (
          <div className="st-notice" role="status">
            These dates hold more visits than the dashboard loads at once; the oldest are left out. Pick shorter dates
            to see them.
          </div>
        )}
        {failed && (
          <div className="st-notice" role="alert">
            <b>Could not read the visit data.</b> Check that the Redis store is connected to this project.
          </div>
        )}
        {counting && <div className="st-notice">This browser blocks storage, so your own visits from it may be counted.</div>}

        {/* Dates are read on the server; everything else filters in place. */}
        <section className="st-controls" aria-label="Dates and filters">
          <div className="st-controls__dates">
            <nav className="st-seg" aria-label="Dates">
              {range.presets.map((p) => (
                <Link key={p} href={query({ range: p, ...filters })} aria-current={p === range.preset ? 'page' : undefined}>
                  {presetName(p)}
                </Link>
              ))}
            </nav>
            <form className="st-dates" method="get" action="/stats">
              <label>
                <span className="sr-only">From</span>
                <input type="date" name="from" defaultValue={range.from} min={range.oldest} max={range.today} required />
              </label>
              <span className="st-muted" aria-hidden="true">
                to
              </span>
              <label>
                <span className="sr-only">To</span>
                <input type="date" name="to" defaultValue={range.to} min={range.oldest} max={range.today} required />
              </label>
              {Object.entries(filters).map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
              <button type="submit" className="st-btn st-btn--ghost">
                Apply
              </button>
            </form>
          </div>

          <div className="st-filters">
            {FILTER_KEYS.map((key) => (
              <label key={key} className="st-filter" data-on={filters[key] ? '' : undefined}>
                <span>{FILTER_NAMES[key]}</span>
                <select value={filters[key] ?? ''} onChange={(e) => setFilter(key, e.target.value || undefined)}>
                  <option value="">All</option>
                  {/* A value set from the address that these dates do not have stays selectable. */}
                  {filters[key] && !options[key].some(([v]) => v === filters[key]) && <option value={filters[key]}>{filters[key]}</option>}
                  {options[key].map(([value, n]) => (
                    <option key={value} value={value}>
                      {(key === 'country' ? countryName(value) : value) + ` (${n})`}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          {active && (
            <div className="st-chips">
              <span className="st-muted">
                {nf.format(filtered.length)} of {nf.format(visits.length)} visits match
              </span>
              {(Object.entries(filters) as [FilterKey, string][]).map(([k, v]) => (
                <button key={k} type="button" className="st-chip" onClick={() => setFilter(k)} aria-label={`Remove ${FILTER_NAMES[k]}: ${v}`}>
                  {FILTER_NAMES[k]}: <b>{k === 'country' ? countryName(v) : v}</b> <span aria-hidden="true">×</span>
                </button>
              ))}
              <button type="button" className="st-link" onClick={() => setFilters({})}>
                Clear all
              </button>
            </div>
          )}
        </section>

        <section className="st-kpis" aria-label="Totals">
          <Kpi label="Visitors" value={cur.visitors} prev={prev?.visitors} note={cur.returningVisitors ? `${cur.returningVisitors} came back` : undefined} />
          <Kpi label="Visits" value={cur.visits} prev={prev?.visits} />
          <Kpi label="Median time in view" text={duration(cur.medianSeconds)} value={cur.medianSeconds} prev={prev?.medianSeconds} />
          <Kpi label="Engaged visits" text={`${share(cur.engaged, cur.visits)}%`} value={share(cur.engaged, cur.visits)} prev={prev && share(prev.engaged, prev.visits)} points note="30 s or more, a demo, or contact" />
          <Kpi label="Visits that contacted you" value={cur.contacted} prev={prev?.contacted} note={cur.visits ? `${share(cur.contacted, cur.visits)}% of visits` : undefined} />
          <Kpi label="CV downloads" value={cur.cv} prev={prev?.cv} />
        </section>

        <div className="st-row st-row--main">
          <section className="st-card" aria-labelledby="insights-h">
            <header className="st-card__head">
              <h2 id="insights-h">What the data says</h2>
              <span className="st-muted">{active ? 'For the filtered visits' : 'For all visits in these dates'}</span>
            </header>
            <Insights items={insights} />
          </section>
          <section className="st-card" aria-labelledby="funnel-h">
            <header className="st-card__head">
              <h2 id="funnel-h">How far visits went</h2>
              <span className="st-muted">Share of visits</span>
            </header>
            <Funnel rows={cur.funnel} total={cur.visits} />
          </section>
        </div>

        <section className="st-card st-visits" id="visits" aria-labelledby="visits-h" ref={recordsRef}>
          <VisitsPanel
            visits={filtered}
            range={range}
            days={recordDays}
            setDays={setRecordDays}
            highlight={highlight}
            focusKey={focusKey}
            hiddenNew={highlight.filter((s) => visits.some((v) => v.sid === s) && !filtered.some((v) => v.sid === s)).length}
            clearFilters={() => setFilters({})}
          />
        </section>

        <div className="st-row st-row--main">
          <section className="st-card" aria-labelledby="daily-h">
            <header className="st-card__head">
              <h2 id="daily-h">Visitors per day</h2>
              <span className="st-muted">Click a day to list its visits</span>
            </header>
            <DailyColumns daily={cur.daily} onPick={showDay} />
          </section>
          <section className="st-card" aria-labelledby="src-h">
            <header className="st-card__head">
              <h2 id="src-h">Where they came from</h2>
            </header>
            <BarList rows={cur.sources} total={cur.visits} empty="No visits." unit="visits" onPick={pick('source')} active={filters.source} />
          </section>
        </div>

        <div className="st-row st-row--half">
          <section className="st-card" aria-labelledby="clicks-h">
            <header className="st-card__head">
              <h2 id="clicks-h">What they clicked</h2>
            </header>
            <BarList rows={cur.clicks} empty="No clicks." unit="clicks" onPick={pick('click')} active={filters.click} />
          </section>
          <section className="st-card" aria-labelledby="reach-h">
            <header className="st-card__head">
              <h2 id="reach-h">How far they read the home page</h2>
              <span className="st-muted">Share of {nf.format(cur.homeVisits)} home page visits</span>
            </header>
            <Reach rows={cur.reach} empty={!cur.homeVisits} />
          </section>
        </div>

        <div className="st-row st-row--thirds">
          <section className="st-card" aria-labelledby="cases-h">
            <header className="st-card__head">
              <h2 id="cases-h">Case studies opened</h2>
            </header>
            <BarList rows={cur.cases} total={cur.visits} empty="No case study opened." unit="visits" onPick={pick('page')} active={filters.page} />
          </section>
          <section className="st-card" aria-labelledby="demo-h">
            <header className="st-card__head">
              <h2 id="demo-h">Demos used</h2>
              <span className="st-muted">{nf.format(cur.demoVisits)} visits</span>
            </header>
            <BarList rows={cur.demos} total={cur.visits} empty="Nobody tried a demo." unit="visits" />
            {cur.demoActions.length > 0 && (
              <div className="st-split">
                <p className="st-sublabel">Most frequent actions</p>
                <BarList rows={cur.demoActions} empty="" unit="times" />
              </div>
            )}
          </section>
          <section className="st-card" aria-labelledby="place-h">
            <header className="st-card__head">
              <h2 id="place-h">Who they are</h2>
            </header>
            <BarList
              rows={cur.countries}
              format={countryName}
              total={cur.visits}
              empty="No visits."
              unit="visits"
              onPick={pick('country')}
              active={filters.country}
            />
            <div className="st-split">
              <BarList rows={cur.devices} total={cur.visits} empty="" unit="visits" onPick={pick('device')} active={filters.device} />
            </div>
            <div className="st-split">
              <BarList rows={cur.langs} total={cur.visits} empty="" unit="visits" onPick={pick('lang')} active={filters.lang} />
            </div>
          </section>
        </div>

        <div className="st-row st-row--half">
          <section className="st-card" aria-labelledby="when-h">
            <header className="st-card__head">
              <h2 id="when-h">When they visit</h2>
              <span className="st-muted">Israel time</span>
            </header>
            <div className="st-when">
              <BarList rows={cur.weekdays} total={cur.visits} empty="No visits." unit="visits" keepOrder />
              <BarList rows={cur.dayparts} total={cur.visits} empty="" unit="visits" keepOrder />
            </div>
          </section>
          <section className="st-card" aria-labelledby="refs-h">
            <header className="st-card__head">
              <h2 id="refs-h">Tracking links</h2>
              <span className="st-muted">Visits through a link you made for someone</span>
            </header>
            {cur.refs.length ? (
              <BarList rows={cur.refs} unit="visits" empty="" onPick={(r) => setFilter('source', `Link: ${r}`)} active={filters.source?.replace(/^Link: /, '')} />
            ) : (
              <p className="st-empty">
                No tracking links used in these dates. Make one with <b>New tracking link</b> and send it instead of the
                plain address; every visit through it is labelled here.
              </p>
            )}
          </section>
        </div>

        <p className="st-foot st-muted">
          Counted without cookies, names or IP addresses: a random id in the visitor’s browser, the country and city
          from the network, and what was clicked. Visitors who ask not to be tracked are not counted, and neither are
          your own visits from this browser.
        </p>
      </main>

      <FreshAlert visits={fresh} onOpen={openFresh} onDismiss={() => setFresh([])} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  New visits, live                                                          */
/* -------------------------------------------------------------------------- */

const POLL_VISIBLE = 45_000;
const POLL_HIDDEN = 90_000;

/**
 * Asks the server every 45 seconds (90 in a background tab, and at once when
 * the tab comes back) whether visits started that the page does not have yet.
 * Returns whether live checking is running.
 */
function useLiveVisits(enabled: boolean, known: string[], onNew: (visits: LiveVisit[]) => void) {
  const seen = useRef(new Set<string>());
  const cursor = useRef<{ day: string; len: number } | null>(null);
  const handler = useRef(onNew);
  handler.current = onNew;
  const [on, setOn] = useState(false);

  useEffect(() => {
    for (const s of known) seen.current.add(s);
  }, [known]);

  useEffect(() => {
    if (!enabled) return;
    let timer = 0;
    let stopped = false;
    let busy = false;

    const tick = async () => {
      if (busy || stopped) return;
      busy = true;
      window.clearTimeout(timer);
      try {
        const c = cursor.current;
        const res = await fetch(c ? `/api/stats/live?day=${c.day}&from=${c.len}` : '/api/stats/live', { cache: 'no-store' });
        if (res.status === 401) stopped = true;
        if (res.ok) {
          const data = (await res.json()) as { live: boolean; day?: string; len?: number; known?: string[]; visits?: LiveVisit[] };
          setOn(data.live);
          if (!data.live) stopped = true;
          if (data.day !== undefined && data.len !== undefined) {
            for (const s of data.known ?? []) seen.current.add(s);
            const news = (data.visits ?? []).filter((v) => !seen.current.has(v.sid));
            for (const v of news) seen.current.add(v.sid);
            cursor.current = { day: data.day, len: data.len };
            if (news.length) handler.current(news.sort((a, b) => b.start - a.start));
          }
        }
      } catch {
        // Offline for a moment: the next check catches up from the same place.
      }
      busy = false;
      if (!stopped) timer = window.setTimeout(tick, document.hidden ? POLL_HIDDEN : POLL_VISIBLE);
    };
    const onVisible = () => {
      if (!document.hidden) void tick();
    };

    void tick();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled]);

  return on;
}

const ALERTS = 'rl_alerts';
type AlertState = 'unsupported' | 'off' | 'on' | 'blocked';

/** Desktop notifications, opt-in, shown only while the dashboard's tab is in the background. */
function useDesktopAlerts() {
  const [state, setState] = useState<AlertState>('unsupported');
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!('Notification' in window)) return;
    let wanted = false;
    try {
      wanted = localStorage.getItem(ALERTS) === '1';
    } catch {
      /* storage blocked: alerts start off */
    }
    setState(Notification.permission === 'denied' ? 'blocked' : Notification.permission === 'granted' && wanted ? 'on' : 'off');
  }, []);

  const remember = (on: boolean) => {
    try {
      localStorage.setItem(ALERTS, on ? '1' : '0');
    } catch {
      /* not remembered; still works for this visit */
    }
  };

  const toggle = useCallback(async () => {
    if (stateRef.current === 'on') {
      remember(false);
      setState('off');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      remember(true);
      setState('on');
    } else {
      setState(permission === 'denied' ? 'blocked' : 'off');
    }
  }, []);

  const notify = useCallback((news: LiveVisit[], open: () => void) => {
    if (stateRef.current !== 'on' || !document.hidden) return;
    try {
      const n = new Notification(news.length === 1 ? 'New visit to your site' : `${news.length} new visits to your site`, {
        body: news.slice(0, 3).map(liveLine).join('\n'),
        tag: 'rl-visits',
        icon: '/icon.svg',
      });
      n.onclick = () => {
        window.focus();
        open();
        n.close();
      };
    } catch {
      // Some phone browsers only notify through a service worker; the alert on the page still shows.
    }
  }, []);

  return useMemo(() => ({ state, toggle, notify }), [state, toggle, notify]);
}

const fmtClock = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit' });

/** "14:05 · Tel Aviv, Israel · LinkedIn · Phone" */
function liveLine(v: LiveVisit) {
  const place = [v.city, countryName(v.country)].filter((x) => x && x !== 'Unknown').join(', ') || 'Unknown place';
  const from = v.ref ? `link “${v.ref}”` : v.source;
  return [fmtClock.format(new Date(v.start)), place, from, v.device + (v.lang === 'Hebrew' ? ', in Hebrew' : '')].join(' · ');
}

function FreshAlert({ visits, onOpen, onDismiss }: { visits: LiveVisit[]; onOpen: () => void; onDismiss: () => void }) {
  const n = visits.length;
  return (
    <div className="st-toast" role="status" aria-live="polite" data-on={n ? '' : undefined}>
      {n > 0 && (
        <>
          <button type="button" className="st-toast__open" onClick={onOpen}>
            <span className="st-toast__dot" aria-hidden="true" />
            <span className="st-toast__text">
              <b>{n === 1 ? 'New visit' : `${n} new visits`}</b>
              {visits.slice(0, 3).map((v) => (
                <small key={v.sid}>{liveLine(v)}</small>
              ))}
              {n > 3 && <small>and {n - 3} more</small>}
            </span>
            <span className="st-toast__go">Show</span>
          </button>
          <button type="button" className="st-toast__x" onClick={onDismiss} aria-label="Dismiss">
            ×
          </button>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Kpi({
  label,
  value,
  text,
  note,
  prev,
  points,
}: {
  label: string;
  value: number;
  text?: string;
  note?: string;
  prev?: number | null;
  /** The value is already a percentage, so the change is in points. */
  points?: boolean;
}) {
  let delta: { text: string; dir: 'up' | 'down' | 'flat' } | null = null;
  if (prev !== undefined && prev !== null) {
    if (points) {
      const d = value - prev;
      delta = { text: `${d > 0 ? '+' : ''}${d} pts`, dir: d > 0 ? 'up' : d < 0 ? 'down' : 'flat' };
    } else if (prev > 0) {
      const d = Math.round(((value - prev) / prev) * 100);
      delta = { text: `${d > 0 ? '+' : ''}${d}%`, dir: d > 0 ? 'up' : d < 0 ? 'down' : 'flat' };
    } else if (value > 0) {
      delta = { text: 'new', dir: 'up' };
    }
  }
  return (
    <div className="st-kpi">
      <span className="st-kpi__label">{label}</span>
      <span className="st-kpi__value tnum">{text ?? nf.format(value)}</span>
      <span className="st-kpi__note">
        {delta && (
          <span className="st-delta tnum" data-dir={delta.dir} title="Against the same number of days before">
            {delta.dir === 'up' ? '▲' : delta.dir === 'down' ? '▼' : '•'} {delta.text}
          </span>
        )}
        {note && <span>{note}</span>}
      </span>
    </div>
  );
}

function Insights({ items }: { items: Insight[] }) {
  return (
    <ol className="st-insights">
      {items.slice(0, 7).map((i) => (
        <li key={i.title} data-insight={i.tone}>
          <span className="st-insights__mark" aria-hidden="true" />
          <div>
            <b>{i.title}</b>
            <p>{i.detail}</p>
            {i.action && (
              <p className="st-insights__action">
                <span>Next step:</span> {i.action}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function Funnel({ rows, total }: { rows: Ranked[]; total: number }) {
  if (!total) return <p className="st-empty">No visits.</p>;
  return (
    <ol className="st-funnel">
      {rows.map((r, i) => (
        <li key={r.label}>
          <span className="st-funnel__label">{r.label}</span>
          <span className="st-funnel__value tnum">
            {nf.format(r.count)} <span className="st-muted">{share(r.count, total)}%</span>
          </span>
          <span className="st-funnel__track" aria-hidden="true">
            <i style={{ width: `${(r.count / total) * 100}%`, opacity: 1 - i * 0.12 }} />
          </span>
        </li>
      ))}
    </ol>
  );
}

function BarList({
  rows,
  total,
  empty,
  unit,
  onPick,
  active,
  format,
  keepOrder,
}: {
  rows: Ranked[];
  total?: number;
  empty: string;
  unit: string;
  onPick?: (label: string) => void;
  active?: string;
  format?: (label: string) => string;
  /** Rows in a fixed order (days of the week), so the longest bar is not first. */
  keepOrder?: boolean;
}) {
  if (!rows.length || (keepOrder && rows.every((r) => !r.count))) return empty ? <p className="st-empty">{empty}</p> : null;
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <ul className="st-bars" data-order={keepOrder ? 'fixed' : undefined}>
      {rows.map((r) => {
        const name = format ? format(r.label) : r.label;
        const body = (
          <>
            <span className="st-bars__label">
              {name}
              {r.detail && <span className="st-muted"> in {r.detail}</span>}
            </span>
            <span className="st-bars__value tnum">
              {nf.format(r.count)}
              {total ? <span className="st-muted"> {share(r.count, total)}%</span> : null}
            </span>
            <span className="st-bars__track" aria-hidden="true">
              <i style={{ width: `${(r.count / max) * 100}%` }} />
            </span>
          </>
        );
        return (
          <li key={r.label} title={`${name}: ${nf.format(r.count)} ${unit}`} data-top={keepOrder && r.count === max ? '' : undefined}>
            {onPick ? (
              <button type="button" className="st-bars__pick" aria-pressed={active === r.label} onClick={() => onPick(r.label)}>
                {body}
              </button>
            ) : (
              body
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Reach({ rows, empty }: { rows: Summary['reach']; empty: boolean }) {
  if (empty) return <p className="st-empty">Nobody opened the home page.</p>;
  return (
    <ol className="st-reach">
      {rows.map((r) => (
        <li key={r.id} title={`${r.label}: ${r.visits} visits`}>
          <span>{r.label}</span>
          <span className="st-reach__track" aria-hidden="true">
            <i style={{ width: `${r.share * 100}%` }} />
          </span>
          <span className="tnum">{Math.round(r.share * 100)}%</span>
        </li>
      ))}
    </ol>
  );
}

/** Visitors per day as columns, one series, with a tooltip per day; a click lists that day's visits. */
function DailyColumns({ daily, onPick }: { daily: Summary['daily']; onPick: (day: string) => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(360);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(240, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const height = 180;
  const pad = { top: 10, right: 4, bottom: 24, left: 28 };
  const max = Math.max(...daily.map((d) => d.visitors), 0);
  // Even, round steps with the top tick above the maximum.
  const step = max <= 4 ? 1 : max <= 10 ? 2 : max <= 25 ? 5 : max <= 50 ? 10 : Math.ceil(max / 5 / 10) * 10;
  const top = Math.max(step * Math.ceil((max + 0.0001) / step), step);
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const slot = plotW / daily.length;
  const bar = Math.max(2, Math.min(18, slot - 2));
  const y = (v: number) => pad.top + plotH - (v / top) * plotH;
  const labelEvery = Math.ceil(daily.length / 5);
  const h = hover !== null ? daily[hover] : null;

  return (
    <div className="st-chart" ref={ref} dir="ltr">
      <svg width={width} height={height} role="img" aria-label="Visitors per day" onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} className={t === 0 ? 'st-base' : 'st-grid'} />
            <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" className="st-tick">
              {t}
            </text>
          </g>
        ))}
        {daily.map((d, i) => {
          const x = pad.left + i * slot + (slot - bar) / 2;
          const barH = (d.visitors / top) * plotH;
          return (
            <g key={d.day}>
              {d.visitors > 0 && (
                <rect x={x} y={y(d.visitors)} width={bar} height={barH} rx={2} className={hover === i ? 'st-dbar st-dbar--on' : 'st-dbar'} />
              )}
              <rect
                x={pad.left + i * slot}
                y={pad.top}
                width={slot}
                height={plotH}
                fill="transparent"
                className={d.visits ? 'st-hit' : undefined}
                onMouseEnter={() => setHover(i)}
                onClick={() => d.visits && onPick(d.day)}
              />
              {i % labelEvery === 0 && (
                <text x={pad.left + i * slot + slot / 2} y={height - 6} textAnchor="middle" className="st-tick">
                  {dayLabel(d.day)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {h && hover !== null && (
        <div className="st-tip" style={{ left: Math.min(width - 170, Math.max(0, pad.left + hover * slot + slot / 2 - 80)) }}>
          {dayLabel(h.day)}: {h.visitors} {h.visitors === 1 ? 'visitor' : 'visitors'}, {h.visits} {h.visits === 1 ? 'visit' : 'visits'}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Visits                                                                    */
/* -------------------------------------------------------------------------- */

const ROWS_SHOWN = 15;
type Sort = 'newest' | 'oldest' | 'longest' | 'most';

const SORTS: Record<Sort, { label: string; fn: (a: VisitRecord, b: VisitRecord) => number }> = {
  newest: { label: 'Newest first', fn: (a, b) => b.start - a.start },
  oldest: { label: 'Oldest first', fn: (a, b) => a.start - b.start },
  longest: { label: 'Longest first', fn: (a, b) => b.seconds - a.seconds || b.start - a.start },
  most: { label: 'Most done first', fn: (a, b) => weight(b) - weight(a) || b.start - a.start },
};
/** How much a visit did, for sorting: contact first, then demos and case studies. */
const weight = (v: VisitRecord) =>
  v.contacts.filter((c) => (CONTACT_KINDS as readonly string[]).includes(c)).length * 100 + v.demos.length * 10 + v.cases.length * 5 + v.clicks.length;

function VisitsPanel({
  visits,
  range,
  days,
  setDays,
  highlight,
  focusKey,
  hiddenNew,
  clearFilters,
}: {
  visits: VisitRecord[];
  range: Range;
  days: { from: string; to: string };
  setDays: (d: { from: string; to: string }) => void;
  /** Visits that arrived while the dashboard was open, marked as new. */
  highlight: string[];
  /** Changes when the new-visits alert is opened, to bring the newest into view. */
  focusKey: number;
  hiddenNew: number;
  clearFilters: () => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>('newest');
  const [search, setSearch] = useState('');
  const wrap = useRef<HTMLDivElement | null>(null);
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);
  const isNew = useMemo(() => new Set(highlight), [highlight]);

  useEffect(() => {
    if (!focusKey) return;
    setSort('newest');
    setSearch('');
    wrap.current?.scrollTo({ top: 0 });
  }, [focusKey]);

  // The panel's own dates sit inside the dashboard's; they reset when those change.
  const from = days.from < range.from || days.from > range.to ? range.from : days.from;
  const to = days.to > range.to || days.to < range.from ? range.to : days.to;
  const narrowed = from !== range.from || to !== range.to;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visits
      .filter((v) => v.day >= from && v.day <= to)
      .filter(
        (v) =>
          !q ||
          [v.source, v.ref, v.city, countryName(v.country), v.device, v.browser, v.lang, ...v.cases, ...v.demos, ...v.contacts, ...v.clicks.map((c) => c.what)]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(q),
      )
      .sort(SORTS[sort].fn);
  }, [visits, from, to, search, sort]);

  // The list shows fifteen visits at a time and scrolls for the rest.
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => {
      const visitRows = [...el.querySelectorAll<HTMLTableRowElement>('tbody tr.st-visit')].slice(0, ROWS_SHOWN);
      const table = el.querySelector('table');
      if (visitRows.length < ROWS_SHOWN || !table) return setMaxHeight(undefined);
      // Measured against the table, so it holds however far the list is scrolled.
      setMaxHeight(Math.ceil(visitRows[visitRows.length - 1].getBoundingClientRect().bottom - table.getBoundingClientRect().top + 1));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [rows]);

  return (
    <>
      <header className="st-card__head st-visits__head">
        <div>
          <h2 id="visits-h">Visits</h2>
          <span className="st-muted">
            {nf.format(rows.length)} {rows.length === 1 ? 'visit' : 'visits'}
            {rows.length > ROWS_SHOWN ? `, ${ROWS_SHOWN} in view; scroll for the rest` : ''}. Open a row for the path through the site.
          </span>
          {hiddenNew > 0 && (
            <span className="st-visits__hidden">
              {hiddenNew === 1 ? 'The new visit is' : `${hiddenNew} new visits are`} hidden by your filters.{' '}
              <button type="button" className="st-link" onClick={clearFilters}>
                Clear filters
              </button>
            </span>
          )}
        </div>
        <div className="st-visits__tools">
          <label className="st-dates st-dates--small">
            <span className="st-muted">From</span>
            <input
              type="date"
              value={from}
              min={range.from}
              max={range.to}
              onChange={(e) => e.target.value && setDays({ from: e.target.value, to: e.target.value > to ? e.target.value : to })}
            />
          </label>
          <label className="st-dates st-dates--small">
            <span className="st-muted">to</span>
            <input
              type="date"
              value={to}
              min={range.from}
              max={range.to}
              onChange={(e) => e.target.value && setDays({ from: e.target.value < from ? e.target.value : from, to: e.target.value })}
            />
          </label>
          {narrowed && (
            <button type="button" className="st-link" onClick={() => setDays({ from: range.from, to: range.to })}>
              All dates
            </button>
          )}
          <input className="st-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search visits" aria-label="Search visits" />
          <select className="st-select" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort visits">
            {(Object.keys(SORTS) as Sort[]).map((k) => (
              <option key={k} value={k}>
                {SORTS[k].label}
              </option>
            ))}
          </select>
        </div>
      </header>

      {!rows.length ? (
        <p className="st-empty">
          {visits.length
            ? 'No visit matches these dates and filters.'
            : 'No visits yet. When someone opens the site, their visit appears here with what they read and clicked.'}
        </p>
      ) : (
        <div className="st-table-wrap" ref={wrap} style={{ maxHeight }}>
          <table className="st-table">
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">From</th>
                <th scope="col">Place and device</th>
                <th scope="col">Read to</th>
                <th scope="col">Did</th>
                <th scope="col" className="st-num">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => {
                const isOpen = open === v.sid;
                const did = [
                  ...v.contacts,
                  ...v.demos.map((d) => `Tried ${d}`),
                  ...v.cases.map((c) => `Opened ${c}`),
                ];
                return (
                  <Fragment key={v.sid}>
                    <tr className={isOpen ? 'st-visit is-open' : 'st-visit'} data-new={isNew.has(v.sid) ? '' : undefined}>
                      <td>
                        <button type="button" className="st-rowbtn" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : v.sid)}>
                          {fmtWhen.format(new Date(v.start))}
                        </button>
                        {isNew.has(v.sid) && <span className="st-tag st-tag--new">New</span>}
                        {v.returning && <span className="st-tag">Returning</span>}
                      </td>
                      <td>{v.ref ? <span className="st-tag st-tag--ref">{v.ref}</span> : v.source}</td>
                      <td>
                        {[v.city, countryName(v.country)].filter(Boolean).join(', ')}
                        <span className="st-sub">
                          {v.device}, {v.browser}
                          {v.lang === 'Hebrew' ? ', in Hebrew' : ''}
                        </span>
                      </td>
                      <td>{v.readTo ?? '–'}</td>
                      <td>
                        {did.length ? did.slice(0, 4).join(', ') : v.clicks.length ? `${v.clicks.length} clicks` : '–'}
                        <span className="st-sub">
                          {v.pages} {v.pages === 1 ? 'page' : 'pages'}
                        </span>
                      </td>
                      <td className="st-num tnum">{duration(v.seconds)}</td>
                    </tr>
                    {isOpen && (
                      <tr className="st-journey">
                        <td colSpan={6}>
                          <ol>
                            {v.journey.map((step, i) => (
                              <li key={i} data-kind={step.kind}>
                                <span className="tnum st-muted">{fmtTime.format(new Date(step.at))}</span>
                                <span>{step.text}</span>
                              </li>
                            ))}
                          </ol>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/** The filtered visits as a spreadsheet file, one row per visit. */
function downloadCsv(visits: VisitRecord[]) {
  const cols: [string, (v: VisitRecord) => string | number][] = [
    ['When (Israel)', (v) => fmtWhen.format(new Date(v.start))],
    ['Day', (v) => v.day],
    ['Source', (v) => v.source],
    ['Tracking link', (v) => v.ref ?? ''],
    ['Country', (v) => countryName(v.country)],
    ['City', (v) => v.city ?? ''],
    ['Device', (v) => v.device],
    ['Browser', (v) => v.browser],
    ['Language', (v) => v.lang],
    ['Returning', (v) => (v.returning ? 'yes' : 'no')],
    ['Pages', (v) => v.pages],
    ['Seconds in view', (v) => v.seconds],
    ['Read to', (v) => v.readTo ?? ''],
    ['Case studies', (v) => v.cases.join('; ')],
    ['Demos', (v) => v.demos.join('; ')],
    ['Contact', (v) => v.contacts.join('; ')],
    ['Clicks', (v) => v.clicks.length],
  ];
  const cell = (x: string | number) => `"${String(x).replace(/"/g, '""')}"`;
  const lines = [cols.map(([h]) => cell(h)).join(','), ...visits.map((v) => cols.map(([, f]) => cell(f(v))).join(','))];
  // The byte-order mark lets Excel read Hebrew and other non-Latin text correctly.
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `site-visits-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function LinkBuilder({ origin, onClose }: { origin: string; onClose: () => void }) {
  const [name, setName] = useState('');
  const [copied, setCopied] = useState(false);
  const tag = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9א-ת]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  const url = tag ? `${origin}/?ref=${encodeURIComponent(tag)}` : '';

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="st-card st-builder" aria-labelledby="builder-h">
      <header className="st-card__head">
        <h2 id="builder-h">New tracking link</h2>
        <button type="button" className="st-link" onClick={onClose}>
          Close
        </button>
      </header>
      <p className="st-muted">
        Name who you are sending the site to. Their visits will be labelled with that name, so you can see what they
        looked at.
      </p>
      <div className="st-builder__row">
        <label htmlFor="ref-name" className="sr-only">
          Company or person
        </label>
        <input id="ref-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="For example: Monday.com recruiter" autoFocus />
        <output className="st-builder__url">{url || 'The link appears here'}</output>
        <button type="button" className="st-btn" onClick={copy} disabled={!url}>
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
    </section>
  );
}

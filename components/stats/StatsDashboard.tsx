'use client';

import Link from 'next/link';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { Ranked, Summary, Visit } from '@/lib/analytics/aggregate';
import type { StoreKind } from '@/lib/analytics/store';
import { DAILY_CAP } from '@/lib/analytics/types';
import { OWNER } from '@/lib/analytics/client';

/**
 * The private analytics screen. Its one question: who visited, and what did
 * each of them look at? The visits list answers it and is the largest block;
 * the counts, the reading depth and the clicks explain it.
 */

const tz = 'Asia/Jerusalem';
const fmtWhen = new Intl.DateTimeFormat('en-GB', { timeZone: tz, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const fmtTime = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit' });
const fmtDay = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const nf = new Intl.NumberFormat('en-US');

const dayLabel = (iso: string) => fmtDay.format(new Date(`${iso}T00:00:00Z`));

function duration(seconds: number) {
  if (!seconds) return '–';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m ? `${m} m ${String(s).padStart(2, '0')} s` : `${s} s`;
}

function pct(share: number) {
  return `${Math.round(share * 100)}%`;
}

export function StatsDashboard({
  summary,
  periods,
  storage,
  failed,
  origin,
}: {
  summary: Summary;
  periods: number[];
  storage: StoreKind;
  failed: boolean;
  origin: string;
}) {
  const s = summary;
  const [linkOpen, setLinkOpen] = useState(false);
  const [counting, setCounting] = useState(false);

  // Signing in here marks this device as the owner's, so its visits are not counted.
  useEffect(() => {
    try {
      if (localStorage.getItem(OWNER) !== '1') localStorage.setItem(OWNER, '1');
      setCounting(false);
    } catch {
      setCounting(true);
    }
  }, []);

  const finding = useMemo(() => {
    if (!s.visits) return `No visits in the last ${s.days} days yet.`;
    const parts = [`${nf.format(s.visitors)} ${s.visitors === 1 ? 'person' : 'people'} visited in the last ${s.days} days`];
    if (s.caseStudies[0]) parts.push(`the most opened case study is ${s.caseStudies[0].label}`);
    if (s.cvDownloads) parts.push(`${s.cvDownloads} downloaded the CV`);
    return parts.join('; ') + '.';
  }, [s]);

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
            <p className="st-muted">{finding}</p>
          </div>
          <div className="st-title__actions">
            <nav className="st-seg" aria-label="Period">
              {periods.map((p) => (
                <Link key={p} href={`/stats?days=${p}`} aria-current={p === s.days ? 'page' : undefined}>
                  {p} days
                </Link>
              ))}
            </nav>
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
        {s.cappedDays > 0 && (
          <div className="st-notice" role="status">
            <b>
              {s.cappedDays === 1 ? 'One day' : `${s.cappedDays} days`} reached the daily limit.
            </b>{' '}
            To stay on the free plan each day keeps its first {nf.format(DAILY_CAP)} events; later visits on those
            days were not saved.
          </div>
        )}
        {failed && (
          <div className="st-notice" role="alert">
            <b>Could not read the visit data.</b> Check that the Redis store is connected to this project.
          </div>
        )}
        {counting && (
          <div className="st-notice">This browser blocks storage, so your own visits from it may be counted.</div>
        )}

        <section className="st-kpis" aria-label="Totals">
          <Kpi label="Visitors" value={s.visitors} note={s.returningVisitors ? `${s.returningVisitors} came back` : undefined} />
          <Kpi label="Visits" value={s.visits} />
          <Kpi label="Page views" value={s.pageviews} />
          <Kpi label="Median time per visit" text={duration(s.medianSeconds)} />
          <Kpi label="CV downloads" value={s.cvDownloads} />
          <Kpi label="Email and LinkedIn clicks" value={s.emailClicks + s.linkedinClicks} />
        </section>

        <div className="st-row st-row--main">
          <section className="st-card st-visits" aria-labelledby="visits-h">
            <header className="st-card__head">
              <h2 id="visits-h">Visits</h2>
              <span className="st-muted">Newest first. Open a row to see the path through the site.</span>
            </header>
            <VisitsTable visits={s.visits_} />
          </section>

          <div className="st-col">
            <section className="st-card" aria-labelledby="daily-h">
              <header className="st-card__head">
                <h2 id="daily-h">Visitors per day</h2>
                <span className="st-muted">
                  {dayLabel(s.from)} to {dayLabel(s.to)}
                </span>
              </header>
              <DailyColumns daily={s.daily} />
            </section>
            <section className="st-card" aria-labelledby="src-h">
              <header className="st-card__head">
                <h2 id="src-h">Where they came from</h2>
              </header>
              <BarList rows={s.sources} total={s.visits} empty="No visits yet." unit="visits" />
            </section>
          </div>
        </div>

        <div className="st-row st-row--half">
          <section className="st-card" aria-labelledby="clicks-h">
            <header className="st-card__head">
              <h2 id="clicks-h">What they clicked</h2>
              <span className="st-muted">All visits</span>
            </header>
            <BarList rows={s.clicks} empty="No clicks yet." unit="clicks" />
          </section>
          <section className="st-card" aria-labelledby="reach-h">
            <header className="st-card__head">
              <h2 id="reach-h">How far they read the home page</h2>
              <span className="st-muted">Share of {nf.format(s.homeVisits)} home page visits</span>
            </header>
            <Reach rows={s.reach} empty={!s.homeVisits} />
          </section>
        </div>

        <div className="st-row st-row--thirds">
          <section className="st-card" aria-labelledby="cases-h">
            <header className="st-card__head">
              <h2 id="cases-h">Case studies opened</h2>
            </header>
            <BarList rows={s.caseStudies} empty="No case study opened yet." unit="opens" />
          </section>
          <section className="st-card" aria-labelledby="demo-h">
            <header className="st-card__head">
              <h2 id="demo-h">Demos used</h2>
              <span className="st-muted">{nf.format(s.demoUses)} actions</span>
            </header>
            <BarList rows={s.demo} empty="Nobody has tried a demo yet." unit="uses" />
          </section>
          <section className="st-card" aria-labelledby="place-h">
            <header className="st-card__head">
              <h2 id="place-h">Countries and devices</h2>
            </header>
            <BarList rows={s.countries} total={s.visits} empty="No visits yet." unit="visits" />
            <div className="st-split">
              <BarList rows={s.devices} total={s.visits} empty="" unit="visits" />
            </div>
          </section>
        </div>

        <section className="st-card" aria-labelledby="refs-h">
          <header className="st-card__head">
            <h2 id="refs-h">Tracking links</h2>
            <span className="st-muted">Visits that arrived through a link you made for someone</span>
          </header>
          {s.refs.length ? (
            <BarList rows={s.refs} unit="visits" empty="" />
          ) : (
            <p className="st-empty">
              No tracking links used yet. Make one with <b>New tracking link</b> and send it instead of the plain
              address; every visit through it is labelled here.
            </p>
          )}
        </section>

        <p className="st-foot st-muted">
          Counted without cookies, names or IP addresses: a random id in the visitor’s browser, the country and
          city from the network, and what was clicked. Visitors who ask not to be tracked are not counted, and
          neither are your own visits from this browser.
        </p>
      </main>
    </div>
  );
}

function Kpi({ label, value, text, note }: { label: string; value?: number; text?: string; note?: string }) {
  return (
    <div className="st-kpi">
      <span className="st-kpi__label">{label}</span>
      <span className="st-kpi__value tnum">{text ?? nf.format(value ?? 0)}</span>
      {note && <span className="st-kpi__note">{note}</span>}
    </div>
  );
}

function BarList({ rows, total, empty, unit }: { rows: Ranked[]; total?: number; empty: string; unit: string }) {
  if (!rows.length) return empty ? <p className="st-empty">{empty}</p> : null;
  const max = Math.max(...rows.map((r) => r.count));
  return (
    <ul className="st-bars">
      {rows.map((r) => (
        <li key={r.label} title={`${r.label}: ${nf.format(r.count)} ${unit}`}>
          <span className="st-bars__label">
            {r.label}
            {r.detail && <span className="st-muted"> in {r.detail}</span>}
          </span>
          <span className="st-bars__value tnum">
            {nf.format(r.count)}
            {total ? <span className="st-muted"> {pct(r.count / total)}</span> : null}
          </span>
          <span className="st-bars__track" aria-hidden="true">
            <i style={{ width: `${(r.count / max) * 100}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function Reach({ rows, empty }: { rows: Summary['reach']; empty: boolean }) {
  if (empty) return <p className="st-empty">Nobody has opened the home page yet.</p>;
  return (
    <ol className="st-reach">
      {rows.map((r) => (
        <li key={r.id} title={`${r.label}: ${r.visits} visits`}>
          <span>{r.label}</span>
          <span className="st-reach__track" aria-hidden="true">
            <i style={{ width: `${r.share * 100}%` }} />
          </span>
          <span className="tnum">{pct(r.share)}</span>
        </li>
      ))}
    </ol>
  );
}

/** Visitors per day as columns, one series, with a tooltip per day. */
function DailyColumns({ daily }: { daily: Summary['daily'] }) {
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

  const height = 168;
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
    <div className="st-chart" ref={ref}>
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
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                tabIndex={-1}
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
        <div className="st-tip" style={{ left: Math.min(width - 150, Math.max(0, pad.left + hover * slot + slot / 2 - 70)) }}>
          {dayLabel(h.day)}: {h.visitors} {h.visitors === 1 ? 'visitor' : 'visitors'}, {h.visits} {h.visits === 1 ? 'visit' : 'visits'}
        </div>
      )}
    </div>
  );
}

function VisitsTable({ visits }: { visits: Visit[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!visits.length) {
    return (
      <p className="st-empty">
        No visits yet. When someone opens the site, their visit appears here with what they read and clicked.
      </p>
    );
  }
  return (
    <div className="st-table-wrap">
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
          {visits.map((v) => {
            const isOpen = open === v.sid;
            return (
              <Fragment key={v.sid}>
                <tr className={isOpen ? 'is-open' : undefined}>
                  <td>
                    <button
                      type="button"
                      className="st-rowbtn"
                      aria-expanded={isOpen}
                      onClick={() => setOpen(isOpen ? null : v.sid)}
                    >
                      {fmtWhen.format(new Date(v.start))}
                    </button>
                    {v.returning && <span className="st-tag">Returning</span>}
                  </td>
                  <td>{v.ref ? <span className="st-tag st-tag--ref">{v.ref}</span> : v.source}</td>
                  <td>
                    {v.place}
                    <span className="st-sub">{v.device}</span>
                  </td>
                  <td>{v.readTo ?? '–'}</td>
                  <td>
                    {v.highlights.length ? v.highlights.join(', ') : v.clicks ? `${v.clicks} clicks` : '–'}
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
  );
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
        Name who you are sending the site to. Their visits will be labelled with that name, so you can see what
        they looked at.
      </p>
      <div className="st-builder__row">
        <label htmlFor="ref-name" className="sr-only">
          Company or person
        </label>
        <input
          id="ref-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="For example: Monday.com recruiter"
          autoFocus
        />
        <output className="st-builder__url">{url || 'The link appears here'}</output>
        <button type="button" className="st-btn" onClick={copy} disabled={!url}>
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
    </section>
  );
}

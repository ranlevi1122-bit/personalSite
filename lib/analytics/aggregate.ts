import { projects } from '@/data/portfolioData';
import { dayOf } from './store';
import { DAILY_CAP, type StoredEvent } from './types';

/**
 * Turns raw events into the dashboard's answers. Everything is computed from
 * the events in the chosen period, so every total agrees with its parts.
 */

/** The home page's sections in reading order, as named by data-section. */
export const HOME_SECTIONS = [
  { id: 'hero', label: 'Hero' },
  { id: 'services', label: 'What I do' },
  { id: 'results', label: 'Results' },
  { id: 'demo', label: 'Scheduler demo' },
  { id: 'work', label: 'Case studies' },
  { id: 'process', label: 'Process' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
] as const;

/** Section names on the case-study pages, for clicks and journeys. */
const CASE_SECTIONS: Record<string, string> = {
  'case-top': 'Case study heading',
  'case-demo': 'Case study demo',
  'case-story': 'Case study text',
};

/** The demos by the name their events start with. */
const DEMO_NAMES: Record<string, string> = {
  scheduler: 'Scheduler',
  booking: 'Bookings',
  agents: 'AI analyst',
  safebuild: 'SafeBuild',
};

/** "scheduler: board staffed" reads as "Scheduler: board staffed". */
function demoLabel(raw: string) {
  const [key, ...rest] = raw.split(': ');
  const name = DEMO_NAMES[key] ?? key;
  return rest.length ? `${name}: ${rest.join(': ')}` : name;
}

const sectionLabel = (id: string) => HOME_SECTIONS.find((s) => s.id === id)?.label ?? CASE_SECTIONS[id] ?? id;

export interface Ranked {
  label: string;
  count: number;
  detail?: string;
}

export interface JourneyStep {
  at: number;
  kind: StoredEvent['n'];
  text: string;
}

export interface Visit {
  sid: string;
  vid: string;
  start: number;
  seconds: number;
  source: string;
  ref?: string;
  place: string;
  device: string;
  pages: number;
  /** The furthest home section reached, in reading order. */
  readTo?: string;
  clicks: number;
  returning: boolean;
  /** What they opened or pressed, most telling first, for the row summary. */
  highlights: string[];
  journey: JourneyStep[];
}

export interface Summary {
  days: number;
  from: string;
  to: string;
  visitors: number;
  returningVisitors: number;
  visits: number;
  pageviews: number;
  /** Median seconds in view per visit. */
  medianSeconds: number;
  cvDownloads: number;
  emailClicks: number;
  linkedinClicks: number;
  demoUses: number;
  daily: { day: string; visitors: number; visits: number }[];
  /** Days that reached the daily cap, after which that day's events were not kept. */
  cappedDays: number;
  sources: Ranked[];
  refs: Ranked[];
  clicks: Ranked[];
  reach: { id: string; label: string; visits: number; share: number }[];
  homeVisits: number;
  caseStudies: Ranked[];
  demo: Ranked[];
  countries: Ranked[];
  devices: Ranked[];
  visits_: Visit[];
}

const titleBySlug = new Map(projects.map((p) => [`/projects/${p.slug}`, p.shortTitle]));

function rank(map: Map<string, number>, limit = 8, details?: Map<string, string>): Ranked[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, count]) => ({ label, count, detail: details?.get(label) }));
}

const bump = (map: Map<string, number>, key: string | undefined, by = 1) => {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + by);
};

const median = (values: number[]) => {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
};

function describeClick(e: StoredEvent) {
  const h = e.h ?? '';
  if (h.startsWith('mailto:')) return 'Email link';
  if (h.endsWith('.pdf')) return 'CV download';
  if (h.includes('linkedin.com')) return 'LinkedIn';
  if (h.includes('github.com')) return 'GitHub';
  if (h.startsWith('tel:')) return 'Phone number';
  return e.l ?? '(no label)';
}

function sourceOf(e: StoredEvent) {
  if (e.ref) return `Link: ${e.ref}`;
  if (!e.src || e.src === 'direct') return 'Direct or unknown';
  return e.src;
}

export function summarise(events: StoredEvent[], days: number): Summary {
  const now = Date.now();
  const dayList = Array.from({ length: days }, (_, i) => dayOf(now - i * 86_400_000)).reverse();

  const sessions = new Map<string, StoredEvent[]>();
  const eventsPerDay = new Map<string, number>();
  for (const e of events) {
    sessions.set(e.sid, [...(sessions.get(e.sid) ?? []), e]);
    eventsPerDay.set(dayOf(e.at), (eventsPerDay.get(dayOf(e.at)) ?? 0) + 1);
  }

  const visitsByVisitor = new Map<string, number>();
  for (const evs of sessions.values()) bump(visitsByVisitor, evs[0].vid);

  const sources = new Map<string, number>();
  const refs = new Map<string, number>();
  const clicks = new Map<string, number>();
  const clickWhere = new Map<string, string>();
  const reach = new Map<string, number>();
  const caseViews = new Map<string, number>();
  const demo = new Map<string, number>();
  const countries = new Map<string, number>();
  const devices = new Map<string, number>();
  const dailyVisitors = new Map<string, Set<string>>();
  const dailyVisits = new Map<string, number>();

  let homeVisits = 0;
  let cvDownloads = 0;
  let emailClicks = 0;
  let linkedinClicks = 0;
  let demoUses = 0;
  const secondsPerVisit: number[] = [];
  const visits: Visit[] = [];

  for (const [sid, evs] of sessions) {
    evs.sort((a, b) => a.at - b.at);
    const first = evs[0];
    const day = dayOf(first.at);
    dailyVisitors.set(day, (dailyVisitors.get(day) ?? new Set()).add(first.vid));
    bump(dailyVisits, day);
    bump(sources, sourceOf(first));
    if (first.ref) bump(refs, first.ref);
    bump(countries, first.country ?? 'Unknown');
    bump(devices, first.device);

    const sectionsSeen = new Set<string>();
    let pages = 0;
    let clickCount = 0;
    let seconds = 0;
    let sawHome = false;
    const highlights = new Set<string>();
    const journey: JourneyStep[] = [];

    for (const e of evs) {
      if (e.n === 'pageview') {
        pages++;
        if (e.p === '/') sawHome = true;
        const title = titleBySlug.get(e.p);
        if (title) {
          bump(caseViews, title);
          highlights.add(`Opened ${title}`);
        }
        journey.push({ at: e.at, kind: 'pageview', text: e.p === '/' ? 'Opened the home page' : `Opened ${title ?? e.p}` });
      } else if (e.n === 'section' && e.l) {
        if (e.p === '/') sectionsSeen.add(e.l);
        journey.push({ at: e.at, kind: 'section', text: `Read ${sectionLabel(e.l)}` });
      } else if (e.n === 'click') {
        clickCount++;
        const what = describeClick(e);
        bump(clicks, what);
        if (e.s && !clickWhere.has(what)) clickWhere.set(what, sectionLabel(e.s));
        if (what === 'CV download') cvDownloads++;
        if (what === 'Email link') emailClicks++;
        if (what === 'LinkedIn') linkedinClicks++;
        if (['CV download', 'Email link', 'LinkedIn', 'GitHub', 'Phone number'].includes(what)) highlights.add(what);
        journey.push({ at: e.at, kind: 'click', text: `Clicked “${what}”` });
      } else if (e.n === 'demo' && e.l) {
        demoUses++;
        bump(demo, demoLabel(e.l));
        highlights.add(`Tried the ${demoLabel(e.l.split(': ')[0])} demo`);
        journey.push({ at: e.at, kind: 'demo', text: demoLabel(e.l) });
      } else if (e.n === 'leave' && e.v) {
        seconds += e.v;
      } else if (e.n === 'scroll' && e.v === 100) {
        journey.push({ at: e.at, kind: 'scroll', text: 'Reached the end of the page' });
      }
    }

    if (sawHome) {
      homeVisits++;
      for (const id of sectionsSeen) bump(reach, id);
    }
    const capped = Math.min(seconds, 60 * 60);
    if (capped > 0) secondsPerVisit.push(capped);
    const readTo = [...HOME_SECTIONS].reverse().find((s) => sectionsSeen.has(s.id))?.label;

    visits.push({
      sid,
      vid: first.vid,
      start: first.at,
      seconds: capped,
      source: sourceOf(first),
      ref: first.ref,
      place: [first.city, first.country].filter(Boolean).join(', ') || 'Unknown',
      device: `${first.device}, ${first.browser}`,
      pages,
      readTo,
      clicks: clickCount,
      returning: (visitsByVisitor.get(first.vid) ?? 0) > 1,
      highlights: [...highlights].slice(0, 4),
      journey,
    });
  }

  const visitors = new Set(events.map((e) => e.vid));
  const returningVisitors = [...visitsByVisitor.values()].filter((n) => n > 1).length;

  return {
    days,
    from: dayList[0],
    to: dayList[dayList.length - 1],
    visitors: visitors.size,
    returningVisitors,
    visits: sessions.size,
    pageviews: events.filter((e) => e.n === 'pageview').length,
    medianSeconds: median(secondsPerVisit),
    cvDownloads,
    emailClicks,
    linkedinClicks,
    demoUses,
    daily: dayList.map((day) => ({ day, visitors: dailyVisitors.get(day)?.size ?? 0, visits: dailyVisits.get(day) ?? 0 })),
    cappedDays: [...eventsPerDay.values()].filter((n) => n >= DAILY_CAP).length,
    sources: rank(sources),
    refs: rank(refs, 20),
    clicks: rank(clicks, 10, clickWhere),
    reach: HOME_SECTIONS.map((s) => ({
      id: s.id,
      label: s.label,
      visits: reach.get(s.id) ?? 0,
      share: homeVisits ? (reach.get(s.id) ?? 0) / homeVisits : 0,
    })),
    homeVisits,
    caseStudies: rank(caseViews),
    demo: rank(demo),
    countries: rank(countries, 6),
    devices: rank(devices, 3),
    visits_: visits.sort((a, b) => b.start - a.start).slice(0, 60),
  };
}

import { projects } from '@/data/portfolioData';
import { TIME_ZONE, dayOf, type StoredEvent } from './types';

/**
 * Turns raw events into visits, and visits into the dashboard's answers.
 *
 * The server folds events into one record per visit; the dashboard filters
 * those records and computes every figure from what is left, so every total
 * agrees with its parts and every filter applies to every panel. Nothing here
 * touches storage, so it runs in the browser as well.
 */

/* -------------------------------------------------------------------------- */
/*  Names                                                                     */
/* -------------------------------------------------------------------------- */

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
  launch: 'Launch Engine',
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

// Case pages in both languages count as the same case study.
const titleBySlug = new Map(
  projects.flatMap((p) => [
    [`/projects/${p.slug}`, p.shortTitle],
    [`/he/projects/${p.slug}`, p.shortTitle],
  ]),
);
const isHome = (path: string) => path === '/' || path === '/he';

/** Clicks that reach out to Ran. GitHub is interest, not contact. */
export const CONTACT_KINDS = ['CV download', 'Email link', 'LinkedIn', 'Phone number'] as const;

function describeClick(e: StoredEvent) {
  const h = e.h ?? '';
  if (h.startsWith('mailto:')) return 'Email link';
  if (h.endsWith('.pdf')) return 'CV download';
  if (h.includes('linkedin.com')) return 'LinkedIn';
  if (h.includes('github.com')) return 'GitHub';
  if (h.startsWith('tel:')) return 'Phone number';
  return e.l ?? '(no label)';
}

/** Where a visit came from, by channel rather than by host name. */
function channelOf(e: StoredEvent) {
  if (e.ref) return `Link: ${e.ref}`;
  const s = (e.src ?? '').toLowerCase();
  if (!s || s === 'direct') return 'Direct or unknown';
  const known: [RegExp, string][] = [
    [/linkedin|lnkd\.in/, 'LinkedIn'],
    [/(^|\.)google\./, 'Google'],
    [/bing\./, 'Bing'],
    [/duckduckgo/, 'DuckDuckGo'],
    [/chatgpt|openai/, 'ChatGPT'],
    [/perplexity/, 'Perplexity'],
    [/facebook|fb\.(com|me)/, 'Facebook'],
    [/instagram/, 'Instagram'],
    [/(^|\.)t\.co$|twitter|(^|\.)x\.com/, 'X'],
    [/github/, 'GitHub'],
    [/whatsapp|wa\.me/, 'WhatsApp'],
  ];
  return known.find(([re]) => re.test(s))?.[1] ?? s.replace(/^www\./, '');
}

/* -------------------------------------------------------------------------- */
/*  Visits                                                                    */
/* -------------------------------------------------------------------------- */

export interface JourneyStep {
  at: number;
  kind: StoredEvent['n'];
  text: string;
}

export interface VisitRecord {
  sid: string;
  vid: string;
  start: number;
  /** Israel day, YYYY-MM-DD. */
  day: string;
  /** Israel hour, 0–23, and weekday, 0 = Sunday. */
  hour: number;
  weekday: number;
  /** Seconds the pages were actually in view, capped at an hour. */
  seconds: number;
  source: string;
  ref?: string;
  /** Two-letter country code, or "Unknown". */
  country: string;
  city?: string;
  device: StoredEvent['device'];
  browser: string;
  lang: 'English' | 'Hebrew';
  pages: number;
  /** Case studies opened, by short title. */
  cases: string[];
  sawHome: boolean;
  /** Home sections that came into view, by id. */
  sections: string[];
  /** The furthest home section reached, in reading order. */
  readTo?: string;
  clicks: { what: string; where?: string }[];
  /** Demos used, by name, and every action taken in them. */
  demos: string[];
  demoActions: string[];
  /** Contact clicks made, by kind. */
  contacts: string[];
  reachedEnd: boolean;
  /** This browser had visited before, within the data loaded. */
  returning: boolean;
  journey: JourneyStep[];
}

const clockParts = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, hour: 'numeric', hourCycle: 'h23', weekday: 'short' });
const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** One record per visit, newest first, with returning visitors marked. */
export function buildVisits(events: StoredEvent[], journeySteps = 60): VisitRecord[] {
  const sessions = new Map<string, StoredEvent[]>();
  for (const e of events) {
    const list = sessions.get(e.sid);
    if (list) list.push(e);
    else sessions.set(e.sid, [e]);
  }

  const visits: VisitRecord[] = [];
  for (const [sid, evs] of sessions) {
    evs.sort((a, b) => a.at - b.at);
    const first = evs[0];
    const parts = clockParts.formatToParts(new Date(first.at));
    const sectionsSeen = new Set<string>();
    const cases = new Set<string>();
    const demos = new Set<string>();
    const demoActions: string[] = [];
    const contacts = new Set<string>();
    const clicks: VisitRecord['clicks'] = [];
    const journey: JourneyStep[] = [];
    let pages = 0;
    let seconds = 0;
    let sawHome = false;
    let hebrew = false;
    let reachedEnd = false;

    for (const e of evs) {
      if (e.n === 'pageview') {
        pages++;
        if (pages === 1) hebrew = e.p === '/he' || e.p.startsWith('/he/');
        if (isHome(e.p)) sawHome = true;
        const title = titleBySlug.get(e.p);
        if (title) cases.add(title);
        const where = e.p.startsWith('/he') ? ' in Hebrew' : '';
        journey.push({ at: e.at, kind: 'pageview', text: isHome(e.p) ? `Opened the home page${where}` : `Opened ${title ?? e.p}${where}` });
      } else if (e.n === 'section' && e.l) {
        if (isHome(e.p)) sectionsSeen.add(e.l);
        journey.push({ at: e.at, kind: 'section', text: `Read ${sectionLabel(e.l)}` });
      } else if (e.n === 'click') {
        const what = describeClick(e);
        clicks.push({ what, where: e.s ? sectionLabel(e.s) : undefined });
        if ((CONTACT_KINDS as readonly string[]).includes(what) || what === 'GitHub') contacts.add(what);
        journey.push({ at: e.at, kind: 'click', text: `Clicked “${what}”` });
      } else if (e.n === 'demo' && e.l) {
        demos.add(demoLabel(e.l.split(': ')[0]));
        demoActions.push(demoLabel(e.l));
        journey.push({ at: e.at, kind: 'demo', text: demoLabel(e.l) });
      } else if (e.n === 'leave' && e.v) {
        seconds += e.v;
      } else if (e.n === 'scroll' && e.v === 100) {
        reachedEnd = true;
        journey.push({ at: e.at, kind: 'scroll', text: 'Reached the end of the page' });
      }
    }

    visits.push({
      sid,
      vid: first.vid,
      start: first.at,
      day: dayOf(first.at),
      hour: Number(parts.find((p) => p.type === 'hour')?.value ?? 0) % 24,
      weekday: WEEKDAY_INDEX[parts.find((p) => p.type === 'weekday')?.value ?? 'Sun'] ?? 0,
      seconds: Math.round(Math.min(seconds, 60 * 60)),
      source: channelOf(first),
      ref: first.ref,
      country: first.country ?? 'Unknown',
      city: first.city,
      device: first.device,
      browser: first.browser,
      lang: hebrew ? 'Hebrew' : 'English',
      pages,
      cases: [...cases],
      sawHome,
      sections: [...sectionsSeen],
      readTo: sawHome ? [...HOME_SECTIONS].reverse().find((s) => sectionsSeen.has(s.id))?.label : undefined,
      clicks,
      demos: [...demos],
      demoActions,
      contacts: [...contacts],
      reachedEnd,
      returning: false,
      journey: journey.slice(0, journeySteps),
    });
  }

  // A visit is returning when the same browser came before it.
  const seen = new Set<string>();
  for (const v of visits.sort((a, b) => a.start - b.start)) {
    v.returning = seen.has(v.vid);
    seen.add(v.vid);
  }
  return visits.reverse();
}

/* -------------------------------------------------------------------------- */
/*  Filters                                                                   */
/* -------------------------------------------------------------------------- */

export const OUTCOMES = [
  'Contacted',
  'Downloaded the CV',
  'Tried a demo',
  'Opened a case study',
  'Read to the end',
  'Stayed 30 s or more',
  'Left within 10 s',
] as const;
export type Outcome = (typeof OUTCOMES)[number];

export const FILTER_KEYS = ['source', 'country', 'device', 'lang', 'visitor', 'page', 'outcome', 'click'] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];
export type Filters = Partial<Record<FilterKey, string>>;

export const isContact = (v: VisitRecord) => v.contacts.some((c) => (CONTACT_KINDS as readonly string[]).includes(c));
const bounced = (v: VisitRecord) => v.pages <= 1 && v.seconds < 10 && !v.clicks.length && !v.demoActions.length;
/** A visit that did more than glance: 30 seconds, a demo, or a contact. */
export const isEngaged = (v: VisitRecord) => v.seconds >= 30 || v.demos.length > 0 || isContact(v);

export function hasOutcome(v: VisitRecord, o: string) {
  switch (o as Outcome) {
    case 'Contacted':
      return isContact(v);
    case 'Downloaded the CV':
      return v.contacts.includes('CV download');
    case 'Tried a demo':
      return v.demos.length > 0;
    case 'Opened a case study':
      return v.cases.length > 0;
    case 'Read to the end':
      return v.reachedEnd;
    case 'Stayed 30 s or more':
      return v.seconds >= 30;
    case 'Left within 10 s':
      return bounced(v);
    default:
      return true;
  }
}

export function matches(v: VisitRecord, f: Filters) {
  if (f.source && v.source !== f.source) return false;
  if (f.country && v.country !== f.country) return false;
  if (f.device && v.device !== f.device) return false;
  if (f.lang && v.lang !== f.lang) return false;
  if (f.visitor && (f.visitor === 'Returning') !== v.returning) return false;
  if (f.page && !(f.page === 'Home page' ? v.sawHome : v.cases.includes(f.page))) return false;
  if (f.outcome && !hasOutcome(v, f.outcome)) return false;
  if (f.click && !v.clicks.some((c) => c.what === f.click)) return false;
  return true;
}

/* -------------------------------------------------------------------------- */
/*  Figures                                                                   */
/* -------------------------------------------------------------------------- */

export interface Ranked {
  label: string;
  count: number;
  detail?: string;
}

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAYPARTS = [
  { label: 'Night, 00–06', from: 0, to: 6 },
  { label: 'Morning, 06–12', from: 6, to: 12 },
  { label: 'Afternoon, 12–18', from: 12, to: 18 },
  { label: 'Evening, 18–24', from: 18, to: 24 },
];

export interface Summary {
  visits: number;
  visitors: number;
  returningVisitors: number;
  pageviews: number;
  medianSeconds: number;
  engaged: number;
  contacted: number;
  cv: number;
  email: number;
  linkedin: number;
  demoVisits: number;
  caseVisits: number;
  daily: { day: string; visitors: number; visits: number }[];
  sources: Ranked[];
  refs: Ranked[];
  clicks: Ranked[];
  reach: { id: string; label: string; visits: number; share: number }[];
  homeVisits: number;
  cases: Ranked[];
  demos: Ranked[];
  demoActions: Ranked[];
  countries: Ranked[];
  devices: Ranked[];
  langs: Ranked[];
  weekdays: Ranked[];
  dayparts: Ranked[];
  /** How far visits went, each step a share of all visits. */
  funnel: Ranked[];
}

const bump = (map: Map<string, number>, key: string | undefined, by = 1) => {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + by);
};

function rank(map: Map<string, number>, limit = 8, details?: Map<string, string>): Ranked[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, count]) => ({ label, count, detail: details?.get(label) }));
}

export const median = (values: number[]) => {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
};

/** Median seconds over the visits that were in view at all. */
export const medianTime = (visits: VisitRecord[]) => median(visits.map((v) => v.seconds).filter((s) => s > 0));

export function summarise(visits: VisitRecord[], days: string[]): Summary {
  const sources = new Map<string, number>();
  const refs = new Map<string, number>();
  const clicks = new Map<string, number>();
  const clickWhere = new Map<string, string>();
  const reach = new Map<string, number>();
  const cases = new Map<string, number>();
  const demos = new Map<string, number>();
  const demoActions = new Map<string, number>();
  const countries = new Map<string, number>();
  const devices = new Map<string, number>();
  const langs = new Map<string, number>();
  const dailyVisitors = new Map<string, Set<string>>();
  const dailyVisits = new Map<string, number>();
  const weekdays = new Map<string, number>();
  const dayparts = new Map<string, number>();
  const visitors = new Set<string>();
  const returning = new Set<string>();

  let pageviews = 0;
  let homeVisits = 0;
  let engaged = 0;
  let contacted = 0;
  let cv = 0;
  let email = 0;
  let linkedin = 0;
  let demoVisits = 0;
  let caseVisits = 0;
  let pastOpening = 0;

  for (const v of visits) {
    visitors.add(v.vid);
    if (v.returning) returning.add(v.vid);
    dailyVisitors.set(v.day, (dailyVisitors.get(v.day) ?? new Set()).add(v.vid));
    bump(dailyVisits, v.day);
    bump(weekdays, WEEKDAYS[v.weekday]);
    bump(dayparts, DAYPARTS.find((d) => v.hour >= d.from && v.hour < d.to)?.label);
    bump(sources, v.source);
    if (v.ref) bump(refs, v.ref);
    bump(countries, v.country);
    bump(devices, v.device);
    bump(langs, v.lang);
    pageviews += v.pages;

    if (v.sawHome) {
      homeVisits++;
      for (const id of v.sections) bump(reach, id);
    }
    if (v.pages > 1 || v.sections.some((s) => s !== 'hero') || v.clicks.length || v.demoActions.length) pastOpening++;
    for (const c of v.cases) bump(cases, c);
    if (v.cases.length) caseVisits++;
    for (const d of v.demos) bump(demos, d);
    for (const a of v.demoActions) bump(demoActions, a);
    if (v.demos.length) demoVisits++;
    for (const c of v.clicks) {
      bump(clicks, c.what);
      if (c.where && !clickWhere.has(c.what)) clickWhere.set(c.what, c.where);
    }
    if (isEngaged(v)) engaged++;
    if (isContact(v)) contacted++;
    if (v.contacts.includes('CV download')) cv++;
    if (v.contacts.includes('Email link')) email++;
    if (v.contacts.includes('LinkedIn')) linkedin++;
  }

  const fixed = (labels: string[], map: Map<string, number>) => labels.map((label) => ({ label, count: map.get(label) ?? 0 }));

  return {
    visits: visits.length,
    visitors: visitors.size,
    returningVisitors: returning.size,
    pageviews,
    medianSeconds: medianTime(visits),
    engaged,
    contacted,
    cv,
    email,
    linkedin,
    demoVisits,
    caseVisits,
    daily: days.map((day) => ({ day, visitors: dailyVisitors.get(day)?.size ?? 0, visits: dailyVisits.get(day) ?? 0 })),
    sources: rank(sources, 10),
    refs: rank(refs, 20),
    clicks: rank(clicks, 10, clickWhere),
    reach: HOME_SECTIONS.map((s) => ({
      id: s.id,
      label: s.label,
      visits: reach.get(s.id) ?? 0,
      share: homeVisits ? (reach.get(s.id) ?? 0) / homeVisits : 0,
    })),
    homeVisits,
    cases: rank(cases),
    demos: rank(demos),
    demoActions: rank(demoActions, 8),
    countries: rank(countries, 8),
    devices: rank(devices, 3),
    langs: rank(langs, 2),
    weekdays: fixed(WEEKDAYS, weekdays),
    dayparts: fixed(
      DAYPARTS.map((d) => d.label),
      dayparts,
    ),
    funnel: [
      { label: 'Visited', count: visits.length },
      { label: 'Went past the opening', count: pastOpening },
      { label: 'Opened a case study', count: caseVisits },
      { label: 'Tried a demo', count: demoVisits },
      { label: 'Contacted you', count: contacted },
    ],
  };
}

/* -------------------------------------------------------------------------- */
/*  Conclusions                                                               */
/* -------------------------------------------------------------------------- */

export interface Insight {
  /** good: worth keeping; watch: worth fixing; note: worth knowing. */
  tone: 'good' | 'watch' | 'note';
  title: string;
  detail: string;
  /** What to do about it, when there is something to do. */
  action?: string;
}

/** Below this many visits, a share is an anecdote, not a finding. */
const ENOUGH = 5;

export const share = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0);

export function duration(seconds: number) {
  if (!seconds) return '–';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m ? `${m} m ${String(s).padStart(2, '0')} s` : `${s} s`;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/**
 * Plain findings from the filtered visits, most useful first. Each states its
 * numbers, so a reader can judge how much weight it carries, and each holds
 * back until there are enough visits behind it.
 */
export function conclude(visits: VisitRecord[], cur: Summary, prev: Summary | null, periodName: string): Insight[] {
  const out: (Insight & { weight: number })[] = [];

  if (cur.visits < ENOUGH) {
    return [
      {
        tone: 'note',
        title: cur.visits ? `Only ${plural(cur.visits, 'visit')} so far` : 'No visits in this view',
        detail: cur.visits
          ? `Conclusions start at ${ENOUGH} visits. Widen the dates or clear a filter to see them.`
          : 'Nothing matches the dates and filters chosen.',
      },
    ];
  }

  // Traffic against the period before.
  if (prev && prev.visitors >= ENOUGH) {
    const change = Math.round(((cur.visitors - prev.visitors) / prev.visitors) * 100);
    if (Math.abs(change) >= 15) {
      out.push({
        weight: 72,
        tone: change > 0 ? 'good' : 'watch',
        title: `Visitors ${change > 0 ? 'up' : 'down'} ${Math.abs(change)}% on the ${periodName} before`,
        detail: `${cur.visitors} visitors against ${prev.visitors}.`,
        action: change < 0 ? 'Traffic follows sharing: a post or a round of applications with tracking links brings it back.' : undefined,
      });
    }
  }

  // How many visits reach out.
  const contactRate = share(cur.contacted, cur.visits);
  out.push({
    weight: 90,
    tone: cur.contacted ? 'good' : 'watch',
    title: cur.contacted ? `${contactRate}% of visits ended in contact` : 'No visit has reached out yet',
    detail: cur.contacted
      ? `${plural(cur.contacted, 'visit')} of ${cur.visits}: ${[
          cur.cv && `${cur.cv} downloaded the CV`,
          cur.email && `${cur.email} opened an email`,
          cur.linkedin && `${cur.linkedin} went to LinkedIn`,
        ]
          .filter(Boolean)
          .join(', ')}.`
      : `${cur.visits} visits, none clicked the CV, email, phone or LinkedIn.`,
    action: !cur.contacted ? 'Put the CV and email buttons where most readers stop (see the reading depth below).' : undefined,
  });

  // The channel that works best, against the one that brings the most. Tracking
  // links are people, not channels, and have their own findings below.
  const bySource = new Map<string, VisitRecord[]>();
  for (const v of visits) if (!v.ref) bySource.set(v.source, [...(bySource.get(v.source) ?? []), v]);
  const channels = [...bySource.entries()].filter(([, vs]) => vs.length >= ENOUGH);
  const rate = (vs: VisitRecord[]) => share(vs.filter(isEngaged).length, vs.length);
  if (channels.length >= 2) {
    const biggest = [...channels].sort((a, b) => b[1].length - a[1].length)[0];
    const best = [...channels].sort((a, b) => rate(b[1]) - rate(a[1]) || b[1].length - a[1].length)[0];
    const gap = rate(best[1]) - rate(biggest[1]);
    out.push(
      best[0] !== biggest[0] && gap >= 10
        ? {
            weight: 80,
            tone: 'note',
            title: `${best[0]} brings better visits than ${biggest[0]}`,
            detail: `${rate(best[1])}% of the ${best[1].length} visits from ${best[0]} engage, against ${rate(biggest[1])}% from ${biggest[0]}, which brings ${share(biggest[1].length, cur.visits)}% of all visits.`,
            action: `Share the site more where ${best[0]} readers are.`,
          }
        : {
            weight: 50,
            tone: 'note',
            title: `${biggest[0]} brings the most visits`,
            detail: `${share(biggest[1].length, cur.visits)}% of visits, ${rate(biggest[1])}% of them engaged; no channel with ${ENOUGH} or more visits does clearly better.`,
          },
    );
  } else if (bySource.size) {
    const top = [...bySource.entries()].sort((a, b) => b[1].length - a[1].length)[0];
    out.push({
      weight: 40,
      tone: 'note',
      title: `${top[0]} brings ${share(top[1].length, cur.visits)}% of visits`,
      detail: `Other channels have under ${ENOUGH} visits each, too few to compare.`,
    });
  }

  // Where readers of the home page stop.
  if (cur.homeVisits >= ENOUGH) {
    let drop = { from: '', to: '', loss: 0, at: 0 };
    for (let i = 1; i < cur.reach.length; i++) {
      const loss = cur.reach[i - 1].share - cur.reach[i].share;
      if (loss > drop.loss) drop = { from: cur.reach[i - 1].label, to: cur.reach[i].label, loss, at: cur.reach[i].share };
    }
    const work = cur.reach.find((r) => r.id === 'work');
    if (drop.loss >= 0.15) {
      out.push({
        weight: 75,
        tone: 'watch',
        title: `Most readers are lost between ${drop.from} and ${drop.to}`,
        detail: `${Math.round(drop.loss * 100)} points drop there: ${Math.round(drop.at * 100)}% of home page visits reach ${drop.to}${
          work && work.label !== drop.to ? `, and ${Math.round(work.share * 100)}% reach the case studies` : ''
        }.`,
        action: `Shorten ${drop.from}, or give it a clear link onward to ${drop.to}.`,
      });
    }
  }

  // What the case studies and demos do for a visit.
  if (cur.cases[0]) {
    out.push({
      weight: 55,
      tone: 'note',
      title: `${cur.cases[0].label} is the case study people open most`,
      detail: `${plural(cur.cases[0].count, 'visit')}${cur.cases[1] ? `; next is ${cur.cases[1].label} with ${cur.cases[1].count}` : ''}. ${share(cur.caseVisits, cur.visits)}% of visits open at least one.`,
      action: cur.cases.length > 1 && cur.cases[0].count >= cur.cases[1].count * 2 ? `Lead with ${cur.cases[0].label} on the home page.` : undefined,
    });
  }
  const tried = visits.filter((v) => v.demos.length);
  const didNot = visits.filter((v) => !v.demos.length);
  if (tried.length >= 3 && didNot.length >= 3) {
    const a = medianTime(tried);
    const b = medianTime(didNot);
    const ca = share(tried.filter(isContact).length, tried.length);
    const cb = share(didNot.filter(isContact).length, didNot.length);
    if (a > b * 1.3 || ca > cb) {
      out.push({
        weight: 70,
        tone: 'good',
        title: 'Visitors who try a demo stay longer',
        detail: `A median ${duration(a)} against ${duration(b)}; ${ca}% of them contact you, against ${cb}% of the rest.`,
        action: share(tried.length, cur.visits) < 30 ? `Only ${share(tried.length, cur.visits)}% try one: make the demo the first thing a case study shows.` : undefined,
      });
    }
  }

  // Phones against desktops.
  const phones = visits.filter((v) => v.device === 'Phone');
  const desks = visits.filter((v) => v.device === 'Desktop');
  if (phones.length >= 3 && desks.length >= 3) {
    const p = medianTime(phones);
    const d = medianTime(desks);
    if (p && d && (p < d * 0.6 || d < p * 0.6)) {
      const phoneWorse = p < d;
      out.push({
        weight: 65,
        tone: phoneWorse ? 'watch' : 'note',
        title: phoneWorse ? 'Phone visits are much shorter' : 'Phone visits last longer than desktop ones',
        detail: `${share(phones.length, cur.visits)}% of visits are on a phone, a median ${duration(p)} against ${duration(d)} on a desktop.`,
        action: phoneWorse ? 'Read the site through on a phone: the demos and long sections are the likely cause.' : undefined,
      });
    }
  }

  // Tracking links: what each named recipient did.
  const DID: Record<string, string> = {
    'CV download': 'downloaded the CV',
    'Email link': 'opened an email to you',
    LinkedIn: 'went to your LinkedIn',
    GitHub: 'looked at your GitHub',
    'Phone number': 'tapped your phone number',
  };
  for (const [i, r] of cur.refs.slice(0, 2).entries()) {
    const vs = visits.filter((v) => v.ref === r.label);
    const contacted = [...new Set(vs.flatMap((v) => v.contacts.map((c) => DID[c] ?? c)))];
    const opened = [...new Set(vs.flatMap((v) => v.cases))];
    const did = [...contacted, ...(opened.length ? [`opened ${opened.slice(0, 3).join(', ')}`] : [])];
    out.push({
      weight: 85 - i,
      tone: vs.some(isContact) ? 'good' : 'note',
      title: `Your link “${r.label}” was opened ${r.count === 1 ? 'once' : r.count === 2 ? 'twice' : `${r.count} times`}`,
      detail: `${did.length ? `They ${did.join('; ')}` : 'They looked around without opening a case study'}. ${duration(medianTime(vs))} in view, as a median.`,
    });
  }

  // Coming back, and the language read in.
  if (cur.returningVisitors) {
    out.push({
      weight: 45,
      tone: 'good',
      title: `${plural(cur.returningVisitors, 'visitor')} came back`,
      detail: `${share(cur.returningVisitors, cur.visitors)}% of visitors returned within the dates loaded. A second visit is usually someone weighing you up.`,
    });
  }
  const he = cur.langs.find((l) => l.label === 'Hebrew')?.count ?? 0;
  if (he) {
    out.push({
      weight: 30,
      tone: 'note',
      title: `${share(he, cur.visits)}% of visits read the site in Hebrew`,
      detail: `${plural(he, 'visit')} started on a Hebrew page or switched to one first.`,
    });
  }

  // When visits come.
  const topDay = [...cur.weekdays].sort((a, b) => b.count - a.count)[0];
  const topPart = [...cur.dayparts].sort((a, b) => b.count - a.count)[0];
  if (cur.visits >= 10 && topDay.count) {
    out.push({
      weight: 35,
      tone: 'note',
      title: `Most visits come on ${FULL_DAYS[WEEKDAYS.indexOf(topDay.label)]}s, in the ${topPart.label.split(',')[0].toLowerCase()}`,
      detail: `${share(topDay.count, cur.visits)}% of visits on that day of the week, ${share(topPart.count, cur.visits)}% in that part of the day (Israel time).`,
      action: 'Send applications and post just before then.',
    });
  }

  return out.sort((a, b) => b.weight - a.weight).map(({ weight: _w, ...i }) => i);
}

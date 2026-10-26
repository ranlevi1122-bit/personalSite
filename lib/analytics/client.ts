'use client';

import type { ClientBatch, ClientEvent } from './types';

/**
 * The browser side of analytics: ids, the event queue and the beacon.
 *
 * Off when the visitor asks not to be tracked (Global Privacy Control or Do
 * Not Track), and on any device where Ran has signed in to /stats, so his own
 * visits never count.
 */

const VID = 'rl_vid';
const SID = 'rl_sid';
const SEEN = 'rl_seen';
const REF = 'rl_ref';
const SRC = 'rl_src';
export const OWNER = 'rl_owner';
const VISIT_GAP_MS = 30 * 60 * 1000;
const BATCH_MS = 20_000;
const BATCH_SIZE = 30;

let queue: ClientEvent[] = [];
let timer = 0;

const store = {
  get(area: Storage | undefined, key: string) {
    try {
      return area?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  set(area: Storage | undefined, key: string, value: string) {
    try {
      area?.setItem(key, value);
    } catch {
      /* private mode: ids live only for this page */
    }
  },
};

const local = () => (typeof window === 'undefined' ? undefined : window.localStorage);
const session = () => (typeof window === 'undefined' ? undefined : window.sessionStorage);
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export function trackingAllowed() {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.globalPrivacyControl || nav.doNotTrack === '1') return false;
  if (store.get(local(), OWNER) === '1') return false;
  if (location.pathname.startsWith('/stats')) return false;
  return true;
}

/** Visitor and visit ids; a visit ends after 30 minutes without activity. */
function ids() {
  let vid = store.get(local(), VID);
  if (!vid) {
    vid = newId();
    store.set(local(), VID, vid);
  }
  const last = Number(store.get(local(), SEEN) ?? 0);
  let sid = store.get(session(), SID);
  if (!sid || Date.now() - last > VISIT_GAP_MS) {
    sid = newId();
    store.set(session(), SID, sid);
  }
  store.set(local(), SEEN, String(Date.now()));
  return { vid, sid };
}

/** The tracking-link tag and the source, read once at the start of a visit. */
export function captureSource() {
  const params = new URLSearchParams(location.search);
  const ref = params.get('ref');
  if (ref) store.set(session(), REF, ref.toLowerCase().replace(/[^a-z0-9א-ת-_.]/g, '-').slice(0, 60));
  if (!store.get(session(), SRC)) {
    const utm = params.get('utm_source');
    let src = utm ?? '';
    if (!src && document.referrer) {
      try {
        const host = new URL(document.referrer).hostname.replace(/^www\./, '');
        if (host !== location.hostname) src = host;
      } catch {
        /* unreadable referrer */
      }
    }
    store.set(session(), SRC, src || 'direct');
  }
}

function flush(useBeacon = false) {
  if (!queue.length) return;
  const { vid, sid } = ids();
  const batch: ClientBatch = {
    vid,
    sid,
    ref: store.get(session(), REF) ?? undefined,
    src: store.get(session(), SRC) ?? undefined,
    w: window.innerWidth,
    events: queue.splice(0, queue.length),
  };
  const body = JSON.stringify(batch);
  if (useBeacon && navigator.sendBeacon) {
    navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
    return;
  }
  void fetch('/api/track', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(
    () => {},
  );
}

/**
 * Queues one event. Batches go out every 20 seconds, at 30 events, and when
 * the page is hidden, so a visit costs a few requests: Vercel's free plan
 * counts every one.
 */
export function track(event: Omit<ClientEvent, 'p'> & { p?: string }) {
  if (!trackingAllowed()) return;
  queue.push({ ...event, p: event.p ?? location.pathname });
  if (queue.length >= BATCH_SIZE) {
    flushNow();
    return;
  }
  if (!timer) {
    timer = window.setTimeout(() => {
      timer = 0;
      flush();
    }, BATCH_MS);
  }
}

/** For the live demos: one call per thing done. */
export const trackDemo = (label: string) => track({ n: 'demo', l: label });

export function flushNow() {
  if (timer) {
    window.clearTimeout(timer);
    timer = 0;
  }
  flush(true);
}

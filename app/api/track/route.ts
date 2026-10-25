import { NextResponse, type NextRequest } from 'next/server';
import { appendEvents } from '@/lib/analytics/store';
import { EVENT_NAMES, type ClientBatch, type ClientEvent, type StoredEvent } from '@/lib/analytics/types';

/**
 * Receives event batches from the tracker (components/Analytics.tsx), drops
 * bots and malformed input, adds place and device, and stores them.
 * No IP address is kept.
 */

export const runtime = 'nodejs';

const BOTS = /bot|crawl|spider|slurp|preview|headless|lighthouse|pagespeed|facebookexternalhit|embedly|whatsapp|telegram|slack|discord|curl|wget|python|node-fetch|axios/i;
const MAX_BYTES = 32_000;
const MAX_EVENTS = 60;

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : undefined);

function device(ua: string, width?: number): StoredEvent['device'] {
  if (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return 'Tablet';
  if (/Mobi|iPhone|Android/i.test(ua) || (width !== undefined && width < 600)) return 'Phone';
  return 'Desktop';
}

function browser(ua: string) {
  if (/Edg\//.test(ua)) return 'Edge';
  if (/OPR\//.test(ua)) return 'Opera';
  if (/SamsungBrowser/.test(ua)) return 'Samsung Internet';
  if (/Chrome\//.test(ua)) return 'Chrome';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Safari\//.test(ua)) return 'Safari';
  return 'Other';
}

function clean(e: unknown): ClientEvent | null {
  if (!e || typeof e !== 'object') return null;
  const r = e as Record<string, unknown>;
  if (!EVENT_NAMES.includes(r.n as ClientEvent['n'])) return null;
  const p = text(r.p, 200);
  if (!p || !p.startsWith('/')) return null;
  const v = typeof r.v === 'number' && Number.isFinite(r.v) ? Math.max(0, Math.min(r.v, 86_400)) : undefined;
  return { n: r.n as ClientEvent['n'], p, l: text(r.l, 120), h: text(r.h, 300), s: text(r.s, 60), v };
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (raw.length > MAX_BYTES) return new NextResponse(null, { status: 413 });

  const ua = req.headers.get('user-agent') ?? '';
  if (!ua || BOTS.test(ua)) return new NextResponse(null, { status: 204 });

  let batch: ClientBatch;
  try {
    batch = JSON.parse(raw) as ClientBatch;
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const vid = text(batch.vid, 40);
  const sid = text(batch.sid, 40);
  if (!vid || !sid || !Array.isArray(batch.events)) return new NextResponse(null, { status: 400 });

  const city = req.headers.get('x-vercel-ip-city');
  const at = Date.now();
  const base = {
    vid,
    sid,
    ref: text(batch.ref, 60),
    src: text(batch.src, 80),
    country: req.headers.get('x-vercel-ip-country') ?? undefined,
    city: city ? decodeURIComponent(city) : undefined,
    device: device(ua, typeof batch.w === 'number' ? batch.w : undefined),
    browser: browser(ua),
  };

  const events: StoredEvent[] = batch.events
    .slice(0, MAX_EVENTS)
    .map(clean)
    .filter((e): e is ClientEvent => e !== null)
    .map((e, i) => ({ ...e, ...base, at: at + i }));

  try {
    await appendEvents(events);
  } catch {
    // Analytics must never break the site; a failed write is dropped.
  }
  return new NextResponse(null, { status: 204 });
}

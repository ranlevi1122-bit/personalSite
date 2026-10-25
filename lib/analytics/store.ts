import { appendFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { DAILY_CAP, type StoredEvent } from './types';

/**
 * Where events live.
 *
 * - Production: Upstash Redis over its REST API (connected to the Vercel
 *   project from the Marketplace, which sets the two variables below). No SDK:
 *   the REST pipeline endpoint is one fetch.
 * - Local development without Redis: a JSON-lines file in `.analytics/`.
 * - On Vercel without Redis there is nowhere durable to write, so events are
 *   dropped and the dashboard says how to connect storage.
 *
 * Events are kept in one list per day (Israel time), for 180 days.
 *
 * Sized to stay inside Upstash's free plan (256MB, 500K commands a month):
 * each day keeps at most DAILY_CAP events, roughly 100 to 200 visits, so even
 * 180 full days stay under 200MB, and each write costs three commands.
 */

const URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const KEEP_SECONDS = 60 * 60 * 24 * 180;
const FILE = path.join(process.cwd(), '.analytics', 'events.jsonl');

export type StoreKind = 'redis' | 'file' | 'none';

export const storeKind: StoreKind = URL && TOKEN ? 'redis' : process.env.VERCEL ? 'none' : 'file';

const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' });

/** The calendar day of a moment, in Israel, as YYYY-MM-DD. */
export const dayOf = (ms: number) => dayFormat.format(new Date(ms));

const keyFor = (day: string) => `rl:events:${day}`;

async function pipeline(commands: (string | number)[][]) {
  const res = await fetch(`${URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Redis responded ${res.status}`);
  return (await res.json()) as { result?: unknown; error?: string }[];
}

export async function appendEvents(events: StoredEvent[]) {
  if (!events.length || storeKind === 'none') return;

  if (storeKind === 'file') {
    await mkdir(path.dirname(FILE), { recursive: true });
    await appendFile(FILE, events.map((e) => JSON.stringify(e)).join('\n') + '\n');
    return;
  }

  const byDay = new Map<string, string[]>();
  for (const e of events) {
    const key = keyFor(dayOf(e.at));
    byDay.set(key, [...(byDay.get(key) ?? []), JSON.stringify(e)]);
  }
  const commands: (string | number)[][] = [];
  for (const [key, values] of byDay) {
    commands.push(['RPUSH', key, ...values], ['LTRIM', key, 0, DAILY_CAP - 1], ['EXPIRE', key, KEEP_SECONDS]);
  }
  await pipeline(commands);
}

/** Every event from the last `days` days, today included, oldest first. */
export async function readEvents(days: number): Promise<StoredEvent[]> {
  const now = Date.now();
  const wanted = Array.from({ length: days }, (_, i) => dayOf(now - i * 86_400_000)).reverse();

  if (storeKind === 'none') return [];

  if (storeKind === 'file') {
    const raw = await readFile(FILE, 'utf8').catch(() => '');
    const keep = new Set(wanted);
    return raw
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as StoredEvent)
      .filter((e) => keep.has(dayOf(e.at)));
  }

  const results = await pipeline(wanted.map((d) => ['LRANGE', keyFor(d), 0, -1]));
  return results.flatMap((r) => ((r.result as string[] | undefined) ?? []).map((s) => JSON.parse(s) as StoredEvent));
}

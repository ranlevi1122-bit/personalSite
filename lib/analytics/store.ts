import { appendFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { DAILY_CAP, RETAIN_DAYS, dayOf, type StoredEvent } from './types';

export { dayOf };

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
const KEEP_SECONDS = 60 * 60 * 24 * RETAIN_DAYS;
const FILE = path.join(process.cwd(), '.analytics', 'events.jsonl');

export type StoreKind = 'redis' | 'file' | 'none';

export const storeKind: StoreKind = URL && TOKEN ? 'redis' : process.env.VERCEL ? 'none' : 'file';

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

/** Every event on the given days (YYYY-MM-DD, Israel time), one read per day, in one request. */
export async function readEvents(wanted: string[]): Promise<StoredEvent[]> {
  if (storeKind === 'none' || !wanted.length) return [];

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

async function fileDay(day: string) {
  const raw = await readFile(FILE, 'utf8').catch(() => '');
  return raw
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as StoredEvent)
    .filter((e) => dayOf(e.at) === day);
}

/**
 * How many events a day holds: one command, for the dashboard's live check.
 * A day's list only grows at its end, so a count is a cursor into it.
 */
export async function countEvents(day: string): Promise<number> {
  if (storeKind === 'none') return 0;
  if (storeKind === 'file') return (await fileDay(day)).length;
  const [r] = await pipeline([['LLEN', keyFor(day)]]);
  return Number(r.result ?? 0);
}

/** A day's events from position `start` on: only what arrived since the last look. */
export async function readEventsFrom(day: string, start: number): Promise<StoredEvent[]> {
  if (storeKind === 'none') return [];
  if (storeKind === 'file') return (await fileDay(day)).slice(start);
  const [r] = await pipeline([['LRANGE', keyFor(day), start, -1]]);
  return ((r.result as string[] | undefined) ?? []).map((s) => JSON.parse(s) as StoredEvent);
}

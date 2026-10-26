import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE, verifyToken } from '@/lib/analytics/auth';
import { buildVisits, type LiveVisit } from '@/lib/analytics/report';
import { countEvents, readEventsFrom, readEvents, storeKind } from '@/lib/analytics/store';
import { dayOf } from '@/lib/analytics/types';

/**
 * The dashboard's live check for new visits, for the owner only.
 *
 * The first call reads today once and returns a cursor (the day and how many
 * events it holds) and the visits already known. Each later call costs one
 * command to count today's events, and one more to read just the new ones
 * when there are any, so leaving the dashboard open stays well inside the free
 * plan.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!verifyToken(req.cookies.get(COOKIE)?.value)) return new NextResponse(null, { status: 401 });
  if (storeKind === 'none') return NextResponse.json({ live: false });

  const today = dayOf(Date.now());
  const day = req.nextUrl.searchParams.get('day');
  const from = Math.max(0, Number(req.nextUrl.searchParams.get('from')) || 0);

  try {
    // First look: everything today is already on the screen, or about to be.
    if (!day) {
      const events = await readEvents([today]);
      return NextResponse.json({ live: true, day: today, len: events.length, known: [...new Set(events.map((e) => e.sid))] });
    }

    // Past midnight the count starts again on a new list, all of it new.
    const start = day === today ? from : 0;
    const len = await countEvents(today);
    if (len <= start) return NextResponse.json({ live: true, day: today, len, visits: [] });

    const visits: LiveVisit[] = buildVisits(await readEventsFrom(today, start), 0).map((v) => ({
      sid: v.sid,
      start: v.start,
      source: v.source,
      ref: v.ref,
      country: v.country,
      city: v.city,
      device: v.device,
      lang: v.lang,
      cases: v.cases,
    }));
    return NextResponse.json({ live: true, day: today, len, visits }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}

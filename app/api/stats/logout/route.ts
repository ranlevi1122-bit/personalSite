import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE } from '@/lib/analytics/auth';

/** Ends the dashboard session on this device. */
export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/stats', req.url), 303);
  res.cookies.set(COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}

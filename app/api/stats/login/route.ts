import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE, checkPassword, issueToken } from '@/lib/analytics/auth';

export const runtime = 'nodejs';

/** Checks the dashboard password and, if it is right, sets the session cookie. */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const password = String(form.get('password') ?? '');

  if (!checkPassword(password)) {
    // A short pause makes guessing slow without bothering the owner.
    await new Promise((r) => setTimeout(r, 700));
    return NextResponse.redirect(new URL('/stats?error=1', req.url), 303);
  }

  const token = issueToken();
  const res = NextResponse.redirect(new URL('/stats', req.url), 303);
  res.cookies.set(COOKIE, token.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: token.maxAge,
  });
  return res;
}

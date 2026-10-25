import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * The dashboard is for Ran only. One password, set as STATS_PASSWORD in the
 * Vercel project (never in the code). A correct password sets a signed,
 * http-only cookie for 30 days; the signature is an HMAC of its expiry, so
 * the cookie cannot be forged and changing the password logs every device out.
 */

export const COOKIE = 'rl_stats';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const secret = () => process.env.STATS_PASSWORD ?? '';

export const passwordIsSet = () => secret().length >= 8;

const mac = (value: string) => createHmac('sha256', secret()).update(value).digest('hex');

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkPassword(input: string) {
  return passwordIsSet() && same(input, secret());
}

export function issueToken() {
  const expires = Date.now() + MAX_AGE_SECONDS * 1000;
  return { value: `${expires}.${mac(String(expires))}`, maxAge: MAX_AGE_SECONDS };
}

export function verifyToken(token: string | undefined) {
  if (!token || !passwordIsSet()) return false;
  const [expires, signature] = token.split('.');
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  return same(signature, mac(expires));
}

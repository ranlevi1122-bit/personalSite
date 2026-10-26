/**
 * The site's two languages. English lives at the root (/, /projects/...),
 * Hebrew under /he (/he, /he/projects/...); next.config.mjs rewrites the
 * English paths onto the [locale] routes.
 */

export const locales = ['en', 'he'] as const;
export type Locale = (typeof locales)[number];

export const isLocale = (v: string): v is Locale => (locales as readonly string[]).includes(v);

export const dirOf = (locale: Locale) => (locale === 'he' ? 'rtl' : 'ltr');

/** An internal link in the given language. External links and mail links pass through. */
export function localePath(locale: Locale, href: string): string {
  if (locale === 'en' || !href.startsWith('/')) return href;
  if (href === '/') return '/he';
  if (href.startsWith('/#')) return `/he${href.slice(1)}`;
  return `/he${href}`;
}

/**
 * The path as the visitor sees it. usePathname reports English pages by the
 * route they are rewritten to (/en/...), not by their address (/...).
 */
export function visiblePath(pathname: string | null): string {
  if (!pathname) return '/';
  if (pathname === '/en') return '/';
  return pathname.startsWith('/en/') ? pathname.slice(3) : pathname;
}

/** The same page in the other language, keeping the section it was on. */
export function otherLanguagePath(pathname: string, hash = ''): string {
  const inHebrew = pathname === '/he' || pathname.startsWith('/he/');
  if (inHebrew) {
    const rest = pathname.slice(3);
    return `${rest || '/'}${hash}`;
  }
  return `${pathname === '/' ? '/he' : `/he${pathname}`}${hash}`;
}

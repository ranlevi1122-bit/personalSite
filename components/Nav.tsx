'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState, type CSSProperties, type MouseEvent } from 'react';
import { getContent } from '@/data/content';
import { ui } from '@/data/ui';
import { localePath, otherLanguagePath, visiblePath } from '@/lib/i18n';
import { useActiveSection, useEscape, useScrollLock, useScrolled } from '@/lib/hooks';
import { useLocale } from '@/components/LocaleProvider';

/**
 * The bar: wordmark, the section links, the language switch and one action.
 * It lifts off the page once the page scrolls under it. On a phone, a menu word.
 */
export function Nav() {
  const locale = useLocale();
  const { navLinks, person } = getContent(locale);
  const t = ui(locale).nav;
  const [open, setOpen] = useState(false);
  const pathname = visiblePath(usePathname());
  const sectionIds = navLinks.map((l) => l.href.replace('/#', ''));
  const active = useActiveSection(sectionIds);
  const scrolled = useScrolled(8);
  const close = useCallback(() => setOpen(false), []);
  const home = localePath(locale, '/');
  const onHome = pathname === home;

  useScrollLock(open);
  useEscape(open, close);
  useEffect(() => close(), [pathname, close]);

  const other = otherLanguagePath(pathname);
  // Keep the section the reader is on when switching language.
  const keepHash = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!window.location.hash) return;
    e.preventDefault();
    window.location.assign(other + window.location.hash);
  };
  const otherLang = locale === 'he' ? 'en' : 'he';

  return (
    <header className="site-head" data-tone="stone" data-scrolled={scrolled || open ? 'true' : 'false'}>
      <a href="#main" className="skip-link">
        {t.skip}
      </a>
      <div className="site-head__row shell">
        <Link href={home} className="wordmark" aria-label={t.home(person.name)}>
          {person.name}
        </Link>
        <nav aria-label={t.main}>
          <div className="site-nav">
            {navLinks.map((l) => {
              const id = l.href.replace('/#', '');
              return (
                <Link
                  key={l.href}
                  href={localePath(locale, l.href)}
                  aria-current={onHome && active === id ? 'true' : undefined}
                >
                  {l.label}
                </Link>
              );
            })}
            <a href={other} className="lang-switch" lang={otherLang} hrefLang={otherLang} aria-label={t.switchAria} onClick={keepHash}>
              {t.switchLabel}
            </a>
            <Link href={localePath(locale, '/#contact')} className="btn btn--small">
              {t.contact}
            </Link>
          </div>
          <div className="site-nav__compact">
            <a href={other} className="lang-switch" lang={otherLang} hrefLang={otherLang} aria-label={t.switchAria} onClick={keepHash}>
              {t.switchLabel}
            </a>
            <button
              type="button"
              className="menu-toggle"
              aria-expanded={open}
              aria-controls="menu-panel"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? t.close : t.menu}
            </button>
          </div>
        </nav>
      </div>
      {open && (
        <div id="menu-panel" className="menu-panel">
          {navLinks.map((l, i) => (
            <Link key={l.href} href={localePath(locale, l.href)} onClick={close} style={{ '--i': i } as CSSProperties}>
              {l.label}
            </Link>
          ))}
          <a className="btn" href={`mailto:${person.email}`} onClick={close}>
            {t.email}
          </a>
        </div>
      )}
    </header>
  );
}

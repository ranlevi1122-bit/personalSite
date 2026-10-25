'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { navLinks, person } from '@/data/portfolioData';
import { useActiveSection, useEscape, useScrollLock, useScrolled } from '@/lib/hooks';

const sectionIds = navLinks.map((l) => l.href.replace('/#', ''));

/**
 * The bar: wordmark, the section links and one action. It lifts off the page once
 * the page scrolls under it. On a phone, a menu word.
 */
export function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const active = useActiveSection(sectionIds);
  const scrolled = useScrolled(8);
  const close = useCallback(() => setOpen(false), []);

  useScrollLock(open);
  useEscape(open, close);
  useEffect(() => close(), [pathname, close]);

  return (
    <header className="site-head" data-tone="stone" data-scrolled={scrolled || open ? 'true' : 'false'}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="site-head__row shell">
        <Link href="/" className="wordmark" aria-label={`${person.name}, home`}>
          {person.name}
        </Link>
        <nav aria-label="Main">
          <div className="site-nav">
            {navLinks.map((l) => {
              const id = l.href.replace('/#', '');
              return (
                <Link key={l.href} href={l.href} aria-current={pathname === '/' && active === id ? 'true' : undefined}>
                  {l.label}
                </Link>
              );
            })}
            <Link href="/#contact" className="btn btn--small">
              Contact
            </Link>
          </div>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="menu-panel"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </nav>
      </div>
      {open && (
        <div id="menu-panel" className="menu-panel">
          {navLinks.map((l, i) => (
            <Link key={l.href} href={l.href} onClick={close} style={{ '--i': i } as CSSProperties}>
              {l.label}
            </Link>
          ))}
          <a className="btn" href={`mailto:${person.email}`} onClick={close}>
            Email Ran
          </a>
        </div>
      )}
    </header>
  );
}

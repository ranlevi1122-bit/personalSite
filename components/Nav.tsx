'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { navSections, person } from '@/data/portfolioData';
import { useActiveSection, useEscape, useReducedMotion, useScrollLock, useScrolled } from '@/lib/hooks';
import { Arrow } from '@/components/ui/Atoms';

const SECTION_IDS = navSections.map((s) => s.id);
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Floating navigation: translucent at the top of the page, denser once
 * scrolled, with an active-section indicator that animates between items.
 *
 * `simple` renders the reduced version used on project case-study pages,
 * where there are no in-page sections to track.
 */
export function Nav({
  onOpenRecruiter,
  simple = false,
}: {
  onOpenRecruiter: () => void;
  simple?: boolean;
}) {
  const scrolled = useScrolled(24);
  const reduced = useReducedMotion();
  const active = useActiveSection(simple ? [] : SECTION_IDS);
  const [menuOpen, setMenuOpen] = useState(false);

  useScrollLock(menuOpen);
  useEscape(menuOpen, () => setMenuOpen(false));

  // Close the mobile menu if the viewport grows past the breakpoint.
  useEffect(() => {
    if (!menuOpen) return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const close = () => mq.matches && setMenuOpen(false);
    mq.addEventListener('change', close);
    return () => mq.removeEventListener('change', close);
  }, [menuOpen]);

  return (
    <>
      {/* Targets <main id="main">, which exists on every route. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-chalk focus:px-4 focus:py-2 focus:text-[13px] focus:font-medium focus:text-ink-950"
      >
        Skip to content
      </a>

      <header
        className="fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-premium"
        style={{
          backgroundColor: scrolled ? 'rgba(7,8,11,0.78)' : 'rgba(7,8,11,0.14)',
          backdropFilter: scrolled ? 'saturate(180%) blur(16px)' : 'saturate(140%) blur(8px)',
          WebkitBackdropFilter: scrolled ? 'saturate(180%) blur(16px)' : 'saturate(140%) blur(8px)',
          borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,0.075)' : 'rgba(255,255,255,0)'}`,
        }}
      >
        <nav className="shell flex h-[var(--nav-h)] items-center justify-between gap-6" aria-label="Primary">
          {/* Identity */}
          {/*
            No aria-label here: the accessible name is built from the visible
            text plus a screen-reader-only suffix, so it always contains the
            visible label (WCAG 2.5.3, Label in Name).
          */}
          <Link href={simple ? '/' : '#top'} className="group flex items-center gap-2.5">
            {/* Decorative monogram: excluded from the name so the accessible
                name still contains the visible "Ran Levi" text (WCAG 2.5.3). */}
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-white/12 bg-white/[0.04] font-display text-[13px] font-semibold tracking-tight text-chalk transition-colors duration-300 group-hover:border-accent/50"
            >
              {person.initials}
            </span>
            <span className="font-display text-[18px] font-semibold tracking-[-0.015em] text-chalk">
              {person.name}
            </span>
            <span className="sr-only">— home</span>
          </Link>

          {/* Desktop links */}
          {!simple && (
            <ul className="hidden items-center gap-1 lg:flex">
              {navSections.map((s) => {
                const isActive = active === s.id;
                return (
                  <li key={s.id} className="relative">
                    <a
                      href={`#${s.id}`}
                      className={`relative block rounded-full px-3.5 py-2 text-[12.5px] font-medium transition-colors duration-300 ${
                        isActive ? 'text-chalk' : 'text-muted hover:text-chalk'
                      }`}
                      aria-current={isActive ? 'true' : undefined}
                    >
                      {isActive && !reduced && (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute inset-0 -z-10 rounded-full border border-white/[0.09] bg-white/[0.05]"
                          transition={{ duration: 0.45, ease: EASE }}
                        />
                      )}
                      {isActive && reduced && (
                        <span className="absolute inset-0 -z-10 rounded-full border border-white/[0.09] bg-white/[0.05]" />
                      )}
                      {s.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenRecruiter}
              className="hidden h-9 items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] px-3.5 text-[12px] font-medium text-muted transition-colors duration-300 hover:border-white/25 hover:text-chalk sm:flex"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
              </span>
              60s view
            </button>

            <a
              href={person.resumeHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group hidden h-9 items-center gap-2 rounded-full bg-chalk px-4 text-[12px] font-medium text-ink-950 transition-colors duration-300 hover:bg-white sm:flex"
            >
              Resume
              <Arrow direction="up-right" />
            </a>

            {/* Mobile trigger */}
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.03] text-chalk lg:hidden"
            >
              <span className="relative block h-[10px] w-[15px]">
                <span
                  className="absolute left-0 block h-[1.5px] w-full rounded bg-current transition-transform duration-300 ease-premium"
                  style={{ top: menuOpen ? '4px' : 0, transform: menuOpen ? 'rotate(45deg)' : 'none' }}
                />
                <span
                  className="absolute bottom-0 left-0 block h-[1.5px] w-full rounded bg-current transition-transform duration-300 ease-premium"
                  style={{ bottom: menuOpen ? '4.5px' : 0, transform: menuOpen ? 'rotate(-45deg)' : 'none' }}
                />
              </span>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            initial={reduced ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-ink-950/97 pt-[var(--nav-h)] backdrop-blur-xl lg:hidden"
          >
            <div className="shell flex h-full flex-col justify-between py-8">
              <ul className="space-y-1">
                {(simple ? [{ id: '', label: 'Back to home' }] : navSections).map((s, i) => (
                  <motion.li
                    key={s.id || 'home'}
                    initial={reduced ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.04 * i, ease: EASE }}
                  >
                    <Link
                      href={simple ? '/' : `#${s.id}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between border-b border-white/[0.06] py-4 font-display text-[24px] font-semibold tracking-[-0.02em] text-chalk"
                    >
                      {s.label}
                      <span className="font-mono text-[10px] tracking-[0.16em] text-faint tnum">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ul>

              <div className="space-y-3 pb-6">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenRecruiter();
                  }}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] text-[13.5px] font-medium text-chalk"
                >
                  60-second view
                </button>
                <a
                  href={person.resumeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-chalk text-[13.5px] font-medium text-ink-950"
                >
                  View resume
                  <Arrow direction="up-right" />
                </a>
                <a
                  href={`mailto:${person.email}`}
                  className="block pt-2 text-center text-[12.5px] text-faint"
                >
                  {person.email}
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

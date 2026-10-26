'use client';

import Link from 'next/link';
import { useEffect, useState, type CSSProperties } from 'react';
import { getContent } from '@/data/content';
import { ui } from '@/data/ui';
import { localePath } from '@/lib/i18n';
import { Arrow } from '@/components/ui/Arrow';
import { useLocale } from '@/components/LocaleProvider';

/**
 * A project status card, the way a project manager reports: each delivered
 * project's phases tick off in order, then the card moves to the next one.
 * Holds while pointed at; the dots switch projects by hand.
 */
export function StatusCard() {
  const locale = useLocale();
  const { statusProjects } = getContent(locale);
  const t = ui(locale).status;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % statusProjects.length), 7000);
    return () => window.clearTimeout(id);
  }, [index, paused, statusProjects.length]);

  const p = statusProjects[index];

  return (
    <div
      className="status"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="status__top">
        <span>{t.label}</span>
        <span className="status__state">
          <i aria-hidden="true" />
          {p.status}
        </span>
      </div>

      {/* Keyed by project so every switch replays the phases. */}
      <div className="status__body" key={p.name} aria-live="polite">
        <p className="status__name">{p.name}</p>
        <div className="status__progress">
          <div className="status__track">
            <i />
          </div>
          <span>{t.phases(p.phases.length)}</span>
        </div>
        <ol className="status__phases">
          {p.phases.map((phase, i) => (
            <li key={phase} style={{ '--i': i } as CSSProperties}>
              <span className="status__check" aria-hidden="true">
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </span>
              <span>{phase}</span>
              <span className="status__done">{t.done}</span>
            </li>
          ))}
        </ol>
        <div className="status__result">
          <span>{p.result.label}</span>
          <s>{p.result.before}</s>
          <Arrow />
          <b>{p.result.after}</b>
        </div>
      </div>

      <div className="status__foot">
        <Link href={localePath(locale, p.href)} className="arrow-link">
          {t.read} <Arrow />
        </Link>
        <div className="status__dots" role="group" aria-label={t.choose}>
          {statusProjects.map((sp, i) => (
            <button
              key={sp.name}
              type="button"
              aria-label={sp.name}
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

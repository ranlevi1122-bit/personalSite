'use client';

import Link from 'next/link';
import { useEffect, useState, type CSSProperties } from 'react';
import { statusProjects } from '@/data/portfolioData';
import { Arrow } from '@/components/ui/Arrow';

/**
 * A project status card, the way a project manager reports: each delivered
 * project's phases tick off in order, then the card moves to the next one.
 * Holds while pointed at; the dots switch projects by hand.
 */
export function StatusCard() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % statusProjects.length), 7000);
    return () => window.clearTimeout(id);
  }, [index, paused]);

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
        <span>Project status</span>
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
          <span>{p.phases.length} of {p.phases.length} phases</span>
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
              <span className="status__done">Done</span>
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
        <Link href={p.href} className="arrow-link">
          Read the case study <Arrow />
        </Link>
        <div className="status__dots" role="group" aria-label="Choose a project">
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

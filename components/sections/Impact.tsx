'use client';

import Link from 'next/link';
import { impactStats } from '@/data/portfolioData';
import { Arrow, Counter } from '@/components/ui/Atoms';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Reveal';

/**
 * Section 04 — verified numbers only. Every figure here traces to the CV;
 * nothing is estimated, extrapolated or invented.
 */
export function Impact() {
  return (
    <section id="impact" className="relative scroll-mt-[var(--nav-h)] overflow-hidden py-20 md:py-24">
      {/* Ambient band */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute left-1/2 top-1/2 h-[420px] w-[1200px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px]"
          style={{
            background:
              'radial-gradient(50% 50% at 50% 50%, rgba(123,140,255,0.11) 0%, rgba(86,214,196,0.045) 60%, transparent 100%)',
          }}
        />
      </div>

      <div className="shell">
        <Reveal mode="fade">
          <div className="section-eyebrow">
            <span className="label label-accent tnum">04</span>
            <span className="label">Impact</span>
            <span className="hairline" aria-hidden="true" />
            <span className="label text-[9.5px]">Verified from the CV</span>
          </div>
        </Reveal>

        <Stagger className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4" gap={0.1}>
          {impactStats.map((stat) => {
            const body = (
              <>
                <div className="font-display text-[clamp(2.4rem,5vw,3.4rem)] font-semibold leading-none tracking-[-0.04em] text-chalk">
                  {stat.countTo !== undefined ? (
                    <Counter to={stat.countTo} prefix={stat.prefix} suffix={stat.suffix} />
                  ) : (
                    stat.value
                  )}
                </div>
                <div className="mt-5 text-[12.5px] leading-snug text-muted">{stat.label}</div>
                {stat.context && <div className="mt-2 text-[11px] leading-snug text-faint">{stat.context}</div>}
                {stat.href && (
                  <div className="mt-5 inline-flex items-center gap-2 text-[11.5px] text-accent-soft/80 transition-colors duration-300 group-hover:text-accent-soft">
                    Case study
                    <Arrow />
                  </div>
                )}
              </>
            );

            return (
              <StaggerItem key={stat.label} className="h-full">
                {stat.href ? (
                  <Link
                    href={stat.href}
                    className="group flex h-full flex-col bg-ink-950 px-6 py-8 transition-colors duration-500 hover:bg-ink-900 md:px-7 md:py-9"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="group flex h-full flex-col bg-ink-950 px-6 py-8 md:px-7 md:py-9">{body}</div>
                )}
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}

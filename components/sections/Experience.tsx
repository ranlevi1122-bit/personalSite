'use client';

import { education, experience, person } from '@/data/portfolioData';
import { LitPanel, SectionHeading } from '@/components/ui/Atoms';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Reveal';

/**
 * Section 06 — experience read as a widening span of responsibility across
 * technology, operations and people, rather than as a CV timeline.
 * Education is folded in here so the section answers "background" in one place.
 */
export function Experience() {
  return (
    <section id="experience" className="relative scroll-mt-[var(--nav-h)] py-20 md:py-28">
      <div className="shell">
        <SectionHeading
          index="06"
          eyebrow="Experience & leadership"
          title={
            <>
              Responsibility for technical work,{' '}
              <span className="text-muted">for operations, and for people.</span>
            </>
          }
          lead="Three settings, one pattern: take responsibility for something that has to work, then organise the people, constraints and information until it does."
        />

        {/* ---------------------------------------------------------------- */}
        {/*  Timeline                                                        */}
        {/* ---------------------------------------------------------------- */}
        <div className="relative mt-14">
          {/* Rail */}
          <div
            aria-hidden="true"
            className="absolute bottom-6 left-[7px] top-3 hidden w-px bg-gradient-to-b from-accent/45 via-white/10 to-transparent md:block"
          />

          <ol className="space-y-4 md:space-y-5">
            {experience.map((entry, i) => (
              <li key={entry.id} className="relative md:pl-12">
                {/* Node */}
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-7 hidden h-[15px] w-[15px] items-center justify-center rounded-full border border-accent/40 bg-ink-950 md:flex"
                >
                  <span className="h-[5px] w-[5px] rounded-full bg-accent-soft" />
                </span>

                <Reveal mode="rise" delay={i * 0.06}>
                  <LitPanel className="p-6 md:p-8">
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                      <div>
                        <h3 className="font-display text-[19px] font-semibold tracking-[-0.02em] text-chalk md:text-[21px]">
                          {entry.org}
                        </h3>
                        <p className="mt-1.5 text-[13.5px] text-muted">{entry.role}</p>
                      </div>
                      <span className="label shrink-0 whitespace-nowrap">{entry.period}</span>
                    </div>

                    {/* How this reads for a technology employer */}
                    <p className="mt-6 border-l-2 border-accent/40 pl-4 text-[14.5px] leading-relaxed text-chalk/90">
                      {entry.positioning}
                    </p>

                    <ul className="mt-6 space-y-2.5">
                      {entry.points.map((p) => (
                        <li key={p} className="flex gap-3 text-[13.5px] leading-relaxed text-muted">
                          <span className="mt-[8px] h-px w-3 shrink-0 bg-white/25" aria-hidden="true" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>

                    <ul className="mt-6 flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-5">
                      {entry.capabilities.map((c) => (
                        <li key={c} className="chip">
                          {c}
                        </li>
                      ))}
                    </ul>
                  </LitPanel>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/*  Education                                                       */}
        {/* ---------------------------------------------------------------- */}
        <div className="mt-16 border-t border-white/[0.07] pt-12 md:mt-20">
          <Reveal mode="fade">
            <div className="section-eyebrow">
              <span className="label label-accent tnum">07</span>
              <span className="label">Education</span>
              <span className="hairline" aria-hidden="true" />
            </div>
          </Reveal>

          <Stagger className="mt-8 grid gap-3 md:grid-cols-2 md:gap-4" gap={0.08}>
            {education.map((e) => (
              <StaggerItem key={e.degree} className="h-full">
                <div className="flex h-full flex-col rounded-2xl border border-white/[0.07] bg-white/[0.015] p-6 md:p-7">
                  <span className="label">{e.period}</span>
                  <h3 className="mt-4 font-display text-[17px] font-semibold leading-snug tracking-[-0.015em] text-chalk md:text-[18px]">
                    {e.degree}
                  </h3>
                  <p className="mt-2 text-[13px] text-muted">{e.institution}</p>
                  <ul className="mt-6 flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-5">
                    {e.themes.map((t) => (
                      <li key={t} className="chip">
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          {/* Languages — small, factual */}
          <Reveal mode="fade" delay={0.1}>
            <p className="mt-6 text-[12.5px] text-faint">
              Languages:{' '}
              {person.languages.map((l, i) => (
                <span key={l.name}>
                  <span className="text-muted">{l.name}</span> ({l.level})
                  {i < person.languages.length - 1 ? ' · ' : ''}
                </span>
              ))}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

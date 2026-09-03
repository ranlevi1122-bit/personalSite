'use client';

import { person, recruiterView } from '@/data/portfolioData';
import { Arrow, ButtonLink } from '@/components/ui/Atoms';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Reveal';

/**
 * Section 10 — the conversion moment. Confident, short, and specific about
 * the kind of role being looked for.
 */
export function Contact() {
  return (
    <section id="contact" className="relative scroll-mt-[var(--nav-h)] overflow-hidden pb-20 pt-20 md:pb-28 md:pt-28">
      {/* Ambient close */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute bottom-[-30%] left-1/2 h-[560px] w-[1000px] -translate-x-1/2 rounded-full blur-[130px]"
          style={{
            background:
              'radial-gradient(50% 50% at 50% 50%, rgba(123,140,255,0.14) 0%, rgba(86,214,196,0.05) 55%, transparent 100%)',
          }}
        />
      </div>

      <div className="shell">
        <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.035] to-white/[0.008] px-6 py-14 sm:px-10 md:px-14 md:py-20">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start lg:gap-16">
            {/* ------------------------------------------------------------ */}
            {/*  The ask                                                     */}
            {/* ------------------------------------------------------------ */}
            <div>
              <Reveal mode="fade">
                <div className="section-eyebrow">
                  <span className="label label-accent tnum">10</span>
                  <span className="label">Contact</span>
                </div>
              </Reveal>

              <Reveal mode="clip" delay={0.05}>
                <h2 className="mt-7 font-display text-[clamp(2rem,4.4vw,3.1rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-chalk">
                  Looking for someone who connects{' '}
                  <span className="text-gradient">technology, operations and execution?</span>
                </h2>
              </Reveal>

              <Reveal delay={0.12}>
                <p className="mt-7 max-w-[520px] text-[15.5px] leading-relaxed text-muted md:text-[16.5px]">
                  I&apos;m interested in opportunities where projects, information systems, data and operational
                  problem-solving intersect.
                </p>
              </Reveal>

              <Reveal delay={0.2}>
                <div className="mt-10 flex flex-wrap items-center gap-3">
                  <ButtonLink href={`mailto:${person.email}`} variant="primary">
                    Contact me
                    <Arrow direction="up-right" />
                  </ButtonLink>
                  <ButtonLink href={person.linkedin} variant="secondary">
                    LinkedIn
                    <Arrow direction="up-right" />
                  </ButtonLink>
                  <ButtonLink href={person.resumeHref} variant="secondary">
                    Resume
                    <Arrow direction="down" />
                  </ButtonLink>
                </div>
              </Reveal>
            </div>

            {/* ------------------------------------------------------------ */}
            {/*  Target roles + direct channels                              */}
            {/* ------------------------------------------------------------ */}
            <Reveal mode="rise" delay={0.14}>
              <div className="rounded-2xl border border-white/[0.07] bg-ink-950/50 p-6 md:p-7">
                <div className="section-eyebrow">
                  <span className="label label-accent">Roles I&apos;m targeting</span>
                </div>

                <Stagger className="mt-5 flex flex-wrap gap-1.5" gap={0.05}>
                  {recruiterView.target.map((t) => (
                    <StaggerItem key={t} as="span" className="chip">
                      {t}
                    </StaggerItem>
                  ))}
                </Stagger>

                <dl className="mt-8 space-y-5 border-t border-white/[0.07] pt-7">
                  <div>
                    <dt className="label">Email</dt>
                    <dd className="mt-2">
                      <a
                        href={`mailto:${person.email}`}
                        className="text-[13.5px] text-chalk transition-colors duration-300 hover:text-accent-soft"
                      >
                        {person.email}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="label">LinkedIn</dt>
                    <dd className="mt-2">
                      <a
                        href={person.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13.5px] text-chalk transition-colors duration-300 hover:text-accent-soft"
                      >
                        {person.linkedinLabel}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="label">Languages</dt>
                    <dd className="mt-2 text-[13.5px] text-muted">
                      {person.languages.map((l) => l.name).join(' · ')}
                    </dd>
                  </div>
                </dl>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/[0.07]">
      <div className="shell flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="font-display text-[13px] font-semibold tracking-[-0.01em] text-chalk">
            {person.name}
          </span>
          <span className="h-3 w-px bg-white/12" aria-hidden="true" />
          <span className="text-[11.5px] text-faint">{person.shortTitle}</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11.5px] text-faint">
          <a href={`mailto:${person.email}`} className="transition-colors duration-300 hover:text-muted">
            {person.email}
          </a>
          <a href={`tel:${person.phone.replace(/-/g, '')}`} className="transition-colors duration-300 hover:text-muted">
            {person.phone}
          </a>
          <a
            href={person.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors duration-300 hover:text-muted"
          >
            LinkedIn
          </a>
          <a href="#top" className="transition-colors duration-300 hover:text-muted">
            Back to top
          </a>
        </div>
      </div>
    </footer>
  );
}

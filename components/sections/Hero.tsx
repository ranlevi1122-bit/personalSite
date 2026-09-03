import type { CSSProperties } from 'react';
import { person, positioning, projects } from '@/data/portfolioData';
import { Arrow, ButtonLink } from '@/components/ui/Atoms';
import { HeadlineReveal } from '@/components/ui/Reveal';
import { HeroGraph } from '@/components/hero/HeroGraph';
import { RecruiterTrigger } from '@/components/hero/RecruiterTrigger';
import Image from 'next/image';

/** Three verified proof points, surfaced above the fold. */
const proof = [
  { value: '3', label: 'companies using the workforce system' },
  { value: '~30 min', label: 'assignment process, from ~half a day' },
  { value: '49', label: 'active users on the facility platform' },
];

/** Staggered CSS entrance — no hydration required. */
const at = (seconds: number) => ({ '--d': `${seconds}s` }) as CSSProperties;

/**
 * The first screen. Everything here is server-rendered and animated with CSS
 * so the positioning is painted immediately, before any JavaScript runs.
 * Only the system graph is interactive, and it hydrates on its own.
 */
export function Hero() {
  return (
    <section
      id="top"
      className="relative isolate overflow-hidden pt-[calc(var(--nav-h)+40px)] md:pt-[calc(var(--nav-h)+64px)]"
    >
      {/* Ambient field */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="grid-field absolute inset-0 opacity-[0.55]" />
        <div
          className="absolute left-1/2 top-[-18%] h-[620px] w-[1100px] -translate-x-1/2 rounded-full blur-[120px]"
          style={{
            background:
              'radial-gradient(50% 50% at 50% 50%, rgba(123,140,255,0.16) 0%, rgba(86,214,196,0.05) 55%, transparent 100%)',
          }}
        />
      </div>

      <div className="shell">
        <div className="grid items-center gap-14 pb-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 lg:pb-24">
          {/* ---------------------------------------------------------------- */}
          {/*  Copy                                                            */}
          {/* ---------------------------------------------------------------- */}
          <div className="relative z-10 max-w-[660px]">
            <div className="enter mb-8" style={at(0.02)}>
              <div className="relative h-40 w-40 overflow-hidden rounded-full border-2 border-white/10 grayscale filter transition-all duration-500 hover:border-accent hover:grayscale-0 md:h-58 md:w-58">
                <Image
                  src="/profile.png"
                  alt="Ran Levi"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="enter flex items-center gap-3" style={at(0.04)}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
              </span>
              <span className="label label-accent">{positioning.eyebrow}</span>
            </div>

            <h1 className="mt-7 font-display text-[clamp(2.4rem,5.4vw,3.75rem)] font-semibold leading-[1.0] tracking-[-0.035em] text-chalk">
              {positioning.headlineLines.map((line, i) => (
                <HeadlineReveal key={line} text={line} delay={0.1 + i * 0.1} className="block" />
              ))}
              {/* The accent line rises as one piece, so the gradient runs
                  across the whole phrase rather than per word. */}
              <HeadlineReveal
                text={positioning.headlineAccent}
                delay={0.3}
                split={false}
                className="block"
                textClassName="text-gradient"
              />
            </h1>

            <p
              className="enter-slide mt-7 max-w-[540px] text-[15.5px] leading-relaxed text-muted md:text-[17px]"
              style={at(0.3)}
            >
              {positioning.subhead}
            </p>

            <div className="enter mt-9 flex flex-wrap items-center gap-3" style={at(0.44)}>
              <ButtonLink href="#work" variant="primary">
                Explore my work
                <Arrow direction="down" />
              </ButtonLink>
              <ButtonLink href={person.resumeHref} variant="secondary">
                View resume
                <Arrow direction="up-right" />
              </ButtonLink>
              <RecruiterTrigger />
            </div>

            {/* Proof strip — the strongest facts, above the fold */}
            <dl
              className="enter mt-12 grid max-w-[560px] grid-cols-1 gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.04] xs:grid-cols-3"
              style={at(0.56)}
            >
              {proof.map((p) => (
                <div key={p.value} className="bg-ink-950/80 px-4 py-4">
                  <dt className="font-display text-xl font-semibold tracking-tight text-chalk tnum">{p.value}</dt>
                  <dd className="mt-1.5 text-[11.5px] leading-snug text-faint">{p.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/*  Interactive system graph                                        */}
          {/* ---------------------------------------------------------------- */}
          <div className="enter-scale relative z-0 -mx-4 sm:mx-0" style={at(0.18)}>
            <HeroGraph />
          </div>
        </div>

        {/* Scroll affordance */}
        <div
          className="enter hidden items-center gap-4 border-t border-white/[0.06] py-6 lg:flex"
          style={at(0.66)}
        >
          <span className="label">Scroll</span>
          <span className="h-px w-16 bg-gradient-to-r from-white/25 to-transparent" aria-hidden="true" />
          <span className="text-[12.5px] text-faint">
            3 verified proof points · {projects.length} projects · full case studies
          </span>
        </div>
      </div>
    </section>
  );
}

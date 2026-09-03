'use client';

import Link from 'next/link';
import { projects, type Project } from '@/data/portfolioData';
import { Arrow, SectionHeading } from '@/components/ui/Atoms';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Reveal';
import { ProjectVisualFor } from '@/components/visuals';

/** One beat of the case study, shown beside the sticky summary. */
function Beat({
  label,
  title,
  points,
}: {
  label: string;
  title: string;
  points: string[];
}) {
  return (
    <Reveal mode="rise" className="rounded-2xl border border-white/[0.07] bg-white/[0.015] p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="label label-accent">{label}</span>
        <span className="hairline" aria-hidden="true" />
      </div>
      <h4 className="mt-3.5 font-display text-[17px] font-semibold tracking-[-0.015em] text-chalk">{title}</h4>
      <ul className="mt-3.5 space-y-2.5">
        {points.map((p) => (
          <li key={p} className="flex gap-3 text-[13.5px] leading-relaxed text-muted">
            <span
              className="mt-[8px] h-px w-3 shrink-0 bg-accent/50"
              aria-hidden="true"
            />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

function ProjectBlock({ project, position }: { project: Project; position: number }) {
  return (
    <article
      id={`project-${project.slug}`}
      className="scroll-mt-[calc(var(--nav-h)+32px)] border-t border-white/[0.07] pt-10 first:border-t-0 first:pt-0 lg:grid lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-14 lg:pt-16 xl:gap-20"
    >
      {/* ------------------------------------------------------------------ */}
      {/*  Sticky summary                                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="lg:sticky lg:top-[calc(var(--nav-h)+40px)] lg:self-start lg:pb-20">
        <Reveal mode="fade">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] tracking-[0.16em] text-accent-soft tnum">{project.index}</span>
            <span className="h-px w-8 bg-white/15" aria-hidden="true" />
            <span className="label">{`0${position + 1} / 0${projects.length}`}</span>
          </div>
        </Reveal>

        <Reveal mode="clip" delay={0.05}>
          <h3 className="mt-5 font-display text-[clamp(1.6rem,3.4vw,2.35rem)] font-semibold leading-[1.06] tracking-[-0.028em] text-chalk">
            <Link
              href={`/projects/${project.slug}`}
              className="transition-colors duration-300 hover:text-accent-soft"
            >
              {project.title}
            </Link>
          </h3>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-2.5 text-[11.5px] uppercase tracking-[0.1em] text-faint">{project.category}</p>
        </Reveal>

        <Reveal delay={0.14}>
          <p className="mt-5 max-w-[440px] text-[15px] leading-relaxed text-chalk/85">{project.positioning}</p>
        </Reveal>

        {/* Verified metrics */}
        <Stagger className="mt-7 grid max-w-[440px] grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.05]" delay={0.1}>
          {project.metrics.map((m) => (
            <StaggerItem key={m.label} className="bg-ink-950 px-4 py-3.5">
              <div className="font-display text-[19px] font-semibold leading-none tracking-tight text-chalk tnum">
                {m.value}
              </div>
              <div className="mt-2 text-[10.5px] leading-snug text-faint">{m.label}</div>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Stack */}
        <Reveal delay={0.18}>
          <ul className="mt-6 flex flex-wrap gap-1.5">
            {project.tech.map((t) => (
              <li key={t} className="chip">
                {t}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.22}>
          <Link
            href={`/projects/${project.slug}`}
            className="tap group mt-7 gap-2.5 text-[13px] font-medium text-chalk transition-colors duration-300 hover:text-accent-soft"
          >
            <span className="border-b border-white/20 pb-0.5 transition-colors duration-300 group-hover:border-accent/60">
              Explore project
            </span>
            <Arrow />
          </Link>
        </Reveal>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*  Visual + case-study beats                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-8 space-y-4 lg:mt-0 lg:space-y-5 lg:pb-24">
        <Reveal mode="scale" duration={0.85}>
          <ProjectVisualFor visual={project.visual} />
        </Reveal>

        <Beat label="Problem" title="What was actually going wrong" points={project.problem} />
        <Beat label="Approach" title="How the work was structured" points={project.approach.slice(0, 3)} />
        <Beat label="Outcome" title="What changed" points={project.outcome} />
      </div>
    </article>
  );
}

export function SelectedWork() {
  return (
    <section id="work" className="relative scroll-mt-[var(--nav-h)] py-20 md:py-28 lg:py-32">
      <div className="shell">
        <SectionHeading
          index="03"
          eyebrow="Selected work"
          title={
            <>
              Four systems, each built to replace{' '}
              <span className="text-muted">something that was being done by hand.</span>
            </>
          }
          lead="Every project below started as an operational problem, not as a technology exercise. Each one was taken through requirements, design, build and adoption."
        />

        <div className="mt-14 lg:mt-20">
          {projects.map((project, i) => (
            <ProjectBlock key={project.slug} project={project} position={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

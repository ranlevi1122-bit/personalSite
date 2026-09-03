import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { person, projects, projectBySlug, seo } from '@/data/portfolioData';
import { Arrow, ButtonLink } from '@/components/ui/Atoms';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Reveal';
import { ProjectVisualFor } from '@/components/visuals';

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projectBySlug(slug);
  if (!project) return { title: 'Project not found' };

  const description = `${project.positioning} ${project.context}`.slice(0, 180);

  return {
    title: project.title,
    description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      type: 'article',
      title: `${project.title} | ${person.name}`,
      description,
      url: `${seo.url}/projects/${project.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${project.title} | ${person.name}`,
      description,
    },
  };
}

/** One numbered block of the case study. */
function Block({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal mode="rise" className="border-t border-white/[0.07] py-10 md:grid md:grid-cols-[180px_minmax(0,1fr)] md:gap-10 md:py-12">
      <div className="md:sticky md:top-[calc(var(--nav-h)+32px)] md:h-fit">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] tracking-[0.16em] text-accent-soft/70 tnum">{index}</span>
          <span className="label">{title}</span>
        </div>
      </div>
      <div className="mt-5 md:mt-0">{children}</div>
    </Reveal>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3.5 text-[14.5px] leading-relaxed text-muted md:text-[15.5px]">
          <span className="mt-[10px] h-px w-3.5 shrink-0 bg-accent/50" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projectBySlug(slug);
  if (!project) notFound();

  const position = projects.findIndex((p) => p.slug === project.slug);
  const next = projects[(position + 1) % projects.length];

  return (
    <article className="relative">
      {/* Ambient field */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px]">
        <div className="grid-field absolute inset-0 opacity-50" />
        <div
          className="absolute left-1/2 top-[-160px] h-[520px] w-[900px] -translate-x-1/2 rounded-full blur-[120px]"
          style={{
            background:
              'radial-gradient(50% 50% at 50% 50%, rgba(123,140,255,0.14) 0%, rgba(86,214,196,0.04) 55%, transparent 100%)',
          }}
        />
      </div>

      <div className="shell pt-[calc(var(--nav-h)+40px)] md:pt-[calc(var(--nav-h)+64px)]">
        {/* Breadcrumb */}
        <Reveal mode="fade">
          <Link
            href="/#work"
            className="tap group gap-2 text-[12.5px] text-muted transition-colors duration-300 hover:text-chalk"
          >
            <span className="inline-block transition-transform duration-300 ease-premium group-hover:-translate-x-1">
              ←
            </span>
            All work
          </Link>
        </Reveal>

        {/* Header */}
        <header className="mt-8 max-w-4xl">
          <Reveal mode="fade" delay={0.04}>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] tracking-[0.16em] text-accent-soft tnum">{project.index}</span>
              <span className="h-px w-8 bg-white/15" aria-hidden="true" />
              <span className="label">{project.category}</span>
            </div>
          </Reveal>

          <Reveal mode="clip" delay={0.08}>
            <h1 className="mt-6 font-display text-[clamp(2.1rem,5.6vw,3.9rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-chalk">
              {project.title}
            </h1>
          </Reveal>

          <Reveal delay={0.14}>
            <p className="mt-6 max-w-[620px] text-[16px] leading-relaxed text-chalk/85 md:text-[18px]">
              {project.positioning}
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <ul className="mt-8 flex flex-wrap gap-1.5">
              {project.tech.map((t) => (
                <li key={t} className="chip">
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </header>

        {/* Metrics */}
        <Stagger className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06] sm:grid-cols-2" gap={0.1}>
          {project.metrics.map((m) => (
            <StaggerItem key={m.label} className="bg-ink-950 px-6 py-7">
              <div className="font-display text-[clamp(1.9rem,4vw,2.6rem)] font-semibold leading-none tracking-[-0.04em] text-chalk tnum">
                {m.value}
              </div>
              <div className="mt-4 text-[12.5px] leading-snug text-muted">{m.label}</div>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Visual */}
        <Reveal mode="scale" duration={0.9} className="mt-6">
          <ProjectVisualFor visual={project.visual} />
        </Reveal>

        {/* ---------------------------------------------------------------- */}
        {/*  Case study                                                      */}
        {/* ---------------------------------------------------------------- */}
        <div className="mt-16 md:mt-20">
          <Block index="01" title="Context">
            <p className="max-w-[680px] text-[15.5px] leading-relaxed text-muted md:text-[16.5px]">
              {project.context}
            </p>
          </Block>

          <Block index="02" title="Problem">
            <BulletList items={project.problem} />
          </Block>

          <Block index="03" title="Approach">
            <BulletList items={project.approach} />
          </Block>

          <Block index="04" title="Solution">
            <BulletList items={project.solution} />
          </Block>

          <Block index="05" title="Technology">
            <ul className="grid gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.05] sm:grid-cols-2">
              {project.tech.map((t) => (
                <li key={t} className="flex items-center gap-3 bg-ink-950 px-4 py-3.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent/60" aria-hidden="true" />
                  <span className="text-[13.5px] text-chalk/90">{t}</span>
                </li>
              ))}
            </ul>
          </Block>

          <Block index="06" title="Outcome">
            <BulletList items={project.outcome} />
          </Block>

          <Block index="07" title="Skills demonstrated">
            <ul className="flex flex-wrap gap-1.5">
              {project.skills.map((s) => (
                <li key={s} className="chip">
                  {s}
                </li>
              ))}
            </ul>
          </Block>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/*  Next project + conversion                                       */}
        {/* ---------------------------------------------------------------- */}
        <div className="border-t border-white/[0.07] py-14 md:py-20">
          <Reveal mode="fade">
            <span className="label">Next project</span>
          </Reveal>
          <Reveal mode="clip" delay={0.05}>
            <Link href={`/projects/${next.slug}`} className="group mt-5 block">
              <h2 className="font-display text-[clamp(1.6rem,4vw,2.6rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-chalk transition-colors duration-300 group-hover:text-accent-soft">
                {next.title}
              </h2>
              <span className="mt-4 inline-flex items-center gap-2.5 text-[13px] text-muted transition-colors duration-300 group-hover:text-chalk">
                Explore project
                <Arrow />
              </span>
            </Link>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-white/[0.07] pt-10">
              <ButtonLink href={`mailto:${person.email}`} variant="primary">
                Contact Ran
                <Arrow direction="up-right" />
              </ButtonLink>
              <ButtonLink href={person.resumeHref} variant="secondary">
                View resume
                <Arrow direction="down" />
              </ButtonLink>
              <ButtonLink href="/#work" variant="ghost" magnetic={false}>
                All work
                <Arrow />
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </div>
    </article>
  );
}

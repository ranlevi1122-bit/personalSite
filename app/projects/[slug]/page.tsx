import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { launchSteps, person, projects, projectBySlug, safebuildFiles, seo, type DemoKind } from '@/data/portfolioData';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Reveal';
import { Arrow } from '@/components/ui/Arrow';
import { ProjectDemo } from '@/components/demos/ProjectDemo';
import { PlanTimeline, RiskRegister, SafeBuildResults } from '@/components/demos/SafeBuild';
import { Walkthrough } from '@/components/demos/Walkthrough';

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
      url: `${seo.url}projects/${project.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${project.title} | ${person.name}`,
      description,
    },
  };
}

/** What the visitor is looking at, said once under the live object. */
const demoCaption: Record<DemoKind, string> = {
  launch: 'The system’s reference launch of one tap, replayed step by step and translated from Hebrew. Run it, open any agent, then sign off.',
  scheduler: 'A working model on invented names. The checks are modelled on the real system’s.',
  booking: 'A working model of the platform on invented names. Switch roles to see what each one can do.',
  agents: 'The four-agent workflow run on sample data. Every figure in the report is worked out from the chart.',
  safebuild: 'Screens from the team’s working prototype: the report for a roofing contractor with 54 employees.',
};

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Reveal as="section" className="grid12 cs-block">
      <h2>{title}</h2>
      <div className="cs-block__body">{children}</div>
    </Reveal>
  );
}

/** A heading over the full width, for the objects that need it. */
function Wide({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <Reveal as="section" className="cs-wide">
      <div className="grid12 cs-wide__head">
        <h2>{title}</h2>
        <p>{note}</p>
      </div>
      {children}
    </Reveal>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="cs-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projectBySlug(slug);
  if (!project) notFound();

  const index = projects.findIndex((p) => p.slug === project.slug);
  const next = projects[(index + 1) % projects.length];
  const capstone = project.demo === 'safebuild';

  return (
    <article>
      <div className="shell cs-top" data-tone="dark" data-section="case-top">
        <Reveal>
          <h1 className="cs-title t-display">{project.shortTitle}</h1>
        </Reveal>
        <Reveal>
          <p className="cs-lead">{project.positioning}</p>
          {project.team && <p className="cs-team">{project.team}</p>}
        </Reveal>

        <Stagger as="ul" className="grid12 cs-facts" gap={0.07}>
          {project.metrics.map((m) => (
            <StaggerItem key={m.label} as="li" className="cs-fact">
              <span className="cs-fact__value tnum">{m.value}</span>
              <span className="cs-fact__label">{m.label}</span>
            </StaggerItem>
          ))}
          <StaggerItem as="li" className="cs-fact">
            <span className="cs-fact__label" style={{ marginTop: 0, color: 'var(--fg-c)' }}>
              Built with
            </span>
            <span className="cs-fact__label">{project.tech.join(', ')}</span>
          </StaggerItem>
          <StaggerItem as="li" className="cs-fact">
            <span className="cs-fact__label" style={{ marginTop: 0, color: 'var(--fg-c)' }}>
              Kind of work
            </span>
            <span className="cs-fact__label">{project.category}</span>
          </StaggerItem>
        </Stagger>

        <Reveal className="cs-hero-ui" data-section="case-demo">
          <ProjectDemo kind={project.demo} />
          <p className="caption">{demoCaption[project.demo]}</p>
        </Reveal>
      </div>

      <div className="shell" data-tone="light" data-section="case-story">
        <Block title="The situation">
          <p>{project.context}</p>
        </Block>
        <Block title="What was going wrong">
          <List items={project.problem} />
        </Block>
        <Block title="How the work was structured">
          <List items={project.approach} />
        </Block>

        {capstone && (
          <>
            <Wide title="The plan" note="The main phases of the team’s 225-day MS Project plan, with its three reviews.">
              <PlanTimeline />
            </Wide>
            <Block title="Risks, as they played out">
              <RiskRegister />
            </Block>
          </>
        )}

        <Block title="What was built">
          <List items={project.solution} />
        </Block>

        {project.demo === 'launch' && (
          <Wide title="The real screens" note="The running system in its demo mode. Pick a step, or let it play.">
            <Walkthrough
              steps={launchSteps}
              track="launch"
              app="Launch Engine"
              context="Reference launch"
              pill="Real screens"
              aspect="1440 / 900"
            />
          </Wide>
        )}

        {project.gallery && (
          <Wide title="What it produced" note="The landing page from the reference launch, on a desktop and a phone, and one agent’s own page.">
            <div className="cs-gallery">
              {project.gallery.map((g) => (
                <figure
                  key={g.src}
                  className="cs-shot"
                  style={{ ['--span' as string]: g.span }}
                  data-portrait={g.height > g.width ? '' : undefined}
                >
                  <div className="cs-shot__pic">
                    <Image
                      src={g.src}
                      alt={g.alt}
                      width={g.width}
                      height={g.height}
                      sizes={`(max-width: 900px) 100vw, ${Math.round((g.span / 12) * 100)}vw`}
                    />
                  </div>
                  <figcaption className="caption">{g.caption}</figcaption>
                </figure>
              ))}
            </div>
          </Wide>
        )}

        {capstone && (
          <>
            <Wide title="The results" note="Measured on records the models never saw in training, as reported in the project book.">
              <SafeBuildResults />
            </Wide>
            <Wide title="From the project files" note="Figures and screens as the team submitted them.">
              <div className="cs-files">
                {safebuildFiles.map((f) => (
                  <figure key={f.src} className="cs-file">
                    <div className="cs-file__pic">
                      <Image src={f.src} alt={f.alt} width={f.width} height={f.height} sizes="(max-width: 900px) 100vw, 50vw" />
                    </div>
                    <figcaption className="caption">{f.caption}</figcaption>
                  </figure>
                ))}
              </div>
            </Wide>
          </>
        )}

        <Block title="What changed">
          <List items={project.outcome} />
        </Block>
        <Block title="Skills in use">
          <p className="muted" style={{ fontSize: 'var(--step-body)', lineHeight: 1.6 }}>
            {project.skills.join(', ')}.
          </p>
        </Block>
      </div>

      <Link href={`/projects/${next.slug}`} className="cs-next" data-tone="deep">
        <strong>{next.shortTitle}</strong>
        <span>
          Next case study <Arrow />
        </span>
      </Link>
    </article>
  );
}

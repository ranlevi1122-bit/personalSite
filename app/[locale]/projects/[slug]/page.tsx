import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getContent } from '@/data/content';
import { ui } from '@/data/ui';
import { isLocale, localePath, locales, type Locale } from '@/lib/i18n';
import { projects as allProjects } from '@/data/portfolioData';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Reveal';
import { Arrow } from '@/components/ui/Arrow';
import { ProjectDemo } from '@/components/demos/ProjectDemo';
import { PlanTimeline, RiskRegister, SafeBuildResults } from '@/components/demos/SafeBuild';
import { Walkthrough } from '@/components/demos/Walkthrough';

type Params = Promise<{ locale: string; slug: string }>;

export function generateStaticParams() {
  return locales.flatMap((locale) => allProjects.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const { person, projectBySlug, seo } = getContent(locale);
  const project = projectBySlug(slug);
  if (!project) return { title: ui(locale).caseStudy.notFound };

  const description = `${project.positioning} ${project.context}`.slice(0, 180);
  const path = localePath(locale, `/projects/${project.slug}`);

  return {
    title: project.title,
    description,
    alternates: {
      canonical: path,
      languages: { en: `/projects/${project.slug}`, he: `/he/projects/${project.slug}` },
    },
    openGraph: {
      type: 'article',
      title: `${project.title} | ${person.name}`,
      description,
      url: `${seo.url}${path.slice(1)}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${project.title} | ${person.name}`,
      description,
    },
  };
}

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

export default async function ProjectPage({ params }: { params: Params }) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const { launchSteps, projectBySlug, projects, safebuildFiles } = getContent(locale);
  const t = ui(locale).caseStudy;
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
              {t.builtWith}
            </span>
            <span className="cs-fact__label" dir="ltr">
              {project.tech.join(', ')}
            </span>
          </StaggerItem>
          <StaggerItem as="li" className="cs-fact">
            <span className="cs-fact__label" style={{ marginTop: 0, color: 'var(--fg-c)' }}>
              {t.kind}
            </span>
            <span className="cs-fact__label">{project.category}</span>
          </StaggerItem>
        </Stagger>

        <Reveal className="cs-hero-ui" data-section="case-demo">
          <ProjectDemo kind={project.demo} />
          <p className="caption">{t.caption[project.demo]}</p>
        </Reveal>
      </div>

      <div className="shell" data-tone="light" data-section="case-story">
        <Block title={t.situation}>
          <p>{project.context}</p>
        </Block>
        <Block title={t.wrong}>
          <List items={project.problem} />
        </Block>
        <Block title={t.structured}>
          <List items={project.approach} />
        </Block>

        {capstone && (
          <>
            <Wide title={t.plan.title} note={t.plan.note}>
              <PlanTimeline />
            </Wide>
            <Block title={t.risks}>
              <RiskRegister />
            </Block>
          </>
        )}

        <Block title={t.built}>
          <List items={project.solution} />
        </Block>

        {project.demo === 'launch' && (
          <Wide title={t.screens.title} note={t.screens.note}>
            <Walkthrough
              steps={launchSteps}
              track="launch"
              app="Launch Engine"
              context={locale === 'he' ? 'השקת הדוגמה' : 'Reference launch'}
              pill={locale === 'he' ? 'מסכים אמיתיים' : 'Real screens'}
              aspect="1440 / 900"
            />
          </Wide>
        )}

        {project.gallery && (
          <Wide title={t.produced.title} note={t.produced.note}>
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
            <Wide title={t.results.title} note={t.results.note}>
              <SafeBuildResults />
            </Wide>
            <Wide title={t.files.title} note={t.files.note}>
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

        <Block title={t.changed}>
          <List items={project.outcome} />
        </Block>
        <Block title={t.skills}>
          <p className="muted" style={{ fontSize: 'var(--step-body)', lineHeight: 1.6 }}>
            {project.skills.join(', ')}.
          </p>
        </Block>
      </div>

      <Link href={localePath(locale, `/projects/${next.slug}`)} className="cs-next" data-tone="deep">
        <strong>{next.shortTitle}</strong>
        <span>
          {t.next} <Arrow />
        </span>
      </Link>
    </article>
  );
}

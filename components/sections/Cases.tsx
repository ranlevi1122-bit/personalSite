import Link from 'next/link';
import { getContent } from '@/data/content';
import { ui } from '@/data/ui';
import { localePath, type Locale } from '@/lib/i18n';
import { ProjectDemo } from '@/components/demos/ProjectDemo';
import { Reveal } from '@/components/ui/Reveal';
import { Lines } from '@/components/ui/Lines';
import { Arrow } from '@/components/ui/Arrow';

/**
 * The five case studies, the live object and the summary side by side,
 * alternating. Each object sweeps open as it comes into view and plays by
 * itself while it is on screen.
 */
export function Cases({ locale }: { locale: Locale }) {
  const { caseRoles, projects } = getContent(locale);
  const t = ui(locale).cases;
  return (
    <section id="work" data-section="work" className="section" aria-labelledby="work-title" data-tone="light">
      <div className="shell">
        <div className="grid12 sec-head">
          <Lines id="work-title" lines={t.title} />
          <Reveal as="div" className="sec-head__note">
            <p>{t.note}</p>
          </Reveal>
        </div>

        <ol className="cases">
          {projects.map((p) => {
            const href = localePath(locale, `/projects/${p.slug}`);
            return (
              <Reveal key={p.slug} as="li" className="case grid12">
                <div className="case__media">
                  <ProjectDemo kind={p.demo} mode="preview" />
                  <Link href={href} className="case__cover" tabIndex={-1} aria-hidden="true" data-track={t.preview(p.shortTitle)} />
                </div>
                <div className="case__body">
                  <h3 className="case__title">{p.title}</h3>
                  <p className="case__kind">{p.category}</p>
                  <p className="case__line">{p.positioning}</p>
                  <dl className="case__facts">
                    {p.metrics.map((m) => (
                      <div key={m.label}>
                        <dt className="tnum">{m.value}</dt>
                        <dd>{m.label}</dd>
                      </div>
                    ))}
                  </dl>
                  <div>
                    <p className="case__role">
                      <b>{t.role}</b> {caseRoles[p.slug]}
                    </p>
                    <Link href={href} className="arrow-link">
                      {t.open(p.demo)} <Arrow />
                    </Link>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

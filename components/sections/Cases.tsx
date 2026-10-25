import Link from 'next/link';
import { caseRoles, projects } from '@/data/portfolioData';
import { ProjectDemo } from '@/components/demos/ProjectDemo';
import { Reveal } from '@/components/ui/Reveal';
import { Lines } from '@/components/ui/Lines';
import { Arrow } from '@/components/ui/Arrow';

/**
 * The four case studies, the live object and the summary side by side,
 * alternating. Each object sweeps open as it comes into view and plays by
 * itself while it is on screen.
 */
export function Cases() {
  return (
    <section id="work" data-section="work" className="section" aria-labelledby="work-title" data-tone="light">
      <div className="shell">
        <div className="grid12 sec-head">
          <Lines id="work-title" lines={['Case studies']} />
          <Reveal as="div" className="sec-head__note">
            <p>
              Four systems, each shown working. Three replaced a process people ran by hand; the fourth is my
              team’s capstone.
            </p>
          </Reveal>
        </div>

        <ol className="cases">
          {projects.map((p) => (
            <Reveal key={p.slug} as="li" className="case grid12">
              <div className="case__media">
                <ProjectDemo kind={p.demo} mode="preview" />
                <Link
                  href={`/projects/${p.slug}`}
                  className="case__cover"
                  tabIndex={-1}
                  aria-hidden="true"
                  data-track={`Case preview: ${p.shortTitle}`}
                />
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
                    <b>My role:</b> {caseRoles[p.slug]}
                  </p>
                  <Link href={`/projects/${p.slug}`} className="arrow-link">
                    {p.demo === 'safebuild' ? 'See the prototype and results' : 'Try it in the case study'} <Arrow />
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

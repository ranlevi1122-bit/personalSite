import Link from 'next/link';
import { getContent } from '@/data/content';
import { ui } from '@/data/ui';
import { localePath, type Locale } from '@/lib/i18n';
import { ProjectDemo } from '@/components/demos/ProjectDemo';
import { SceneSection } from '@/components/motion/SceneSection';
import { Reveal } from '@/components/ui/Reveal';
import { Lines } from '@/components/ui/Lines';
import { Arrow } from '@/components/ui/Arrow';

/**
 * The five case studies. On a desktop they are one window: the stage holds
 * still, the window shows each system's live preview in turn and the list
 * beside it moves on, like an app changing screens. On a phone, or with
 * reduced motion, they are a plain list, each with its preview.
 */
export function Cases({ locale }: { locale: Locale }) {
  const { caseRoles, projects } = getContent(locale);
  const t = ui(locale).cases;
  return (
    <SceneSection kind="work" id="work" data-section="work" className="section work" aria-labelledby="work-title" data-tone="light">
      <div className="scene-stage">
        <div className="shell work__inner">
          <div className="grid12 sec-head work__head">
            <Lines id="work-title" lines={t.title} />
            <Reveal as="div" className="sec-head__note">
              <p>{t.note}</p>
            </Reveal>
          </div>

          <nav className="work__ledger" aria-label={t.title.join(' ')}>
            <ol>
              {projects.map((p, i) => (
                <li key={p.slug}>
                  <button type="button" data-goto={i} aria-current={i === 0 ? 'true' : 'false'}>
                    <span className="work__mark" aria-hidden="true" />
                    {p.shortTitle}
                  </button>
                </li>
              ))}
            </ol>
          </nav>

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
                    <h3 className="case__title">{p.shortTitle}</h3>
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
      </div>
    </SceneSection>
  );
}

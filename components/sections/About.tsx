import Image from 'next/image';
import { getContent } from '@/data/content';
import { ui } from '@/data/ui';
import type { Locale } from '@/lib/i18n';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Reveal';
import { Lines } from '@/components/ui/Lines';
import { Arrow } from '@/components/ui/Arrow';

/** A short profile: a small portrait, the bio, key facts, experience and education. */
export function About({ locale }: { locale: Locale }) {
  const { education, experience, person, portrait, targetRoles } = getContent(locale);
  const t = ui(locale).about;
  return (
    <section id="about" data-section="about" className="section" aria-labelledby="about-title" data-tone="light">
      <div className="shell grid12 about">
        <Reveal className="about__photo">
          <Image src={portrait.src} alt={portrait.alt} fill sizes="200px" />
        </Reveal>

        <div className="about__text">
          <Lines id="about-title" lines={t.title} />
          <Reveal>
            {t.bio.map((p) => (
              <p key={p} className="about__bio">
                {p}
              </p>
            ))}
          </Reveal>

          <Stagger as="dl" className="about__facts" gap={0.08}>
            <StaggerItem>
              <dt>{t.based}</dt>
              <dd>{person.location}</dd>
            </StaggerItem>
            <StaggerItem>
              <dt>{t.languages}</dt>
              <dd>{person.languages.join(t.and)}</dd>
            </StaggerItem>
            <StaggerItem>
              <dt>{t.open}</dt>
              <dd>{targetRoles[0]}</dd>
            </StaggerItem>
          </Stagger>

          <Reveal className="about__cols">
            <div>
              <h3>{t.experience}</h3>
              <ul>
                {experience.map((e) => (
                  <li key={e.role}>
                    {e.role}
                    <span>
                      {e.org}, {e.period}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>{t.education}</h3>
              <ul>
                {education.map((e) => (
                  <li key={e.degree}>
                    {e.degree}
                    <span>
                      {e.institution}, {e.period}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal className="about__cv">
            <a href={person.resumeHref} className="btn" target="_blank" rel="noreferrer">
              {t.cv}
              <Arrow />
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

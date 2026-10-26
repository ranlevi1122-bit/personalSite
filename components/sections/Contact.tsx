import { getContent } from '@/data/content';
import { ui } from '@/data/ui';
import type { Locale } from '@/lib/i18n';
import { Reveal } from '@/components/ui/Reveal';
import { Lines } from '@/components/ui/Lines';
import { Arrow } from '@/components/ui/Arrow';

/** The close of the page: one invitation, one action, and every way to reach Ran. */
export function Contact({ locale }: { locale: Locale }) {
  const { person } = getContent(locale);
  const t = ui(locale).contact;
  const subject = encodeURIComponent(ui(locale).hero.subject);

  return (
    <section id="contact" data-section="contact" className="section" aria-labelledby="contact-title" data-tone="dark">
      <div className="shell grid12 contact__inner">
        <div className="contact__text">
          <Lines id="contact-title" lines={t.title} />
          <Reveal>
            <p>{t.body}</p>
            <div className="contact__actions">
              <a className="btn" href={`mailto:${person.email}?subject=${subject}`}>
                {t.email}
                <Arrow />
              </a>
              <a className="arrow-link" href={person.linkedin} target="_blank" rel="noreferrer">
                {t.linkedin} <Arrow dir="up-right" />
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal as="div" className="contact__details">
          <dl style={{ margin: 0 }}>
            <div>
              <dt>{t.labels.email}</dt>
              <dd>
                <a href={`mailto:${person.email}`}>{person.email}</a>
              </dd>
            </div>
            <div>
              <dt>{t.labels.phone}</dt>
              <dd>
                <a href={person.phoneHref} className="tnum" dir="ltr">
                  {person.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt>{t.labels.linkedin}</dt>
              <dd>
                <a href={person.linkedin} target="_blank" rel="noreferrer" dir="ltr">
                  ranlevi123
                </a>
              </dd>
            </div>
            <div>
              <dt>{t.labels.github}</dt>
              <dd>
                <a href={person.github} target="_blank" rel="noreferrer" dir="ltr">
                  ranlevi1122-bit
                </a>
              </dd>
            </div>
            <div>
              <dt>{t.labels.cv}</dt>
              <dd>
                <a href={person.resumeHref} target="_blank" rel="noreferrer">
                  {t.download}
                </a>
              </dd>
            </div>
          </dl>
        </Reveal>
      </div>
    </section>
  );
}

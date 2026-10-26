import Link from 'next/link';
import { getContent } from '@/data/content';
import { ui } from '@/data/ui';
import { localePath, type Locale } from '@/lib/i18n';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Reveal';
import { Lines } from '@/components/ui/Lines';

/** What Ran does: project management first, then implementing and building AI. */
export function Services({ locale }: { locale: Locale }) {
  const { services } = getContent(locale);
  const t = ui(locale).services;
  return (
    <section id="services" data-section="services" className="section" aria-labelledby="services-title" data-tone="light">
      <div className="shell">
        <div className="grid12 sec-head">
          <Lines id="services-title" lines={t.title} />
          <Reveal as="div" className="sec-head__note">
            <p>{t.note}</p>
          </Reveal>
        </div>

        <Stagger as="ul" className="grid12 services" gap={0.1}>
          {services.map((s) => {
            const external = s.proof.href.startsWith('http');
            return (
              <StaggerItem key={s.title} as="li" className="service">
                <h3>{s.title}</h3>
                <p>{s.body}</p>
                <ul>
                  {s.points.map((pt) => (
                    <li key={pt}>{pt}</li>
                  ))}
                </ul>
                <p className="service__tools">
                  <b>{t.tools}</b>
                  {s.tools.join(', ')}
                </p>
                <div className="service__proof">
                  <Link
                    href={localePath(locale, s.proof.href)}
                    className="proof-link"
                    {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
                  >
                    {s.proof.label}
                  </Link>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}

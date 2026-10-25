import Link from 'next/link';
import { services } from '@/data/portfolioData';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Reveal';
import { Lines } from '@/components/ui/Lines';

/** What Ran does: project management first, then implementing and building AI. */
export function Services() {
  return (
    <section id="services" data-section="services" className="section" aria-labelledby="services-title" data-tone="light">
      <div className="shell">
        <div className="grid12 sec-head">
          <Lines id="services-title" lines={['What I do']} />
          <Reveal as="div" className="sec-head__note">
            <p>Three roles that meet in one project: running it, bringing AI into it, and building what it needs.</p>
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
                  <b>Tools</b>
                  {s.tools.join(', ')}
                </p>
                <div className="service__proof">
                  <Link
                    href={s.proof.href}
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

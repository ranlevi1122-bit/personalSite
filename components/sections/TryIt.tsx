import Link from 'next/link';
import { ui } from '@/data/ui';
import { localePath, type Locale } from '@/lib/i18n';
import { Reveal } from '@/components/ui/Reveal';
import { Lines } from '@/components/ui/Lines';
import { Arrow } from '@/components/ui/Arrow';
import { Scheduler } from '@/components/demos/Scheduler';

/**
 * One system to work by hand: the scheduler, with its checks, its fairness
 * table and its assistant, on invented names.
 */
export function TryIt({ locale }: { locale: Locale }) {
  const t = ui(locale).tryIt;
  return (
    <section id="demo" data-section="demo" className="section" aria-labelledby="demo-title" data-tone="stone">
      <div className="shell">
        <div className="grid12 sec-head">
          <Lines id="demo-title" lines={t.title} />
          <Reveal as="div" className="sec-head__note">
            <p>{t.note}</p>
          </Reveal>
        </div>
        <Reveal className="tryit">
          <Scheduler />
          <Link href={localePath(locale, '/projects/workforce-planning')} className="arrow-link tryit__link">
            {t.link} <Arrow />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

import { getContent } from '@/data/content';
import { ui } from '@/data/ui';
import type { Locale } from '@/lib/i18n';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Reveal';
import { Lines } from '@/components/ui/Lines';
import { CountUp } from '@/components/ui/CountUp';
import { Arrow } from '@/components/ui/Arrow';

/** The outcomes, as four figures that count up once they are in view, and the way on to the next chapter. */
export function Results({ locale }: { locale: Locale }) {
  const { kpis } = getContent(locale);
  const t = ui(locale).results;
  return (
    <section className="section" data-section="results" aria-labelledby="results-title" data-tone="dark">
      <div className="shell">
        <div className="grid12 sec-head">
          <Lines id="results-title" lines={t.title} />
        </div>
        <Stagger as="ul" className="grid12 kpis" gap={0.12}>
          {kpis.map((k) => (
            <StaggerItem key={k.label} as="li" className="kpi">
              <b>
                <CountUp value={k.value} prefix={k.prefix} suffix={k.suffix} />
              </b>
              <i aria-hidden="true" />
              <span>{k.label}</span>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal className="chapter-next">
          <a href="#process" className="arrow-link">
            {t.next} <Arrow />
          </a>
        </Reveal>
      </div>
    </section>
  );
}

import { getContent } from '@/data/content';
import { ui } from '@/data/ui';
import type { Locale } from '@/lib/i18n';
import { Stagger, StaggerItem } from '@/components/ui/Reveal';
import { Lines } from '@/components/ui/Lines';
import { CountUp } from '@/components/ui/CountUp';

/** The outcomes, as four figures that count up once they are in view. */
export function Results({ locale }: { locale: Locale }) {
  const { kpis } = getContent(locale);
  return (
    <section className="section" data-section="results" aria-labelledby="results-title" data-tone="dark">
      <div className="shell">
        <div className="grid12 sec-head">
          <Lines id="results-title" lines={ui(locale).results.title} />
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
      </div>
    </section>
  );
}

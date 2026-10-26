import { getContent } from '@/data/content';
import { ui } from '@/data/ui';
import type { Locale } from '@/lib/i18n';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Reveal';
import { Lines } from '@/components/ui/Lines';

/** How Ran runs a project: six steps on one line that draws itself in. */
export function Process({ locale }: { locale: Locale }) {
  const { processSteps } = getContent(locale);
  const t = ui(locale).process;
  return (
    <section id="process" data-section="process" className="section" aria-labelledby="process-title" data-tone="stone">
      <div className="shell">
        <div className="grid12 sec-head">
          <Lines id="process-title" lines={t.title} />
          <Reveal as="div" className="sec-head__note">
            <p>{t.note}</p>
          </Reveal>
        </div>

        <Stagger as="ol" className="process">
          <StaggerItem as="li" className="process__line" index={0}>
            <i aria-hidden="true" />
          </StaggerItem>
          {processSteps.map((s, i) => (
            <StaggerItem key={s.title} as="li" className="step" index={i + 1}>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

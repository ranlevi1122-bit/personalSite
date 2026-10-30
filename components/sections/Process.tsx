import { getContent } from '@/data/content';
import { ui } from '@/data/ui';
import type { Locale } from '@/lib/i18n';
import { SceneSection } from '@/components/motion/SceneSection';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Reveal';
import { Lines } from '@/components/ui/Lines';

/**
 * How Ran runs a project: six steps on one line. On a desktop the stage holds
 * and the line slides past, drawing itself and lighting each step as it is
 * reached; elsewhere the steps are a plain list.
 */
export function Process({ locale }: { locale: Locale }) {
  const { processSteps } = getContent(locale);
  const t = ui(locale).process;
  return (
    <SceneSection kind="process" id="process" data-section="process" className="section process-scene" aria-labelledby="process-title" data-tone="stone">
      <div className="scene-stage">
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
      </div>
    </SceneSection>
  );
}

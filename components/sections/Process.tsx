import { processSteps } from '@/data/portfolioData';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Reveal';
import { Lines } from '@/components/ui/Lines';

/** How Ran runs a project: six steps on one line that draws itself in. */
export function Process() {
  return (
    <section id="process" data-section="process" className="section" aria-labelledby="process-title" data-tone="stone">
      <div className="shell">
        <div className="grid12 sec-head">
          <Lines id="process-title" lines={['How I run', 'a project']} />
          <Reveal as="div" className="sec-head__note">
            <p>The same six steps on every project, with AI doing the building in the middle of it.</p>
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

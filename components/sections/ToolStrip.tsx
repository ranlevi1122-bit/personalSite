import { toolStrip } from '@/data/portfolioData';

/**
 * The tools Ran delivers with, running slowly past. The list is rendered
 * twice so the loop is seamless; the copy is hidden from assistive tech.
 */
export function ToolStrip() {
  return (
    <section className="strip" aria-label="Tools I deliver with" data-tone="dark">
      <p className="strip__label">Tools I deliver with</p>
      <div className="strip__window">
        <div className="strip__track">
          <ul style={{ display: 'flex', listStyle: 'none', margin: 0, padding: 0 }}>
            {toolStrip.map((t) => (
              <li key={t} className="strip__item">
                {t}
              </li>
            ))}
          </ul>
          <ul style={{ display: 'flex', listStyle: 'none', margin: 0, padding: 0 }} aria-hidden="true">
            {toolStrip.map((t) => (
              <li key={t} className="strip__item">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

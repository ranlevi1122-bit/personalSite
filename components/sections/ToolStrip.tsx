import { getContent } from '@/data/content';
import { ui } from '@/data/ui';
import type { Locale } from '@/lib/i18n';

/**
 * The tools Ran delivers with, running slowly past. The list is rendered
 * twice so the loop is seamless; the copy is hidden from assistive tech.
 */
export function ToolStrip({ locale }: { locale: Locale }) {
  const { toolStrip } = getContent(locale);
  const label = ui(locale).strip;
  return (
    <section className="strip" aria-label={label} data-tone="dark">
      <p className="strip__label">{label}</p>
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

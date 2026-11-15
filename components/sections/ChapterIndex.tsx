import { ui } from '@/data/ui';
import type { Locale } from '@/lib/i18n';

/**
 * The page's six chapters, numbered, straight after the opening: a contents
 * line that says what is coming and takes the reader to any of it.
 */
export function ChapterIndex({ locale }: { locale: Locale }) {
  const t = ui(locale).chapters;
  return (
    <nav className="chapters" aria-label={t.label} data-tone="dark">
      <ol className="shell chapters__list">
        {t.list.map((c) => (
          <li key={c.id}>
            <a href={`#${c.id}`}>
              <span className="chapters__n tnum">{c.n}</span>
              {c.name}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

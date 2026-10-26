import Image from 'next/image';
import { getContent } from '@/data/content';
import { ui } from '@/data/ui';
import { localePath, type Locale } from '@/lib/i18n';
import { StatusCard } from '@/components/StatusCard';
import { Arrow } from '@/components/ui/Arrow';

/**
 * The first screen: what Ran delivers, in one line; the pitch; two actions;
 * a business-card line with a small portrait; and beside it, a live project
 * status card.
 */
export function Hero({ locale }: { locale: Locale }) {
  const { person, portrait, positioning } = getContent(locale);
  const t = ui(locale).hero;

  return (
    <section className="hero" data-section="hero" aria-labelledby="hero-title" data-tone="stone">
      <div className="hero__inner grid12 shell">
        <div className="hero__text">
          <h1 id="hero-title" className="hero__title t-display">
            {positioning.headline.map((line) => (
              <span key={line} className="lm">
                <span>{line}</span>
              </span>
            ))}
          </h1>
          <p className="hero__sentence">{positioning.sentence}</p>
          <div className="hero__actions">
            <a href={`mailto:${person.email}?subject=${encodeURIComponent(t.subject)}`} className="btn">
              {t.email}
              <Arrow />
            </a>
            <a href={localePath(locale, '/#work')} className="arrow-link">
              {t.cases} <Arrow />
            </a>
          </div>
          <div className="byline">
            <span className="byline__photo">
              <Image src={portrait.src} alt={portrait.alt} fill sizes="60px" priority />
            </span>
            <span>
              <span className="byline__name">{person.name}</span>
              <span className="byline__roles">{t.roles(positioning.roles)}</span>
            </span>
          </div>
        </div>

        <div className="hero__card">
          <StatusCard />
        </div>
      </div>
    </section>
  );
}

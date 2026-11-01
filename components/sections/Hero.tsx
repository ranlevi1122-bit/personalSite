import { getContent } from '@/data/content';
import { ui } from '@/data/ui';
import type { ProjectSlug } from '@/data/portfolioData';
import { localePath, type Locale } from '@/lib/i18n';
import { HeroScene, type HeroScreen } from '@/components/sections/HeroScene';

/**
 * The first screen: what Ran delivers, the pitch and the action, at the mouth
 * of a tunnel of the systems he delivered, shown by their real screens. As
 * the page scrolls, the camera flies down it and stops at the scheduler.
 */

type Shot = { src: string; slug: ProjectSlug; w: number; h: number };

/** The screens passed on the way, in the order they come; each opens its case study. */
const PASSING: Shot[] = [
  { src: '/work/launch-engine/landing-hero.jpg', slug: 'launch-engine', w: 2880, h: 1800 },
  { src: '/work/screens/booking.jpg', slug: 'facility-management', w: 2684, h: 956 },
  { src: '/work/safebuild/why-this-score.png', slug: 'risk-prediction', w: 1914, h: 881 },
  { src: '/work/screens/analyst.jpg', slug: 'ai-data-analyst', w: 2684, h: 1518 },
  { src: '/work/screens/launch-run.jpg', slug: 'launch-engine', w: 2684, h: 1350 },
  { src: '/work/safebuild/report.png', slug: 'risk-prediction', w: 1920, h: 888 },
];

/** The screen at the end of the tunnel, which the next section shows at work. */
const LAST: Shot = { src: '/work/screens/scheduler.jpg', slug: 'workforce-planning', w: 2684, h: 1277 };

export function Hero({ locale }: { locale: Locale }) {
  const { person, portrait, positioning, projectBySlug } = getContent(locale);
  const t = ui(locale).hero;

  const screen = (s: Shot): HeroScreen => {
    const p = projectBySlug(s.slug)!;
    return { ...s, href: localePath(locale, `/projects/${s.slug}`), title: p.shortTitle, alt: t.screenAlt(p.shortTitle) };
  };

  return (
    <HeroScene
      headline={positioning.headline}
      sentence={positioning.sentence}
      email={{ href: `mailto:${person.email}?subject=${encodeURIComponent(t.subject)}`, label: t.email }}
      cases={{ href: localePath(locale, '/#work'), label: t.cases }}
      byline={{ name: person.name, roles: t.roles(positioning.roles), photo: portrait.src, photoAlt: portrait.alt }}
      screens={PASSING.map(screen)}
      last={screen(LAST)}
      screensLabel={t.screensLabel}
    />
  );
}

import type { ReactNode } from 'react';
import { Analytics } from '@/components/Analytics';
import { Footer } from '@/components/Footer';
import { HideOn } from '@/components/HideOn';
import { LocaleProvider } from '@/components/LocaleProvider';
import { Nav } from '@/components/Nav';
import { SmoothScroll } from '@/components/motion/SmoothScroll';
import type { Locale } from '@/lib/i18n';

/**
 * Chrome shared by every route: the bar, the page, the footer, and the
 * analytics listener, in the page's language. The private /stats screen has
 * its own shell, so the bar and footer stay off it.
 */
export function SiteChrome({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <LocaleProvider locale={locale}>
      <HideOn prefix="/stats">
        <Nav />
      </HideOn>
      {/* tabIndex={-1} makes this a valid destination for the skip link. */}
      <main id="main" tabIndex={-1} style={{ outline: 'none' }}>
        {children}
      </main>
      <HideOn prefix="/stats">
        <Footer locale={locale} />
      </HideOn>
      <SmoothScroll />
      <Analytics />
    </LocaleProvider>
  );
}

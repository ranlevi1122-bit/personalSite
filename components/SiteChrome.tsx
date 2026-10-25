import type { ReactNode } from 'react';
import { Analytics } from '@/components/Analytics';
import { Footer } from '@/components/Footer';
import { HideOn } from '@/components/HideOn';
import { Nav } from '@/components/Nav';

/**
 * Chrome shared by every route: the bar, the page, the footer, and the
 * analytics listener. The private /stats screen has its own shell, so the
 * bar and footer stay off it.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <HideOn prefix="/stats">
        <Nav />
      </HideOn>
      {/* tabIndex={-1} makes this a valid destination for the skip link. */}
      <main id="main" tabIndex={-1} style={{ outline: 'none' }}>
        {children}
      </main>
      <HideOn prefix="/stats">
        <Footer />
      </HideOn>
      <Analytics />
    </>
  );
}

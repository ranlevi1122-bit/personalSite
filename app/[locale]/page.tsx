import { About } from '@/components/sections/About';
import { Cases } from '@/components/sections/Cases';
import { Contact } from '@/components/sections/Contact';
import { Hero } from '@/components/sections/Hero';
import { Process } from '@/components/sections/Process';
import { Results } from '@/components/sections/Results';
import { Services } from '@/components/sections/Services';
import { ToolStrip } from '@/components/sections/ToolStrip';
import { TryIt } from '@/components/sections/TryIt';
import type { Locale } from '@/lib/i18n';

/**
 * A business page, in the order a client reads one:
 *
 *  Hero      what Ran delivers, over a curved wall of the systems' real
 *            screens; the camera moves into one of them (a scroll scene)
 *  Tools     the stack, running past
 *  Services  project management, AI implementation, AI building
 *  Results   four figures that stayed in use
 *  Process   how a project runs, on a line that slides past (a scene)
 *  Try it    the scheduler, to work by hand
 *  Work      the five case studies in one window that changes screens (a scene)
 *  About     the person, briefly
 *  Contact   one invitation and every way to reach him
 *
 * Each scene has a quiet section on either side, so each one lands.
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  return (
    <>
      <Hero locale={locale} />
      <ToolStrip locale={locale} />
      <Services locale={locale} />
      <Results locale={locale} />
      <Process locale={locale} />
      <TryIt locale={locale} />
      <Cases locale={locale} />
      <About locale={locale} />
      <Contact locale={locale} />
    </>
  );
}

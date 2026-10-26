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
 *  Hero      what Ran delivers, and a live project status card
 *  Tools     the stack, running past
 *  Services  project management, AI implementation, AI building
 *  Results   four figures that stayed in use
 *  Try it    the scheduler, to work by hand
 *  Work      the five case studies, each with its live object
 *  Process   how a project runs, step by step
 *  About     the person, briefly
 *  Contact   one invitation and every way to reach him
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  return (
    <>
      <Hero locale={locale} />
      <ToolStrip locale={locale} />
      <Services locale={locale} />
      <Results locale={locale} />
      <TryIt locale={locale} />
      <Cases locale={locale} />
      <Process locale={locale} />
      <About locale={locale} />
      <Contact locale={locale} />
    </>
  );
}

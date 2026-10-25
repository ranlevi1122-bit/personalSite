import { About } from '@/components/sections/About';
import { Cases } from '@/components/sections/Cases';
import { Contact } from '@/components/sections/Contact';
import { Hero } from '@/components/sections/Hero';
import { Process } from '@/components/sections/Process';
import { Results } from '@/components/sections/Results';
import { Services } from '@/components/sections/Services';
import { ToolStrip } from '@/components/sections/ToolStrip';
import { TryIt } from '@/components/sections/TryIt';

/**
 * A business page, in the order a client reads one:
 *
 *  Hero      what Ran delivers, and a live project status card
 *  Tools     the stack, running past
 *  Services  project management, AI implementation, AI building
 *  Results   four figures that stayed in use
 *  Try it    the scheduler, to work by hand
 *  Work      the four case studies, each with its live object
 *  Process   how a project runs, step by step
 *  About     the person, briefly
 *  Contact   one invitation and every way to reach him
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <ToolStrip />
      <Services />
      <Results />
      <TryIt />
      <Cases />
      <Process />
      <About />
      <Contact />
    </>
  );
}

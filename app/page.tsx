import { About } from '@/components/sections/About';
import { Contact } from '@/components/sections/Contact';
import { Experience } from '@/components/sections/Experience';
import { Hero } from '@/components/sections/Hero';
import { Impact } from '@/components/sections/Impact';
import { SelectedWork } from '@/components/sections/SelectedWork';
import { SkillsEcosystem } from '@/components/sections/SkillsEcosystem';
import { ValueProps } from '@/components/sections/ValueProps';

/**
 * The narrative order is deliberate:
 *
 *  10 seconds  — hero positioning and the three verified proof points
 *  60 seconds  — capabilities, the work itself, the numbers
 *  3–5 minutes — experience, the full ecosystem, principles, case studies
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <ValueProps />
      <SelectedWork />
      <Impact />
      <Experience />
      <SkillsEcosystem />
      <About />
      <Contact />
    </>
  );
}

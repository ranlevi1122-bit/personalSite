import Image from 'next/image';
import { education, experience, person, portrait, targetRoles } from '@/data/portfolioData';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Reveal';
import { Lines } from '@/components/ui/Lines';
import { Arrow } from '@/components/ui/Arrow';

/** A short profile: a small portrait, the bio, key facts, experience and education. */
export function About() {
  return (
    <section id="about" data-section="about" className="section" aria-labelledby="about-title" data-tone="light">
      <div className="shell grid12 about">
        <Reveal className="about__photo">
          <Image src={portrait.src} alt={portrait.alt} fill sizes="200px" />
        </Reveal>

        <div className="about__text">
          <Lines id="about-title" lines={['About']} />
          <Reveal>
            <p className="about__bio">
              I manage digital projects end to end: I map the process, write the requirements, build or implement
              the tool with AI, and stay until people use it.
            </p>
            <p className="about__bio">
              I am in my fourth year of Industrial Engineering and Management at Afeka, where I also assist in
              teaching Arduino I. In the reserves I command a combat and rescue platoon: mission planning,
              logistics, and a team to organise under time pressure.
            </p>
          </Reveal>

          <Stagger as="dl" className="about__facts" gap={0.08}>
            <StaggerItem>
              <dt>Based in</dt>
              <dd>{person.location}</dd>
            </StaggerItem>
            <StaggerItem>
              <dt>Languages</dt>
              <dd>{person.languages.join(' and ')}</dd>
            </StaggerItem>
            <StaggerItem>
              <dt>Open to</dt>
              <dd>{targetRoles[0]}</dd>
            </StaggerItem>
          </Stagger>

          <Reveal className="about__cols">
            <div>
              <h3>Experience</h3>
              <ul>
                {experience.map((e) => (
                  <li key={e.role}>
                    {e.role}
                    <span>
                      {e.org}, {e.period}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Education</h3>
              <ul>
                {education.map((e) => (
                  <li key={e.degree}>
                    {e.degree}
                    <span>
                      {e.institution}, {e.period}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal className="about__cv">
            <a href={person.resumeHref} className="btn" target="_blank" rel="noreferrer">
              Download my CV
              <Arrow />
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

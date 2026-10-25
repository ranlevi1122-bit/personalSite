import { person } from '@/data/portfolioData';
import { Reveal } from '@/components/ui/Reveal';
import { Lines } from '@/components/ui/Lines';
import { Arrow } from '@/components/ui/Arrow';

/** The close of the page: one invitation, one action, and every way to reach Ran. */
export function Contact() {
  const subject = encodeURIComponent('Hello Ran');

  return (
    <section id="contact" data-section="contact" className="section" aria-labelledby="contact-title" data-tone="dark">
      <div className="shell grid12 contact__inner">
        <div className="contact__text">
          <Lines id="contact-title" lines={['Have a project that', 'should run better?']} />
          <Reveal>
            <p>
              I am open to roles and projects in digital project management and AI implementation. Tell me what
              you are working on.
            </p>
            <div className="contact__actions">
              <a className="btn" href={`mailto:${person.email}?subject=${subject}`}>
                Email me
                <Arrow />
              </a>
              <a className="arrow-link" href={person.linkedin} target="_blank" rel="noreferrer">
                Connect on LinkedIn <Arrow dir="up-right" />
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal as="div" className="contact__details">
          <dl style={{ margin: 0 }}>
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${person.email}`}>{person.email}</a>
              </dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>
                <a href={person.phoneHref} className="tnum">
                  {person.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt>LinkedIn</dt>
              <dd>
                <a href={person.linkedin} target="_blank" rel="noreferrer">
                  ranlevi123
                </a>
              </dd>
            </div>
            <div>
              <dt>GitHub</dt>
              <dd>
                <a href={person.github} target="_blank" rel="noreferrer">
                  ranlevi1122-bit
                </a>
              </dd>
            </div>
            <div>
              <dt>CV</dt>
              <dd>
                <a href={person.resumeHref} target="_blank" rel="noreferrer">
                  Download PDF
                </a>
              </dd>
            </div>
          </dl>
        </Reveal>
      </div>
    </section>
  );
}

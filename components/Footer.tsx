import Link from 'next/link';
import { navLinks, person } from '@/data/portfolioData';

/** A compact close: the name and roles, the links, and the legal line. */
export function Footer() {
  return (
    <footer className="site-foot" data-tone="deep">
      <div className="shell">
        <div className="grid12 site-foot__top">
          <div className="site-foot__brand">
            <b>{person.name}</b>
            <span>Digital project manager, AI implementer and AI builder</span>
          </div>
          <div className="footer-col">
            <h2>On this site</h2>
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </div>
          <div className="footer-col">
            <h2>Contact</h2>
            <a href={`mailto:${person.email}`}>Email</a>
            <a href={person.phoneHref}>Phone</a>
            <a href={person.resumeHref} target="_blank" rel="noreferrer">
              CV
            </a>
          </div>
          <div className="footer-col">
            <h2>Elsewhere</h2>
            <a href={person.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            <a href={person.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </div>
        <div className="site-foot__legal">
          <span>© {new Date().getFullYear()} {person.name}</span>
          <span>Visits are counted anonymously: no IP addresses, no advertising cookies, and Do Not Track is honoured.</span>
          <span>Built with Next.js and Claude Code</span>
        </div>
      </div>
    </footer>
  );
}

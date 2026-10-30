import Link from 'next/link';
import { getContent } from '@/data/content';
import { ui } from '@/data/ui';
import { localePath, type Locale } from '@/lib/i18n';
import { FootName } from '@/components/motion/FootName';

/** A compact close: the name and roles, the links, and the legal line. */
export function Footer({ locale }: { locale: Locale }) {
  const { navLinks, person } = getContent(locale);
  const t = ui(locale).footer;
  return (
    <footer className="site-foot" data-tone="deep">
      <div className="shell">
        <div className="grid12 site-foot__top">
          <div className="site-foot__brand">
            <b>{person.name}</b>
            <span>{t.roles}</span>
          </div>
          <div className="footer-col">
            <h2>{t.site}</h2>
            {navLinks.map((l) => (
              <Link key={l.href} href={localePath(locale, l.href)}>
                {l.label}
              </Link>
            ))}
          </div>
          <div className="footer-col">
            <h2>{t.contact}</h2>
            <a href={`mailto:${person.email}`}>{t.email}</a>
            <a href={person.phoneHref}>{t.phone}</a>
            <a href={person.resumeHref} target="_blank" rel="noreferrer">
              {t.cv}
            </a>
          </div>
          <div className="footer-col">
            <h2>{t.elsewhere}</h2>
            <a href={person.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            <a href={person.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </div>
        <div className="site-foot__legal">
          <span>
            © {new Date().getFullYear()} {person.name}
          </span>
          <span>{t.privacy}</span>
          <span>{t.built}</span>
        </div>
      </div>
      <FootName name={person.name} />
    </footer>
  );
}

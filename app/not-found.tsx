import Link from 'next/link';
import { projects } from '@/data/portfolioData';

export default function NotFound() {
  return (
    <section className="shell" style={{ minHeight: '78svh', paddingBlock: 'clamp(64px, 10vw, 140px)' }}>
      <h1 className="t-display" style={{ fontSize: 'var(--step-display)', margin: 0, maxWidth: '12ch' }}>
        Nothing here
      </h1>
      <p className="t-lead muted" style={{ marginTop: 28, maxWidth: '30ch' }}>
        The link may be out of date. Everything on this site is reachable from these pages.
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: '48px 0 0', display: 'grid', gap: 12 }}>
        {projects.map((p) => (
          <li key={p.slug}>
            <Link className="link" href={`/projects/${p.slug}`}>
              {p.title}
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/" className="btn" style={{ marginTop: 48 }}>
        Back to the start
      </Link>
    </section>
  );
}

'use client';

import Link from 'next/link';
import { getContent } from '@/data/content';
import { ui } from '@/data/ui';
import { localePath } from '@/lib/i18n';
import { useLocale } from '@/components/LocaleProvider';

export default function NotFound() {
  const locale = useLocale();
  const { projects } = getContent(locale);
  const t = ui(locale).notFound;
  return (
    <section className="shell" style={{ minHeight: '78svh', paddingBlock: 'clamp(64px, 10vw, 140px)' }}>
      <h1 className="t-display" style={{ fontSize: 'var(--step-display)', margin: 0, maxWidth: '12ch' }}>
        {t.title}
      </h1>
      <p className="t-lead muted" style={{ marginTop: 28, maxWidth: '30ch' }}>
        {t.body}
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: '48px 0 0', display: 'grid', gap: 12 }}>
        {projects.map((p) => (
          <li key={p.slug}>
            <Link className="link" href={localePath(locale, `/projects/${p.slug}`)}>
              {p.title}
            </Link>
          </li>
        ))}
      </ul>
      <Link href={localePath(locale, '/')} className="btn" style={{ marginTop: 48 }}>
        {t.back}
      </Link>
    </section>
  );
}

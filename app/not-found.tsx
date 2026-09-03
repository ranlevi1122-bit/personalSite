import Link from 'next/link';
import { projects } from '@/data/portfolioData';

export default function NotFound() {
  return (
    <div className="shell flex min-h-[70vh] flex-col justify-center py-24">
      <span className="label label-accent">404</span>
      <h1 className="mt-6 max-w-[16ch] font-display text-[clamp(2rem,5vw,3.4rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-chalk">
        That page isn&apos;t part of the system.
      </h1>
      <p className="mt-5 max-w-[440px] text-[15px] leading-relaxed text-muted">
        The link may be out of date. Everything on this site is reachable from the work below.
      </p>

      <ul className="mt-10 grid max-w-[640px] gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.06] sm:grid-cols-2">
        {projects.map((p) => (
          <li key={p.slug} className="bg-ink-950">
            <Link
              href={`/projects/${p.slug}`}
              className="flex h-full items-center gap-2.5 px-4 py-3.5 transition-colors duration-300 hover:bg-white/[0.03]"
            >
              <span className="font-mono text-[10px] text-accent-soft/70 tnum">{p.index}</span>
              <span className="text-[13px] text-chalk">{p.shortTitle}</span>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/"
        className="mt-10 inline-flex h-11 w-fit items-center gap-2.5 rounded-full bg-chalk px-6 text-[13px] font-medium text-ink-950 transition-colors duration-300 hover:bg-white"
      >
        Back to home
      </Link>
    </div>
  );
}

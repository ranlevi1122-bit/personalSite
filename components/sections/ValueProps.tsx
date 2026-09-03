'use client';

import { capabilities, positioning } from '@/data/portfolioData';
import { LitPanel, SectionHeading } from '@/components/ui/Atoms';
import { Stagger, StaggerItem } from '@/components/ui/Reveal';

/**
 * Section 02 — the four things Ran actually does, in sequence:
 * structure the problem, build the solution, measure it, deliver it.
 */
export function ValueProps() {
  return (
    <section id="capabilities" className="relative scroll-mt-[var(--nav-h)] py-20 md:py-28">
      <div className="shell">
        <SectionHeading
          index="02"
          eyebrow="What I bring"
          title={
            <>
              {positioning.valueProposition.replace(/\.$/, '')}
              <span className="text-muted">.</span>
            </>
          }
          lead="The same four moves show up in every project: understand the process, build something that works, measure whether it helped, and get it into people's hands."
        />

        <Stagger className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4" gap={0.09}>
          {capabilities.map((c) => (
            <StaggerItem key={c.id} as="div" className="h-full">
              <LitPanel className="flex h-full flex-col p-6">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[11px] tracking-[0.16em] text-accent-soft/70 tnum">{c.index}</span>
                  <span
                    className="h-6 w-6 rounded-full border border-white/[0.08] transition-colors duration-500 group-hover/lit:border-accent/40"
                    aria-hidden="true"
                  />
                </div>

                <h3 className="mt-8 font-display text-[22px] font-semibold tracking-[-0.02em] text-chalk">
                  {c.title}
                </h3>

                {/*
                  Once the cards sit side by side, a fixed body height keeps the
                  hairline dividers on one line. Single-column mobile does not
                  need it, and would just gain dead space.
                */}
                <p className="mt-3 text-[13.5px] leading-relaxed text-muted sm:min-h-[92px] lg:min-h-[96px]">
                  {c.body}
                </p>

                <ul className="mt-5 flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-5">
                  {c.keywords.map((k) => (
                    <li
                      key={k}
                      className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-[10.5px] leading-none text-faint transition-colors duration-300 group-hover/lit:text-muted"
                    >
                      {k}
                    </li>
                  ))}
                </ul>
              </LitPanel>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

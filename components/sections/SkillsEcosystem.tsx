'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { projects, skillGroups, type ProjectSlug, type Skill } from '@/data/portfolioData';
import { Arrow, SectionHeading } from '@/components/ui/Atoms';
import { Reveal } from '@/components/ui/Reveal';
import { useReducedMotion } from '@/lib/hooks';

type Focus =
  | { kind: 'skill'; groupId: string; skill: Skill }
  | { kind: 'group'; groupId: string }
  | null;

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Section 08 — the technology ecosystem.
 *
 * No progress bars: a skill is only interesting here if it can point at the
 * work that used it. Focusing a skill (hover, tap or keyboard) lights up the
 * projects that evidence it; focusing a whole group lights up the union.
 */
export function SkillsEcosystem() {
  const [focus, setFocus] = useState<Focus>(null);
  const reduced = useReducedMotion();

  /** Projects illuminated by the current focus. */
  const litProjects = useMemo(() => {
    if (!focus) return new Set<ProjectSlug>();
    if (focus.kind === 'skill') return new Set(focus.skill.usedIn ?? []);
    const group = skillGroups.find((g) => g.id === focus.groupId);
    const set = new Set<ProjectSlug>();
    group?.skills.forEach((s) => s.usedIn?.forEach((p) => set.add(p)));
    return set;
  }, [focus]);

  const focusedSkill = focus?.kind === 'skill' ? focus.skill : null;
  const focusedGroup = focus ? skillGroups.find((g) => g.id === focus.groupId) : null;

  const clear = () => setFocus(null);

  return (
    <section id="ecosystem" className="relative scroll-mt-[var(--nav-h)] py-20 md:py-28">
      <div className="shell">
        <SectionHeading
          index="08"
          eyebrow="Technology ecosystem"
          title={
            <>
              The stack, and{' '}
              <span className="text-muted">the work that proves it.</span>
            </>
          }
          lead="Select any capability to see which projects it was actually used in. Where there is no project to point at, the tool is listed as background rather than as a claim."
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,1fr)_330px] lg:gap-12">
          {/* ------------------------------------------------------------ */}
          {/*  Groups + skills                                             */}
          {/* ------------------------------------------------------------ */}
          <div className="space-y-8" onPointerLeave={clear}>
            {skillGroups.map((group, gi) => {
              const groupDimmed = focus !== null && focus.groupId !== group.id;

              return (
                <Reveal key={group.id} mode="rise" delay={gi * 0.05}>
                  <div
                    className="transition-opacity duration-500"
                    style={{ opacity: groupDimmed ? 0.42 : 1 }}
                  >
                    <button
                      type="button"
                      className="group/head flex w-full items-baseline gap-3 text-left"
                      onPointerEnter={() => setFocus({ kind: 'group', groupId: group.id })}
                      onFocus={() => setFocus({ kind: 'group', groupId: group.id })}
                      onClick={() => setFocus({ kind: 'group', groupId: group.id })}
                      aria-label={`${group.title} — highlight related projects`}
                    >
                      <span className="font-display text-[15px] font-semibold tracking-[-0.01em] text-chalk">
                        {group.title}
                      </span>
                      <span
                        aria-hidden="true"
                        className="h-px flex-1 bg-white/[0.08] transition-colors duration-300 group-hover/head:bg-accent/40"
                      />
                      <span aria-hidden="true" className="label text-[9px]">
                        {group.skills.length}
                      </span>
                    </button>

                    <p className="mt-2 text-[12.5px] text-faint">{group.caption}</p>

                    <ul className="mt-4 flex flex-wrap gap-1.5">
                      {group.skills.map((skill) => {
                        const isFocused = focusedSkill?.name === skill.name;
                        const hasEvidence = (skill.usedIn?.length ?? 0) > 0;
                        return (
                          <li key={skill.name}>
                            <button
                              type="button"
                              onPointerEnter={() => setFocus({ kind: 'skill', groupId: group.id, skill })}
                              onFocus={() => setFocus({ kind: 'skill', groupId: group.id, skill })}
                              onClick={() => setFocus({ kind: 'skill', groupId: group.id, skill })}
                              aria-pressed={isFocused}
                              className={`chip cursor-pointer ${isFocused ? 'chip-active' : ''}`}
                            >
                              {hasEvidence && (
                                <span
                                  aria-hidden="true"
                                  className={`mr-1.5 h-1 w-1 rounded-full transition-colors duration-300 ${
                                    isFocused ? 'bg-signal' : 'bg-accent/50'
                                  }`}
                                />
                              )}
                              {skill.name}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </Reveal>
              );
            })}
          </div>

          {/* ------------------------------------------------------------ */}
          {/*  Evidence panel                                              */}
          {/* ------------------------------------------------------------ */}
          <Reveal mode="fade" delay={0.1}>
            <div className="lg:sticky lg:top-[calc(var(--nav-h)+32px)]">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.015] p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="label label-accent">Evidence</span>
                  <span className="hairline" aria-hidden="true" />
                </div>

                <div className="mt-5 min-h-[92px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={focusedSkill?.name ?? focusedGroup?.id ?? 'idle'}
                      initial={reduced ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduced ? undefined : { opacity: 0, y: -6 }}
                      transition={{ duration: 0.28, ease: EASE }}
                    >
                      {focusedSkill ? (
                        <>
                          <h3 className="font-display text-[19px] font-semibold tracking-[-0.02em] text-chalk">
                            {focusedSkill.name}
                          </h3>
                          {focusedSkill.usedIn && focusedSkill.usedIn.length > 0 ? (
                            <>
                              <p className="mt-3 text-[12px] text-faint">Used in</p>
                              <ul className="mt-2 space-y-1.5">
                                {focusedSkill.usedIn.map((slug) => {
                                  const p = projects.find((x) => x.slug === slug);
                                  if (!p) return null;
                                  return (
                                    <li key={slug}>
                                      <Link
                                        href={`/projects/${slug}`}
                                        className="tap group gap-2 text-[13px] text-chalk/90 transition-colors duration-300 hover:text-accent-soft"
                                      >
                                        <span className="font-mono text-[10px] text-accent-soft/70 tnum">{p.index}</span>
                                        {p.shortTitle}
                                        <Arrow />
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            </>
                          ) : (
                            <p className="mt-3 text-[13px] leading-relaxed text-muted">
                              {focusedSkill.note ?? 'Part of the toolkit.'}
                            </p>
                          )}
                        </>
                      ) : focusedGroup ? (
                        <>
                          <h3 className="font-display text-[19px] font-semibold tracking-[-0.02em] text-chalk">
                            {focusedGroup.title}
                          </h3>
                          <p className="mt-3 text-[13px] leading-relaxed text-muted">{focusedGroup.caption}</p>
                        </>
                      ) : (
                        <p className="text-[13px] leading-relaxed text-muted">
                          Select a capability to see the projects it was used in.
                          <span className="mt-2 block text-faint">
                            A dot marks the capabilities with project evidence on this site.
                          </span>
                        </p>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Project legend — lights up with the current focus */}
                <div className="mt-6 border-t border-white/[0.06] pt-5">
                  <p className="label mb-3">Projects</p>
                  <ul className="space-y-1">
                    {projects.map((p) => {
                      const lit = litProjects.has(p.slug);
                      return (
                        <li key={p.slug}>
                          <Link
                            href={`/projects/${p.slug}`}
                            className="flex min-h-[38px] items-center gap-2.5 rounded-md px-2 py-1.5 transition-all duration-500"
                            style={{
                              opacity: focus === null ? 0.72 : lit ? 1 : 0.28,
                              background: lit ? 'rgba(123,140,255,0.09)' : 'transparent',
                            }}
                          >
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-500"
                              style={{ background: lit ? '#56d6c4' : 'rgba(255,255,255,0.2)' }}
                            />
                            <span className="font-mono text-[10px] text-faint tnum">{p.index}</span>
                            <span className="text-[12.5px] text-muted">{p.shortTitle}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

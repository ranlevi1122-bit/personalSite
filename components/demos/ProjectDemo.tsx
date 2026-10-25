'use client';

import type { DemoKind } from '@/data/portfolioData';
import { Agents } from './Agents';
import { Booking } from './Booking';
import { LaunchRun } from './LaunchRun';
import { SafeBuildWalkthrough } from './SafeBuild';
import { Scheduler } from './Scheduler';
import type { DemoMode } from './shared';

/** The live object that stands for a project, worked by hand or playing as a preview. */
export function ProjectDemo({ kind, mode = 'full' }: { kind: DemoKind; mode?: DemoMode }) {
  switch (kind) {
    case 'launch':
      return <LaunchRun mode={mode} />;
    case 'scheduler':
      return <Scheduler mode={mode} />;
    case 'booking':
      return <Booking mode={mode} />;
    case 'agents':
      return <Agents mode={mode} />;
    case 'safebuild':
      return <SafeBuildWalkthrough mode={mode} />;
  }
}

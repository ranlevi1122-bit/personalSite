'use client';

import { launchSteps, type DemoKind } from '@/data/portfolioData';
import { Agents } from './Agents';
import { Booking } from './Booking';
import { SafeBuildWalkthrough } from './SafeBuild';
import { Scheduler } from './Scheduler';
import { Walkthrough } from './Walkthrough';
import type { DemoMode } from './shared';

/** The live object that stands for a project, worked by hand or playing as a preview. */
export function ProjectDemo({ kind, mode = 'full' }: { kind: DemoKind; mode?: DemoMode }) {
  switch (kind) {
    case 'launch':
      return (
        <Walkthrough
          steps={launchSteps}
          track="launch"
          app="Launch Engine"
          context="Reference launch"
          pill="Real screens"
          aspect="1440 / 900"
          previewAspect="800 / 430"
          mode={mode}
        />
      );
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

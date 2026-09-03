'use client';

import type { ProjectVisual } from '@/data/portfolioData';
import { AgentsVisual } from './AgentsVisual';
import { PipelineVisual } from './PipelineVisual';
import { ProductVisual } from './ProductVisual';
import { WorkflowVisual } from './WorkflowVisual';

/** Maps a project's visual identity to its component. */
export function ProjectVisualFor({ visual }: { visual: ProjectVisual }) {
  switch (visual) {
    case 'workflow':
      return <WorkflowVisual />;
    case 'product':
      return <ProductVisual />;
    case 'agents':
      return <AgentsVisual />;
    case 'pipeline':
      return <PipelineVisual />;
    default:
      return null;
  }
}

export { AgentsVisual, PipelineVisual, ProductVisual, WorkflowVisual };

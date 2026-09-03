'use client';

import { useRecruiter } from '@/components/SiteChrome';
import { Arrow } from '@/components/ui/Atoms';

/**
 * The hero's tertiary CTA. Split into its own client component so the rest of
 * the hero can stay a server component and render without any JavaScript.
 */
export function RecruiterTrigger() {
  const { open } = useRecruiter();

  return (
    <button
      type="button"
      onClick={open}
      className="group ml-1 inline-flex h-11 items-center gap-2 rounded-full px-3 text-[13px] font-medium text-muted transition-colors duration-300 hover:text-chalk"
    >
      60-second view
      <Arrow />
    </button>
  );
}

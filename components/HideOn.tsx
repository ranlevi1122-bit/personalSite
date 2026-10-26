'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { visiblePath } from '@/lib/i18n';

/** Renders its children everywhere except under the given path, such as the private /stats screen. */
export function HideOn({ prefix, children }: { prefix: string; children: ReactNode }) {
  const pathname = visiblePath(usePathname());
  return pathname.startsWith(prefix) ? null : <>{children}</>;
}

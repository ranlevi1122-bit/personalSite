'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/** Renders its children everywhere except under the given path, such as the private /stats screen. */
export function HideOn({ prefix, children }: { prefix: string; children: ReactNode }) {
  const pathname = usePathname();
  return pathname?.startsWith(prefix) ? null : <>{children}</>;
}

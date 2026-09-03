'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { CursorLight } from '@/components/CursorLight';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/sections/Contact';

/**
 * The 60-second view is a large panel that is closed on arrival, so it is
 * kept out of the initial bundle and fetched the first time it is opened.
 */
const RecruiterMode = dynamic(
  () => import('@/components/RecruiterMode').then((m) => m.RecruiterMode),
  { ssr: false },
);

interface RecruiterContextValue {
  open: () => void;
  close: () => void;
  isOpen: boolean;
}

const RecruiterContext = createContext<RecruiterContextValue>({
  open: () => {},
  close: () => {},
  isOpen: false,
});

/** Lets any component open the 60-second view. */
export const useRecruiter = () => useContext(RecruiterContext);

/**
 * Persistent chrome shared by every route: navigation, the recruiter overlay,
 * the ambient cursor light and the footer.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  /** Keeps the overlay mounted after the first open so it stays instant. */
  const [hasOpened, setHasOpened] = useState(false);
  const pathname = usePathname();
  const isCaseStudy = pathname?.startsWith('/projects/') ?? false;

  const open = useCallback(() => {
    setHasOpened(true);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen]);

  return (
    <RecruiterContext.Provider value={value}>
      <CursorLight />
      <Nav onOpenRecruiter={open} simple={isCaseStudy} />
      {/* tabIndex={-1} makes this a valid destination for the skip link. */}
      <main id="main" tabIndex={-1} className="relative z-10 outline-none">
        {children}
      </main>
      <Footer />
      {/* Mounted only once it has been opened, so the chunk loads on demand. */}
      {(isOpen || hasOpened) && <RecruiterMode open={isOpen} onClose={close} />}
    </RecruiterContext.Provider>
  );
}

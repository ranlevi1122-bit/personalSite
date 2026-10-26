/** The one arrow used on links and buttons. */
export function Arrow({ dir = 'right' }: { dir?: 'right' | 'left' | 'up-right' }) {
  const rotate = dir === 'left' ? 180 : dir === 'up-right' ? -45 : 0;
  return (
    <svg className="arrow" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" style={{ rotate: `${rotate}deg` }}>
      <path d="M2 9h12M9.5 4.5 14 9l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

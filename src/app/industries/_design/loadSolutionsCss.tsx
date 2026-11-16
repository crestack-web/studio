'use client';

import { useEffect } from 'react';

/** Pinned last known-good solutions design system. */
export const SOLUTIONS_BASE_CSS =
  'https://cdn.jsdelivr.net/gh/crestack-web/studio@943a72eb8fd1816e7f6c0672b3f79209e14259cf/src/app/industries/_design/solutions.css';

const LINK_ID = 'busmo-solutions-base-css';

/** Injects the full solutions design system into document head once. */
export function SolutionsCssLink() {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById(LINK_ID)) return;
    const link = document.createElement('link');
    link.id = LINK_ID;
    link.rel = 'stylesheet';
    link.href = SOLUTIONS_BASE_CSS;
    // Prefer early load
    document.head.prepend(link);
  }, []);

  // Also render a noscript/SSR-friendly link for first paint when possible
  return (
    // eslint-disable-next-line @next/next/no-css-tags
    <link id={LINK_ID + '-ssr'} rel="stylesheet" href={SOLUTIONS_BASE_CSS} />
  );
}

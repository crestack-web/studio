'use client';

import { useEffect } from 'react';

/** Same-origin copy when available; CDN pinned fallback. */
const SOURCES = [
  '/solutions-design.css',
  'https://cdn.jsdelivr.net/gh/crestack-web/studio@943a72eb8fd1816e7f6c0672b3f79209e14259cf/src/app/industries/_design/solutions.css',
];

const LINK_ID = 'busmo-solutions-base-css';

/** Injects the full solutions design system into document head once. */
export function SolutionsCssLink() {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById(LINK_ID)) return;

    const link = document.createElement('link');
    link.id = LINK_ID;
    link.rel = 'stylesheet';
    link.href = SOURCES[0];

    // If same-origin file is missing, fall back to CDN
    link.onerror = () => {
      if (link.href !== SOURCES[1]) {
        link.onerror = null;
        link.href = SOURCES[1];
      }
    };

    document.head.prepend(link);
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-css-tags
    <link rel="stylesheet" href={SOURCES[1]} />
  );
}

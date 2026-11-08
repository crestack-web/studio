'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { SUITE_FAMILIES, type SuiteFamily } from '@/lib/industries/suite-catalog';
import styles from './SuiteChrome.module.css';
import { SuiteProductIcon } from './SuiteIcons';

export function SuiteChrome({
  family,
  children,
}: {
  family: SuiteFamily;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('keydown', onKey);
      document.addEventListener('mousedown', onClick);
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  return (
    <div className={styles.root}>
      <header className={styles.top}>
        <Link href="/" className={styles.logo} aria-label="Busmo home">
          <img src="/email-logo.png" alt="" width={40} height={40} />
        </Link>

        <div className={styles.switcherWrap} ref={panelRef}>
          <button
            type="button"
            className={styles.switcherBtn}
            aria-expanded={open}
            aria-haspopup="listbox"
            onClick={() => setOpen((v) => !v)}
          >
            {family.label}
            <span className={styles.chevron} aria-hidden>
              ▾
            </span>
          </button>

          {open && (
            <div className={styles.menu} role="listbox" aria-label="Busmo Solutions">
              <div className={styles.menuHead}>
                <span>Busmo Solutions</span>
                <button type="button" className={styles.menuClose} onClick={() => setOpen(false)} aria-label="Close">
                  ×
                </button>
              </div>
              <div className={styles.menuSection}>Apps</div>
              {SUITE_FAMILIES.map((f) => (
                <Link
                  key={f.id}
                  href={f.href}
                  className={[styles.menuItem, f.id === family.id ? styles.menuItemActive : ''].join(' ')}
                  onClick={() => setOpen(false)}
                >
                  {f.label}
                  {f.id === family.id && <span className={styles.menuChevron}>›</span>}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className={styles.topActions}>
          <Link href={family.loginHref} className={styles.linkQuiet}>
            Sign in
          </Link>
        </div>
      </header>

      <main className={styles.main}>{children}</main>

      {/* Zoho-style sticky bottom CTA */}
      <div className={styles.stickyBar}>
        <Link href={family.signupHref} className={styles.stickyCta}>
          Get started
        </Link>
      </div>
    </div>
  );
}

export function SuiteProductGrid({ family }: { family: SuiteFamily }) {
  return (
    <div className={styles.productGrid}>
      {family.products.map((p) => (
        <article key={p.id} className={styles.productCard}>
          <div className={styles.productHeader}>
            <SuiteProductIcon id={p.id} />
            <h3 className={styles.productName}>{p.name}</h3>
          </div>
          <p className={styles.productBlurb}>{p.blurb}</p>
          <Link href={p.href} className={styles.tryLink}>
            Try now <span aria-hidden>›</span>
          </Link>
        </article>
      ))}
    </div>
  );
}

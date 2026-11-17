'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { SUITE_FAMILIES, type SuiteFamily } from '@/lib/industries/suite-catalog';
import styles from './SuiteChrome.module.css';
import { SuiteProductIcon } from './SuiteIcons';

const SUITE_KIND: Record<SuiteFamily['id'], string> = {
  business: 'Sales, stock, cash & MO',
  hospitality: 'Hotels & guesthouses',
  healthcare: 'Clinics & practices',
  professional: 'Agencies & consultancies',
  education: 'Schools & training',
  agriculture: 'Farms & agribusiness',
};

const SECTION_LINKS = [
  { href: '#what-you-get', label: 'What you get' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#apps', label: 'Apps' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

function Chevron({ open }: { open: boolean }) {
  return (
    <span className={open ? styles.chevronOpen : styles.chevron} aria-hidden>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function SuiteChrome({
  family,
  children,
  sectionLinks = false,
}: {
  family: SuiteFamily;
  children?: React.ReactNode;
  /** Show in-page anchor links (landing pages only). */
  sectionLinks?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  return (
    <div className={styles.root} data-suite={family.id}>
      <header className={styles.top}>
        <div className={styles.topInner}>
          <Link href="/" className={styles.brand} aria-label="Busmo home">
            <img src="/email-logo.png" alt="" width={30} height={30} className={styles.brandMark} />
            <span className={styles.brandName}>Busmo</span>
          </Link>
          <span className={styles.brandDivider} aria-hidden />

          <div className={styles.switcherWrap} ref={panelRef}>
            <button
              type="button"
              className={styles.switcherBtn}
              aria-expanded={open}
              aria-haspopup="dialog"
              aria-label={`Switch Busmo solution (current: ${family.label})`}
              onClick={() => setOpen((v) => !v)}
            >
              <span className={styles.switcherDot} aria-hidden />
              <span className={styles.switcherLabel}>{family.label}</span>
              <Chevron open={open} />
            </button>

            {open && (
              <div className={styles.menu} id="suite-switcher-menu" role="dialog" aria-label="Busmo solutions">
                <div className={styles.menuHead}>
                  <span>Busmo solutions</span>
                  <button
                    type="button"
                    className={styles.menuClose}
                    onClick={() => setOpen(false)}
                    aria-label="Close solutions menu"
                  >
                    ×
                  </button>
                </div>
                <div className={styles.menuSection}>Choose a product</div>
                {SUITE_FAMILIES.map((f) => {
                  const active = f.id === family.id;
                  return (
                    <Link
                      key={f.id}
                      href={f.href}
                      className={[styles.menuItem, active ? styles.menuItemActive : ''].join(' ')}
                      onClick={() => setOpen(false)}
                      aria-current={active ? 'page' : undefined}
                    >
                      <span className={styles.menuDot} data-suite={f.id} aria-hidden />
                      <span className={styles.menuItemText}>
                        <span className={styles.menuItemName}>{f.label}</span>
                        <span className={styles.menuItemSub}>{SUITE_KIND[f.id]}</span>
                      </span>
                      {active ? (
                        <span className={styles.menuChevron} aria-hidden>
                          ✓
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
                <div className={styles.menuFoot}>
                  <Link href="/solutions" className={styles.menuFootLink} onClick={() => setOpen(false)}>
                    Compare all solutions
                  </Link>
                  <Link href={family.loginHref} className={styles.menuFootLink} onClick={() => setOpen(false)}>
                    Sign in
                  </Link>
                </div>
              </div>
            )}
          </div>

          {sectionLinks ? (
            <nav className={styles.navLinks} aria-label="On this page">
              {SECTION_LINKS.map((link) => (
                <a key={link.href} href={link.href} className={styles.navLink}>
                  {link.label}
                </a>
              ))}
            </nav>
          ) : null}

          <div className={styles.topActions}>
            <Link href={family.loginHref} className={styles.linkQuiet}>
              Sign in
            </Link>
            <Link href={family.signupHref} className={styles.navCta}>
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className={styles.main}>{children}</main>
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
            Try now <span aria-hidden>→</span>
          </Link>
        </article>
      ))}
    </div>
  );
}

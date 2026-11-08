'use client';

import Link from 'next/link';
import type { IndustryConfig } from '@/lib/industries/types';
import styles from './IndustryShell.module.css';

export function IndustryWelcome({ config }: { config: IndustryConfig }) {
  return (
    <div className={styles.welcomeRoot}>
      <nav className={styles.welcomeNav}>
        <Link href={config.welcomePath} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <img src="/email-logo.png" alt="Busmo" width={36} height={36} style={{ objectFit: 'contain' }} />
          <strong style={{ color: '#6b3fe7', fontSize: '1.05rem' }}>{config.productName}</strong>
        </Link>
        <div className={styles.welcomeNavLinks}>
          <Link href="/industries" className={styles.btnGhost} style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
            Industries
          </Link>
          <Link href={config.loginPath} className={styles.btnGhost} style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
            Sign In
          </Link>
          <Link href={config.signupPath} className={styles.btnPrimary} style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
            Get Started
          </Link>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroKicker}>{config.productName}</div>
        <h1>{config.tagline}</h1>
        <p>{config.description}</p>
        <div className={styles.ctaRow}>
          <Link href={config.signupPath} className={styles.btnPrimary}>
            Get Started
          </Link>
          <Link href={config.loginPath} className={styles.btnGhost}>
            Sign In
          </Link>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Built for your operations</h2>
        <div className={styles.featureGrid}>
          {config.features.map((f) => (
            <div key={f} className={styles.featureCard}>
              {f}
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Your dashboard, in Busmo</h2>
        <div className={styles.previewCard}>
          <div className={styles.previewBar} />
          <div className={styles.previewMetrics}>
            {config.metrics.map((m) => (
              <div key={m.id} className={styles.previewMetric}>
                <span>{m.label}</span>
                <strong>{m.emptyValue}</strong>
              </div>
            ))}
          </div>
          <p className={styles.empty} style={{ marginTop: 14 }}>
            Same Busmo layout you already know — with {config.shortName.toLowerCase()}-specific metrics and actions.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Why teams choose {config.productName}</h2>
        <div className={styles.featureGrid}>
          {config.benefits.map((b) => (
            <div key={b} className={styles.featureCard}>
              {b}
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} style={{ textAlign: 'center' }}>
        <h2>Start with {config.productName}</h2>
        <p className={styles.empty} style={{ marginBottom: 16 }}>
          Create your account and open a dashboard designed for {config.shortName.toLowerCase()} work.
        </p>
        <div className={styles.ctaRow}>
          <Link href={config.signupPath} className={styles.btnPrimary}>
            Get Started
          </Link>
          <Link href={config.loginPath} className={styles.btnGhost}>
            Sign In
          </Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <div>
          Part of the{' '}
          <Link href="/" style={{ color: '#6b3fe7', fontWeight: 600 }}>
            Busmo
          </Link>{' '}
          ecosystem ·{' '}
          <Link href="/industries" style={{ color: '#6b3fe7' }}>
            All industries
          </Link>
        </div>
      </footer>
    </div>
  );
}

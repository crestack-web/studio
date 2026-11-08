'use client';

import Link from 'next/link';
import type { IndustryConfig } from '@/lib/industries/types';
import { getSuiteFamily } from '@/lib/industries/suite-catalog';
import { SuiteChrome, SuiteProductGrid } from './SuiteChrome';
import styles from './SuiteChrome.module.css';

export function IndustryWelcome({ config }: { config: IndustryConfig }) {
  const family = getSuiteFamily(config.id);

  return (
    <SuiteChrome family={family}>
      <section className={styles.hero}>
        <div className={styles.heroKicker}>{family.productName}</div>
        <h1>{family.tagline}</h1>
        <p>{family.description}</p>
        <div className={styles.heroCtas}>
          <Link href={family.signupHref} className={styles.btnPrimary}>
            Get started
          </Link>
          <Link href={family.loginHref} className={styles.btnGhost}>
            Sign in
          </Link>
        </div>
      </section>

      <div className={styles.sectionTitle}>Apps in {family.label}</div>
      <SuiteProductGrid family={family} />

      <section style={{ marginTop: 28, textAlign: 'center' }}>
        <p style={{ color: '#6b7280', fontSize: '0.88rem', marginBottom: 12 }}>
          Same Busmo platform. Built for {family.label.toLowerCase()} operations.
        </p>
        <Link href="/industries" style={{ color: '#6b3fe7', fontWeight: 600, fontSize: '0.9rem' }}>
          Browse all products
        </Link>
      </section>
    </SuiteChrome>
  );
}

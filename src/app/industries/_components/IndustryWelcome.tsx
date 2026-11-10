'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { IndustryConfig } from '@/lib/industries/types';
import { getSuiteFamily } from '@/lib/industries/suite-catalog';
import { SuiteChrome, SuiteProductGrid } from './SuiteChrome';
import { SuiteInstallAppButton } from './SuiteInstallAppButton';
import { IndustryPricing } from './IndustryPricing';
import styles from './SuiteChrome.module.css';

export function IndustryWelcome({ config }: { config: IndustryConfig }) {
  const family = getSuiteFamily(config.id);

  return (
    <SuiteChrome family={family}>
      <section className={styles.hero}>
        {family.heroImage ? (
          <div className={styles.heroMedia}>
            <Image
              src={family.heroImage}
              alt={family.heroImageAlt || family.productName}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 720px"
              className={styles.heroImage}
            />
          </div>
        ) : null}
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
        <SuiteInstallAppButton productName={family.productName} />
      </section>

      <div className={styles.sectionTitle}>Apps in {family.label}</div>
      <IndustryPricing config={config} />
          <SuiteProductGrid family={family} />

      <section style={{ marginTop: 28, textAlign: 'center' }}>
        <p style={{ color: '#6b7280', fontSize: '0.88rem', marginBottom: 12 }}>
          Same Busmo platform. Built for {family.label.toLowerCase()} operations.
        </p>
        <Link href="/industries" style={{ color: '#6b3fe7', fontWeight: 600, fontSize: '0.9rem' }}>
          Browse all solutions
        </Link>
      </section>
    </SuiteChrome>
  );
}

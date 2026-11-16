'use client';

import Link from 'next/link';
import { SUITE_FAMILIES, getSuiteFamily } from '@/lib/industries/suite-catalog';
import { SuiteChrome, SuiteProductGrid } from './_components/SuiteChrome';
import { SolutionsSlideshow } from './_components/SolutionsSlideshow';
import styles from './_components/SuiteChrome.module.css';

const SOLUTION_ICONS: Record<string, string> = {
  business: '/email-logo.png',
  hospitality: '/industries/busmo-hospitality-icon.svg',
  healthcare: '/industries/busmo-healthcare-icon.svg',
  professional: '/industries/busmo-professional-icon.svg',
  education: '/industries/busmo-education-icon.svg',
};

export default function IndustriesHubPage() {
  const family = getSuiteFamily('business');

  return (
    <SuiteChrome family={family}>
      <section className={styles.hero}>
        <div className={styles.heroKicker}>Busmo Solutions</div>
        <h1>One platform. Built for how you work.</h1>
        <p>
          Switch products the way your team works — Business for SMEs, Hospitality for hotels, Professional for
          service firms. Same design. Same account system. Different operations.
        </p>
        <div className={styles.heroCtas}>
          <Link href={family.signupHref} className={styles.btnPrimary}>
            Get started
          </Link>
          <Link href={family.loginHref} className={styles.btnGhost}>
            Sign in
          </Link>
        </div>
      </section>

      <SolutionsSlideshow />

      <div className={styles.sectionTitle}>Choose a solution</div>
      <div className={styles.productGrid}>
        {SUITE_FAMILIES.map((f) => (
          <article key={f.id} className={styles.productCard}>
            <div className={styles.productHeader}>
              <img
                src={SOLUTION_ICONS[f.id] || '/email-logo.png'}
                alt=""
                width={36}
                height={36}
                style={{ width: 36, height: 36, objectFit: 'contain' }}
              />
              <h3 className={styles.productName}>{f.productName}</h3>
            </div>
            <p className={styles.productBlurb}>{f.description}</p>
            <Link href={f.href} className={styles.tryLink}>
              Open {f.label} <span aria-hidden>›</span>
            </Link>
          </article>
        ))}
      </div>

      <div className={styles.sectionTitle} style={{ marginTop: 28 }}>
        Featured in Business
      </div>
      <SuiteProductGrid family={family} />
    </SuiteChrome>
  );
}

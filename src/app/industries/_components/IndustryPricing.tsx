'use client';

import Link from 'next/link';
import type { IndustryConfig } from '@/lib/industries/types';
import {
  formatSolutionNaira,
  getSolutionPricing,
} from '@/lib/industries/pricing';
import styles from './SuiteChrome.module.css';

export function IndustryPricing({ config }: { config: IndustryConfig }) {
  const pack = getSolutionPricing(config.id);

  return (
    <section className={styles.pricingSection} id="pricing" aria-labelledby="solution-pricing-heading">
      <div className={styles.pricingHead}>
        <p className={styles.pricingKicker}>Pricing</p>
        <h2 id="solution-pricing-heading">{pack.headline}</h2>
        <p className={styles.pricingSub}>{pack.subhead}</p>
      </div>
      <div className={styles.pricingGrid}>
        {pack.plans.map((plan) => (
          <div
            key={plan.id}
            className={plan.popular ? `${styles.pricingCard} ${styles.pricingCardPopular}` : styles.pricingCard}
          >
            {plan.popular ? <div className={styles.pricingBadge}>Recommended</div> : null}
            <div className={styles.pricingName}>{plan.name}</div>
            <div className={styles.pricingTagline}>{plan.tagline}</div>
            <div className={styles.pricingAmount}>
              <span>{formatSolutionNaira(plan.monthlyPrice)}</span>
              <small>/month</small>
            </div>
            <div className={styles.pricingYearly}>
              or {formatSolutionNaira(plan.yearlyPrice)}/year
            </div>
            <ul className={styles.pricingFeatures}>
              {plan.features.map((f) => (
                <li key={f}>
                  <span aria-hidden>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href={config.signupPath} className={plan.popular ? styles.btnPrimary : styles.btnSecondary}>
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
      <p className={styles.pricingFoot}>
        Prices in NGN. Trial first — you choose a plan when you are ready to continue after 14 days.
      </p>
    </section>
  );
}

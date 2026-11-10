'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { IndustryConfig } from '@/lib/industries/types';
import {
  formatSolutionNaira,
  getSolutionPricing,
} from '@/lib/industries/pricing';
import styles from './SuiteChrome.module.css';

type Cadence = 'monthly' | 'yearly' | 'term';

export function IndustryPricing({ config }: { config: IndustryConfig }) {
  const pack = getSolutionPricing(config.id);
  const hasTerm = pack.plans.some((p) => p.termPrice != null);
  const [cadence, setCadence] = useState<Cadence>('monthly');

  return (
    <section className={styles.pricingSection} id="pricing" aria-labelledby="solution-pricing-heading">
      <div className={styles.pricingHead}>
        <p className={styles.pricingKicker}>Pricing · {pack.modelLabel}</p>
        <h2 id="solution-pricing-heading">{pack.headline}</h2>
        <p className={styles.pricingSub}>{pack.subhead}</p>
        <div className={styles.billingToggle} role="group" aria-label="Billing period">
          <button
            type="button"
            className={cadence === 'monthly' ? styles.billingActive : styles.billingBtn}
            onClick={() => setCadence('monthly')}
          >
            Monthly
          </button>
          <button
            type="button"
            className={cadence === 'yearly' ? styles.billingActive : styles.billingBtn}
            onClick={() => setCadence('yearly')}
          >
            Annual
          </button>
          {hasTerm ? (
            <button
              type="button"
              className={cadence === 'term' ? styles.billingActive : styles.billingBtn}
              onClick={() => setCadence('term')}
            >
              Per term
            </button>
          ) : null}
        </div>
      </div>
      <div className={styles.pricingGrid}>
        {pack.plans.map((plan) => {
          let amountLabel = 'Custom';
          let period = '';
          if (plan.isEnterprise || plan.monthlyPrice == null) {
            amountLabel = 'Custom';
          } else if (cadence === 'yearly' && plan.yearlyPrice != null) {
            amountLabel = formatSolutionNaira(plan.yearlyPrice);
            period = '/year';
          } else if (cadence === 'term' && plan.termPrice != null) {
            amountLabel = formatSolutionNaira(plan.termPrice);
            period = '/term';
          } else if (plan.monthlyPrice === 0) {
            amountLabel = '₦0';
            period = '/month';
          } else {
            amountLabel = formatSolutionNaira(plan.monthlyPrice);
            period = '/month';
          }

          const href =
            plan.isEnterprise
              ? 'mailto:busmohq@gmail.com?subject=Busmo%20Enterprise'
              : config.signupPath;

          return (
            <div
              key={plan.id}
              className={
                plan.popular
                  ? `${styles.pricingCard} ${styles.pricingCardPopular}`
                  : styles.pricingCard
              }
            >
              {plan.popular ? <div className={styles.pricingBadge}>Recommended</div> : null}
              <div className={styles.pricingName}>{plan.name}</div>
              {plan.capacity ? <div className={styles.pricingCapacity}>{plan.capacity}</div> : null}
              <div className={styles.pricingTagline}>{plan.tagline}</div>
              <div className={styles.pricingAmount}>
                <span>{amountLabel}</span>
                {period ? <small>{period}</small> : null}
              </div>
              {cadence === 'monthly' && plan.yearlyPrice != null && plan.monthlyPrice != null && plan.monthlyPrice > 0 ? (
                <div className={styles.pricingYearly}>
                  or {formatSolutionNaira(plan.yearlyPrice)}/year (~2 months free)
                </div>
              ) : (
                <div className={styles.pricingYearly}>&nbsp;</div>
              )}
              <ul className={styles.pricingFeatures}>
                {plan.features.map((f) => (
                  <li key={f}>
                    <span aria-hidden>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href={href}
                className={plan.popular ? styles.btnPrimary : styles.btnSecondary}
              >
                {plan.cta}
              </Link>
            </div>
          );
        })}
      </div>
      {pack.addOns && pack.addOns.length > 0 ? (
        <div className={styles.addOns}>
          <h3>Add-ons</h3>
          <ul>
            {pack.addOns.map((a) => (
              <li key={a.name}>
                <strong>{a.name}</strong>
                <span>{a.model}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className={styles.pricingFoot}>{pack.billingNote}</p>
    </section>
  );
}

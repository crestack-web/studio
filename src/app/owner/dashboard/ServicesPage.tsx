import React from 'react';
import { useApp } from './AppContext';
import { Button } from './Button';
import styles from './ServicesPage.module.css';

const UGC_LINK = 'https://mo-sell.store/ugc-creators';

const SERVICES = [
  {
    name: 'UGC Content Creation',
    description: 'Professional User-Generated Content to boost your brand. Get authentic videos and photos from real creators.',
    price: 'From ₦5,000',
    delivery: '48-72 hrs',
    rating: '4.9',
    color: '#8B5CF6',
  },
];

export function ServicesPage() {
  const { navigateTo } = useApp();

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Business Services</h2>
          <p className={styles.pageDesc}>Expert help to grow your Busmo business.</p>
        </div>
        <Button variant="subtle" onClick={() => navigateTo('home')}>← Back</Button>
      </div>

      <div className={styles.grid}>
        {SERVICES.map((service) => (
          <a
            key={service.name}
            href={UGC_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.card}
            style={{ textDecoration: 'none', cursor: 'pointer' }}
          >
            <div className={styles.cardTop}>
              <div className={styles.serviceIcon} style={{ background: `${service.color}20` }}>
                <svg viewBox="0 0 24 24" fill="none" stroke={service.color} strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              </div>
              <div className={styles.rating}>
                <svg viewBox="0 0 24 24" fill="var(--amber)" stroke="var(--amber)" strokeWidth="2" width="14" height="14">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                {service.rating}
              </div>
            </div>
            <div className={styles.serviceName}>{service.name}</div>
            <div className={styles.serviceDesc}>{service.description}</div>
            <div className={styles.cardFooter}>
              <span className={styles.price}>{service.price}</span>
              <span className={styles.delivery}>{service.delivery}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}


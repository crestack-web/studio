import React, { useState } from 'react';
import { useApp } from './AppContext';
import { Button } from './Button';
import { SERVICES } from './mockData';
// Define ServiceCategory type locally if '../../../types' does not exist
type ServiceCategory = 'all' | 'setup' | 'marketing' | 'finance' | 'legal' | 'tech';
import styles from './ServicesPage.module.css';

// ═══════════════════════════════════════════
//  ServicesPage
// ═══════════════════════════════════════════

const CATEGORIES: { id: ServiceCategory; label: string }[] = [
  { id: 'all',       label: 'All'       },
  { id: 'setup',     label: 'Setup'     },
  { id: 'marketing', label: 'Marketing' },
  { id: 'finance',   label: 'Finance'   },
  { id: 'legal',     label: 'Legal'     },
  { id: 'tech',      label: 'Tech'      },
];

export function ServicesPage() {
  const { navigateTo, showToast } = useApp();
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>('all');

  const filtered =
    activeCategory === 'all'
      ? SERVICES
      : SERVICES.filter(s => s.category === activeCategory);

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Business Services</h2>
          <p className={styles.pageDesc}>Expert help to grow your Busmo business.</p>
        </div>
        <Button variant="subtle" onClick={() => navigateTo('home')}>← Back</Button>
      </div>

      {/* Category filter */}
      <div className={styles.categoryRow}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={[styles.catBtn, activeCategory === cat.id ? styles.catActive : ''].join(' ')}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Service grid */}
      <div className={styles.grid}>
        {filtered.map((service: typeof SERVICES[number]) => (
          <div key={service.id} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.serviceIcon} style={{ background: service.iconBg }}>
                <svg viewBox="0 0 24 24" fill="none" stroke={service.iconStroke} strokeWidth={2}>
                  <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <div className={styles.rating}>
                <svg viewBox="0 0 24 24" fill="currentColor" width={10} height={10}>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                {service.rating}
              </div>
            </div>
            <div className={styles.serviceName}>{service.name}</div>
            <div className={styles.serviceDesc}>{service.description}</div>
            <div className={styles.cardFooter}>
              <div>
                <div className={styles.price}>{service.price}</div>
                <div className={styles.delivery}>{service.delivery}</div>
              </div>
              <Button variant="primary" size="xs" onClick={() => showToast(`Booking ${service.name}…`)}>
                Book Now
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

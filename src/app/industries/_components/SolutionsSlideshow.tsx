'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import styles from './SolutionsSlideshow.module.css';

type Slide = {
  id: string;
  name: string;
  productName: string;
  tagline: string;
  description: string;
  href: string;
  iconSrc: string;
  accent: string;
};

const SLIDES: Slide[] = [
  {
    id: 'business',
    name: 'Business',
    productName: 'Busmo Business',
    tagline: 'For everyday SMEs',
    description: 'Sales, stock, cashflow, staff and MO — one system to control the business even when you are not there.',
    href: '/solutions/business',
    iconSrc: '/email-logo.png',
    accent: '#6b3fe7',
  },
  {
    id: 'hospitality',
    name: 'Hospitality',
    productName: 'Busmo Hospitality',
    tagline: 'Hotels & guesthouses',
    description: 'Reservations, rooms, guests, housekeeping and revenue — front desk and back office on the same live picture.',
    href: '/solutions/hospitality',
    iconSrc: '/industries/busmo-hospitality-icon.svg',
    accent: '#047857',
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    productName: 'Busmo Healthcare',
    tagline: 'Clinics & practices',
    description: 'Patients, appointments, visits, billing and clinical staff — reception and care teams working from one record.',
    href: '/solutions/healthcare',
    iconSrc: '/industries/busmo-healthcare-icon.svg',
    accent: '#0f766e',
  },
  {
    id: 'professional',
    name: 'Professional',
    productName: 'Busmo Professional',
    tagline: 'Agencies & consultancies',
    description: 'Clients, projects, time and invoices in one workspace — see what the team is delivering and what it is worth.',
    href: '/solutions/professional',
    iconSrc: '/industries/busmo-professional-icon.svg',
    accent: '#4f46e5',
  },
  {
    id: 'education',
    name: 'Education',
    productName: 'Busmo Education',
    tagline: 'Schools & training',
    description: 'Students, classes, enrollment, attendance and fees — school operations without the spreadsheet chaos.',
    href: '/solutions/education',
    iconSrc: '/industries/busmo-education-icon.svg',
    accent: '#4338ca',
  },
  {
    id: 'agriculture',
    name: 'Agriculture',
    productName: 'Busmo Agriculture',
    tagline: 'Farms & agribusiness',
    description: 'Farms, plots, crop cycles, harvests, processing, packaging, stock, sales and exports in one workspace.',
    href: '/solutions/agriculture',
    iconSrc: '/industries/busmo-agriculture-icon.svg',
    accent: '#0b7f4a',
  },
];

const INTERVAL_MS = 4500;

export function SolutionsSlideshow() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((next: number) => {
    setIndex((next + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => go(index + 1), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [index, paused, go]);

  const slide = SLIDES[index];

  return (
    <div
      className={styles.wrap}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Busmo products"
    >
      <div className={styles.stage} style={{ ['--slide-accent' as string]: slide.accent }}>
        <div className={styles.glow} aria-hidden />
        <div key={slide.id} className={styles.card}>
          <div className={styles.iconRing}>
            <img src={slide.iconSrc} alt="" className={styles.icon} width={72} height={72} />
          </div>
          <div className={styles.meta}>
            <span className={styles.tagline}>{slide.tagline}</span>
            <h2 className={styles.name}>{slide.productName}</h2>
            <p className={styles.desc}>{slide.description}</p>
            <Link href={slide.href} className={styles.cta}>
              Open {slide.name}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

        <div className={styles.controls}>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => go(index - 1)}
            aria-label="Previous product"
          >
            ‹
          </button>
          <div className={styles.dots} role="tablist" aria-label="Product slides">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={s.productName}
                className={i === index ? styles.dotActive : styles.dot}
                onClick={() => go(i)}
              />
            ))}
          </div>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => go(index + 1)}
            aria-label="Next product"
          >
            ›
          </button>
        </div>
      </div>

      <div className={styles.rail} aria-hidden>
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={i === index ? styles.railItemActive : styles.railItem}
            onClick={() => go(i)}
            title={s.productName}
          >
            <img src={s.iconSrc} alt="" width={28} height={28} />
            <span>{s.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

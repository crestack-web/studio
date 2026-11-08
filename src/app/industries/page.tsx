import Link from 'next/link';
import { HOSPITALITY, PROFESSIONAL } from '@/lib/industries/config';
import styles from './_components/IndustryShell.module.css';

export const metadata = {
  title: 'Industries · Busmo',
  description: 'Busmo industry editions — Hospitality and Professional Services',
};

export default function IndustriesHubPage() {
  return (
    <div className={styles.welcomeRoot}>
      <nav className={styles.welcomeNav}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <img src="/email-logo.png" alt="Busmo" width={36} height={36} />
          <strong style={{ color: '#6b3fe7' }}>Busmo</strong>
        </Link>
        <div className={styles.welcomeNavLinks}>
          <Link href="/" className={styles.btnGhost} style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
            Business
          </Link>
          <Link href="/pricing" className={styles.btnGhost} style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
            Pricing
          </Link>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroKicker}>Industries</div>
        <h1>Same Busmo. Built for your industry.</h1>
        <p>
          Choose the edition that matches how you work. Every product shares the Busmo design system and platform
          foundation — with navigation, metrics and actions tailored to your operations.
        </p>
      </section>

      <div className={styles.hubGrid}>
        <Link href={HOSPITALITY.welcomePath} className={styles.hubCard}>
          <h3>{HOSPITALITY.productName}</h3>
          <p>{HOSPITALITY.description}</p>
        </Link>
        <Link href={PROFESSIONAL.welcomePath} className={styles.hubCard}>
          <h3>{PROFESSIONAL.productName}</h3>
          <p>{PROFESSIONAL.description}</p>
        </Link>
        <Link href="/" className={styles.hubCard}>
          <h3>Busmo Business</h3>
          <p>The original Busmo workspace for retail, restaurants and everyday SMEs.</p>
        </Link>
      </div>
    </div>
  );
}

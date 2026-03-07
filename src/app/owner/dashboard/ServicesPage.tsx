import React from 'react';
import { useApp } from './AppContext';
import { Button } from './Button';
import styles from './ServicesPage.module.css';

// ═══════════════════════════════════════════
//  ServicesPage
// ═══════════════════════════════════════════

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

      {/* Empty state */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '80px 20px',
        textAlign: 'center'
      }}>
        <svg 
          width="80" 
          height="80" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          style={{ marginBottom: '24px', opacity: 0.3, color: 'var(--text-3)' }}
        >
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 600, 
          color: 'var(--text-1)', 
          marginBottom: '8px' 
        }}>
          No Services Available
        </h3>
        <p style={{ 
          fontSize: '0.9rem', 
          color: 'var(--text-3)', 
          maxWidth: '400px',
          lineHeight: 1.6
        }}>
          We're currently working on bringing you useful business services. 
          Check back soon for updates!
        </p>
      </div>
    </div>
  );
}

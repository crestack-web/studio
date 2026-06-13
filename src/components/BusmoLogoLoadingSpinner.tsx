import React from 'react';
import styles from './BusmoLogoLoadingSpinner.module.css';

export function BusmoLogoLoadingSpinner({ size = 80 }: { size?: number }) {
  return (
    <div className={styles.container}>
      <div className={styles.logoContainer} style={{ width: size, height: size }}>
        <img
          src="/email-logo.png"
          alt="Busmo Logo"
          className={styles.logo}
          style={{ width: size, height: size, objectFit: 'contain' }}
        />
      </div>
    </div>
  );
}

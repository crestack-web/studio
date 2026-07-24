import React, { useState } from 'react';
import styles from './BusmoLogoLoadingSpinner.module.css';

export function BusmoLogoLoadingSpinner({ size = 80 }: { size?: number }) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    // Fallback to simple spinner if image fails to load
    return (
      <div className="animate-spin rounded-full" style={{ 
        width: size, 
        height: size, 
        borderWidth: '4px',
        borderColor: '#6B3FE7',
        borderTopColor: 'transparent'
      }} />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.logoContainer} style={{ width: size, height: size }}>
        <img
          src="/email-logo.png"
          alt="Busmo Logo"
          className={styles.logo}
          style={{ width: size, height: size, objectFit: 'contain' }}
          onError={() => setImageError(true)}
        />
      </div>
    </div>
  );
}

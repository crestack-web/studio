import React from 'react';
import styles from './MOLoadingSpinner.module.css';

export function MOLoadingSpinner({ size = 80 }: { size?: number }) {
  return (
    <div className={styles.container}>
      <div className={styles.logoContainer} style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.logo}
        >
          <circle cx="40" cy="37" r="21" fill="#F5C9A0" className={styles.face} />
          <path
            d="M19 33 C19 19 61 19 61 33 L61 26 C61 14 19 14 19 26 Z"
            fill="#2C1A0E"
            className={styles.hair}
          />
          <ellipse cx="31" cy="36" rx="4" ry="4.5" fill="#1A2B3C" className={styles.eye} />
          <ellipse cx="49" cy="36" rx="4" ry="4.5" fill="#1A2B3C" className={styles.eye} />
          <circle cx="32.5" cy="34.5" r="1.5" fill="white" className={styles.eyeShine} />
          <circle cx="50.5" cy="34.5" r="1.5" fill="white" className={styles.eyeShine} />
          <path
            d="M30 43 Q40 50 50 43"
            stroke="#CC7A3A"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            className={styles.smile}
          />
          <ellipse
            cx="23"
            cy="41"
            rx="4"
            ry="2.5"
            fill="#F4A535"
            opacity="0.35"
            className={styles.cheek}
          />
          <ellipse
            cx="57"
            cy="41"
            rx="4"
            ry="2.5"
            fill="#F4A535"
            opacity="0.35"
            className={styles.cheek}
          />
          <ellipse
            cx="40"
            cy="65"
            rx="16"
            ry="7"
            fill="#1DB954"
            opacity="0.9"
            className={styles.body}
          />
          <rect
            x="32"
            y="58"
            width="16"
            height="9"
            rx="5"
            fill="#F5C9A0"
            className={styles.neck}
          />
          <polygon
            points="36,58 44,58 42,66 38,66"
            fill="#1DB954"
            className={styles.tie}
          />
        </svg>
        <div className={styles.pulseRing}></div>
        <div className={styles.pulseRing2}></div>
      </div>
      <div className={styles.loadingText}>
        <span className={styles.loadingLetter} style={{ animationDelay: '0s' }}>L</span>
        <span className={styles.loadingLetter} style={{ animationDelay: '0.1s' }}>o</span>
        <span className={styles.loadingLetter} style={{ animationDelay: '0.2s' }}>a</span>
        <span className={styles.loadingLetter} style={{ animationDelay: '0.3s' }}>d</span>
        <span className={styles.loadingLetter} style={{ animationDelay: '0.4s' }}>i</span>
        <span className={styles.loadingLetter} style={{ animationDelay: '0.5s' }}>n</span>
        <span className={styles.loadingLetter} style={{ animationDelay: '0.6s' }}>g</span>
        <span className={styles.loadingDots}>...</span>
      </div>
    </div>
  );
}

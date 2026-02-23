import React, { ReactNode } from 'react';
import styles from './Badge.module.css';

// ═══════════════════════════════════════════
//  Badge — inline status pill
// ═══════════════════════════════════════════

type BadgeColor = 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'neutral';

interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
}

export function Badge({ children, color = 'neutral' }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[color]}`}>{children}</span>
  );
}

// ═══════════════════════════════════════════
//  MetricCard — single KPI tile
// ═══════════════════════════════════════════

type TrendType = 'up' | 'down' | 'neutral';

interface MetricCardProps {
  label: string;
  value: string;
  trend?: string;
  trendType?: TrendType;
  valueColor?: 'default' | 'green' | 'red';
}

export function MetricCard({
  label,
  value,
  trend,
  trendType = 'neutral',
  valueColor = 'default',
}: MetricCardProps) {
  return (
    <div className={styles.metric}>
      <div className={styles.metricLabel}>{label}</div>
      <div
        className={`${styles.metricValue} ${
          valueColor === 'green' ? styles.valueGreen :
          valueColor === 'red'   ? styles.valueRed : ''
        }`}
      >
        {value}
      </div>
      {trend && (
        <span
          className={`${styles.trend} ${
            trendType === 'up'   ? styles.trendUp :
            trendType === 'down' ? styles.trendDown : styles.trendNeutral
          }`}
        >
          {trend}
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
//  Pill — table status pill
// ═══════════════════════════════════════════

type PillColor = 'green' | 'red' | 'amber' | 'blue' | 'purple';

interface PillProps {
  children: ReactNode;
  color?: PillColor;
}

export function Pill({ children, color = 'green' }: PillProps) {
  return (
    <span className={`${styles.pill} ${styles[`pill_${color}`]}`}>
      {children}
    </span>
  );
}

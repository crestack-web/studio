'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import styles from './StoreAnalytics.module.css';

export function StoreAnalytics() {
  const { user } = useApp();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!user.businessId) return;
      try {
        const res = await fetch(`/api/store/analytics/fetch?businessId=${user.businessId}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [user.businessId]);

  if (loading) return <div className={styles.loading}>Loading analytics...</div>;
  if (!data) return <div className={styles.empty}>No analytics data available.</div>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Store Intelligence</h2>
      
      <div className={styles.summaryGrid}>
        <div className={styles.card}>
          <div className={styles.label}>Page Views</div>
          <div className={styles.value}>{data.pageViews.toLocaleString()}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.label}>Checkouts Initiated</div>
          <div className={styles.value}>{data.checkoutsInitiated.toLocaleString()}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.label}>Orders Completed</div>
          <div className={styles.value}>{data.ordersCompleted.toLocaleString()}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.label}>Conversion Rate</div>
          <div className={styles.value}>{data.conversionRate.toFixed(1)}%</div>
        </div>
      </div>

      <div className={styles.tableCard}>
        <h3 className={styles.tableTitle}>Top Products</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Product ID</th>
              <th>Orders</th>
            </tr>
          </thead>
          <tbody>
            {data.topProducts.map((p: any) => (
              <tr key={p.productId}>
                <td>{p.productId}</td>
                <td>{p.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

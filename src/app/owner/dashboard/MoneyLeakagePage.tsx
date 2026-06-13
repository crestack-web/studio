'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { Card, CardHeader, CardIcon } from './Card';
import { Button } from './Button';
import { MoneyLeakageAlert } from './types';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import styles from './MoneyLeakagePage.module.css';

export default function MoneyLeakagePage() {
  const { user, showToast, navigateTo } = useApp();
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();
  
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<MoneyLeakageAlert[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'all'>('month');

  useEffect(() => {
    detectLeakages();
  }, [selectedPeriod, user.businessId]);

  const detectLeakages = async () => {
    if (!user.businessId) return;
    
    setLoading(true);
    try {
      const { firestore } = initializeFirebase();
      const salesRef = collection(firestore, 'merchants', user.businessId, 'sales');
      
      let startDate = new Date();
      if (selectedPeriod === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (selectedPeriod === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (selectedPeriod === 'quarter') {
        startDate.setMonth(startDate.getMonth() - 3);
      } else {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }
      
      const q = query(
        salesRef,
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const detectedAlerts: MoneyLeakageAlert[] = [];
      
      // TODO: Implement actual leakage detection logic
      // For now, this page requires real reconciliation data to detect:
      // - Cash shortages (compare expected vs actual cash)
      // - Missing transfers (compare expected vs actual bank transfers)
      // - Duplicate payments (check for duplicate transaction IDs)
      // - Overpayments (compare payment total vs sale total)
      // - Unmatched deposits (compare bank deposits to sales)
      
      // Placeholder: No alerts detected without reconciliation data
      
      // Sort by severity and amount
      detectedAlerts.sort((a, b) => {
        const severityOrder = { high: 0, medium: 1, low: 2 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return b.amount - a.amount;
      });
      
      setAlerts(detectedAlerts);
    } catch (error) {
      console.error('Error detecting leakages:', error);
      showToast('Failed to detect leakages');
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, status: 'resolved' as const } : alert
    ));
    showToast('Alert marked as resolved');
  };

  const AlertCard = ({ alert }: { alert: MoneyLeakageAlert }) => {
    const severityColors: Record<string, string> = {
      high: '#DC2626',
      medium: '#F59E0B',
      low: '#16A34A',
    };
    
    const typeIcons: Record<string, string> = {
      cash_shortage: '💰',
      missing_transfer: '📤',
      unmatched_deposit: '🏦',
      duplicate_payment: '🔄',
      overpayment: '➕',
    };
    
    return (
      <div className={`${styles.alertCard} ${alert.status === 'resolved' ? styles.resolved : ''}`}>
        <div className={styles.alertHeader}>
          <div className={styles.alertIcon}>{typeIcons[alert.type] || '⚠️'}</div>
          <div className={styles.alertTitle}>{alert.type.replace('_', ' ').toUpperCase()}</div>
          <div 
            className={styles.severityBadge}
            style={{ background: severityColors[alert.severity] + '20', color: severityColors[alert.severity] }}
          >
            {alert.severity.toUpperCase()}
          </div>
        </div>
        
        <div className={styles.alertDescription}>{alert.description}</div>
        
        <div className={styles.alertAmount}>{formatMoney(alert.amount)}</div>
        
        <div className={styles.alertFooter}>
          <div className={styles.alertDate}>
            Detected: {alert.detectedAt.toLocaleDateString()}
          </div>
          {alert.status === 'open' && (
            <Button variant="subtle" onClick={() => resolveAlert(alert.id)}>
              Mark Resolved
            </Button>
          )}
          {alert.status === 'resolved' && (
            <div className={styles.resolvedBadge}>✓ Resolved</div>
          )}
        </div>
      </div>
    );
  };

  const totalLeakage = alerts.reduce((sum, alert) => alert.status === 'open' ? sum + alert.amount : sum, 0);
  const highSeverityCount = alerts.filter(a => a.status === 'open' && a.severity === 'high').length;
  const mediumSeverityCount = alerts.filter(a => a.status === 'open' && a.severity === 'medium').length;
  const lowSeverityCount = alerts.filter(a => a.status === 'open' && a.severity === 'low').length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Money Leakage Detection</h1>
          <p className={styles.pageDesc}>Identify and track potential money leakages</p>
        </div>
        <Button variant="subtle" onClick={() => navigateTo('money-control')}>← Back to Money Control</Button>
      </div>

      <div className={styles.content}>
        {/* Period Selector */}
        <Card>
          <div className={styles.periodSelector}>
            {(['week', 'month', 'quarter', 'all'] as const).map((period) => (
              <button
                key={period}
                className={`${styles.periodBtn} ${selectedPeriod === period ? styles.active : ''}`}
                onClick={() => setSelectedPeriod(period)}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </Card>

        {/* Summary Stats */}
        {!loading && alerts.length > 0 && (
          <div className={styles.summaryGrid}>
            <Card>
              <CardHeader>
                <CardIcon bg="var(--red-bg)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth={2}>
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </CardIcon>
                Total Leakage
              </CardHeader>
              <div className={styles.summaryValue}>{formatMoney(totalLeakage)}</div>
            </Card>
            
            <Card>
              <CardHeader>
                <CardIcon bg="var(--red-bg)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth={2}>
                    <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </CardIcon>
                High Severity
              </CardHeader>
              <div className={styles.summaryValue}>{highSeverityCount}</div>
            </Card>
            
            <Card>
              <CardHeader>
                <CardIcon bg="var(--yellow-bg)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--yellow)" strokeWidth={2}>
                    <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </CardIcon>
                Medium Severity
              </CardHeader>
              <div className={styles.summaryValue}>{mediumSeverityCount}</div>
            </Card>
            
            <Card>
              <CardHeader>
                <CardIcon bg="var(--green-bg)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2}>
                    <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </CardIcon>
                Low Severity
              </CardHeader>
              <div className={styles.summaryValue}>{lowSeverityCount}</div>
            </Card>
          </div>
        )}

        {/* Alerts List */}
        {loading ? (
          <Card>
            <div className={styles.loading}>Detecting leakages…</div>
          </Card>
        ) : alerts.length === 0 ? (
          <Card>
            <div className={styles.empty}>No leakages detected</div>
          </Card>
        ) : (
          <div className={styles.alertsGrid}>
            {alerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

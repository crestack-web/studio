'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { Card, CardHeader, CardIcon } from './Card';
import { Button } from './Button';
import { StaffAccountability } from './types';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import styles from './StaffAccountabilityPage.module.css';

export default function StaffAccountabilityPage() {
  const { user, showToast, navigateTo } = useApp();
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();
  
  const [loading, setLoading] = useState(true);
  const [accountabilityData, setAccountabilityData] = useState<StaffAccountability[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'all'>('month');

  useEffect(() => {
    loadAccountabilityData();
  }, [selectedPeriod, user.businessId]);

  const loadAccountabilityData = async () => {
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
      
      // Group sales by staff member
      const staffMap = new Map<string, any>();
      
      sales.forEach((sale: any) => {
        const staffId = sale.recordedBy?.uid || 'unknown';
        const staffName = sale.recordedBy?.displayName || 'Unknown';
        
        if (!staffMap.has(staffId)) {
          staffMap.set(staffId, {
            staffId,
            staffName,
            salesRecorded: 0,
            expectedCash: 0,
            cashSubmitted: 0,
            bankCollections: 0,
            shortages: 0,
            outstandingPayments: 0,
          });
        }
        
        const staffData = staffMap.get(staffId);
        staffData.salesRecorded += 1;
        
        // Calculate expected cash and bank from payment breakdown
        const breakdown = sale.paymentBreakdown || [];
        const cashAmount = breakdown.filter((pb: any) => pb.method === 'cash').reduce((sum: number, pb: any) => sum + pb.amount, 0);
        const bankAmount = breakdown.filter((pb: any) => ['transfer', 'pos', 'card'].includes(pb.method)).reduce((sum: number, pb: any) => sum + pb.amount, 0);
        
        staffData.expectedCash += cashAmount;
        staffData.bankCollections += bankAmount;
        
        // TODO: Calculate actual cash submitted from cash reconciliation data
        // For now, set to 0 until reconciliation data is available
        staffData.cashSubmitted += 0;
        
        // Calculate shortages
        staffData.shortages += Math.max(0, cashAmount - 0);
        
        // Calculate outstanding payments (credit sales)
        const creditAmount = breakdown.filter((pb: any) => pb.method === 'credit').reduce((sum: number, pb: any) => sum + pb.amount, 0);
        staffData.outstandingPayments += creditAmount;
      });
      
      // Convert to StaffAccountability format
      const accountabilityData: StaffAccountability[] = Array.from(staffMap.values()).map(staff => {
        const reconciliationRate = staff.expectedCash > 0 
          ? ((staff.cashSubmitted / staff.expectedCash) * 100)
          : 100;
        
        return {
          staffId: staff.staffId,
          staffName: staff.staffName,
          period: {
            start: startDate,
            end: new Date(),
          },
          salesRecorded: staff.salesRecorded,
          expectedCash: staff.expectedCash,
          cashSubmitted: staff.cashSubmitted,
          bankCollections: staff.bankCollections,
          shortages: staff.shortages,
          outstandingPayments: staff.outstandingPayments,
          reconciliationRate,
        };
      });
      
      setAccountabilityData(accountabilityData);
    } catch (error) {
      console.error('Error loading accountability data:', error);
      showToast('Failed to load accountability data');
    } finally {
      setLoading(false);
    }
  };

  const AccountabilityCard = ({ data }: { data: StaffAccountability }) => (
    <div className={styles.accountabilityCard}>
      <div className={styles.cardHeader}>
        <div className={styles.staffName}>{data.staffName}</div>
        <div className={styles.reconciliationRate}>
          <span className={styles.rateLabel}>Reconciliation Rate</span>
          <span className={`${styles.rateValue} ${data.reconciliationRate >= 95 ? styles.excellent : data.reconciliationRate >= 80 ? styles.good : styles.poor}`}>
            {data.reconciliationRate.toFixed(1)}%
          </span>
        </div>
      </div>
      
      <div className={styles.cardStats}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Sales Recorded</div>
          <div className={styles.statValue}>{data.salesRecorded}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Expected Cash</div>
          <div className={styles.statValue}>{formatMoney(data.expectedCash)}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Cash Submitted</div>
          <div className={styles.statValue}>{formatMoney(data.cashSubmitted)}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Bank Collections</div>
          <div className={styles.statValue}>{formatMoney(data.bankCollections)}</div>
        </div>
      </div>
      
      <div className={styles.cardAlerts}>
        {data.shortages > 0 && (
          <div className={styles.alert}>
            <span className={styles.alertIcon}>⚠️</span>
            <span className={styles.alertText}>Shortages: {formatMoney(data.shortages)}</span>
          </div>
        )}
        {data.outstandingPayments > 0 && (
          <div className={styles.alert}>
            <span className={styles.alertIcon}>📝</span>
            <span className={styles.alertText}>Outstanding: {formatMoney(data.outstandingPayments)}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Staff Accountability</h1>
          <p className={styles.pageDesc}>Track staff performance and cash reconciliation rates</p>
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

        {/* Accountability Cards */}
        {loading ? (
          <div className={styles.loading}>Loading…</div>
        ) : accountabilityData.length === 0 ? (
          <Card>
            <div className={styles.empty}>No accountability data available</div>
          </Card>
        ) : (
          <div className={styles.accountabilityGrid}>
            {accountabilityData.map((data, index) => (
              <AccountabilityCard key={index} data={data} />
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {!loading && accountabilityData.length > 0 && (
          <Card>
            <CardHeader>
              <CardIcon bg="var(--purple-lt)">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth={2}>
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </CardIcon>
              Summary
            </CardHeader>
            
            <div className={styles.summaryStats}>
              <div className={styles.summaryStat}>
                <div className={styles.summaryLabel}>Total Staff</div>
                <div className={styles.summaryValue}>{accountabilityData.length}</div>
              </div>
              <div className={styles.summaryStat}>
                <div className={styles.summaryLabel}>Total Sales</div>
                <div className={styles.summaryValue}>
                  {accountabilityData.reduce((sum, data) => sum + data.salesRecorded, 0)}
                </div>
              </div>
              <div className={styles.summaryStat}>
                <div className={styles.summaryLabel}>Total Shortages</div>
                <div className={`${styles.summaryValue} ${styles.negative}`}>
                  {formatMoney(accountabilityData.reduce((sum, data) => sum + data.shortages, 0))}
                </div>
              </div>
              <div className={styles.summaryStat}>
                <div className={styles.summaryLabel}>Avg Reconciliation Rate</div>
                <div className={styles.summaryValue}>
                  {(accountabilityData.reduce((sum, data) => sum + data.reconciliationRate, 0) / accountabilityData.length).toFixed(1)}%
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

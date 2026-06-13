'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { Card, CardHeader, CardIcon } from './Card';
import { Button } from './Button';
import { PaymentTraceability } from './types';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import styles from './PaymentTraceabilityPage.module.css';

export default function PaymentTraceabilityPage() {
  const { user, showToast, navigateTo } = useApp();
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();
  
  const [loading, setLoading] = useState(true);
  const [traceabilityData, setTraceabilityData] = useState<PaymentTraceability[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'all'>('month');
  const [selectedSale, setSelectedSale] = useState<PaymentTraceability | null>(null);

  useEffect(() => {
    loadTraceabilityData();
  }, [selectedPeriod, user.businessId]);

  const loadTraceabilityData = async () => {
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
      
      const traceability: PaymentTraceability[] = sales.map((sale: any) => {
        const breakdown = sale.paymentBreakdown || [];
        const totalAmount = breakdown.reduce((sum: number, pb: any) => sum + pb.amount, 0);
        
        return {
          saleId: sale.id,
          saleDate: sale.createdAt?.toDate() || new Date(),
          totalAmount,
          customerName: sale.customerName || 'Walk-in Customer',
          products: sale.products?.map((p: any) => ({
            name: p.name,
            quantity: p.quantity,
            price: p.price,
          })) || [],
          staffId: sale.recordedBy?.uid || 'unknown',
          staffName: sale.recordedBy?.displayName || 'Unknown',
          paymentBreakdown: breakdown,
          paymentReceived: totalAmount > 0,
          reconciled: false, // TODO: Implement actual reconciliation status from reconciliation data
          reconciledAt: undefined, // TODO: Implement actual reconciliation timestamp from reconciliation data
        };
      });
      
      setTraceabilityData(traceability);
    } catch (error) {
      console.error('Error loading traceability data:', error);
      showToast('Failed to load traceability data');
    } finally {
      setLoading(false);
    }
  };

  const TraceabilityRow = ({ data }: { data: PaymentTraceability }) => (
    <div className={styles.traceRow} onClick={() => setSelectedSale(data)}>
      <div className={styles.traceDate}>{data.saleDate.toLocaleDateString()}</div>
      <div className={styles.traceCustomer}>{data.customerName}</div>
      <div className={styles.traceAmount}>{formatMoney(data.totalAmount)}</div>
      <div className={styles.traceStaff}>{data.staffName}</div>
      <div className={`${styles.traceStatus} ${data.reconciled ? styles.reconciled : styles.pending}`}>
        {data.reconciled ? '✓ Reconciled' : '⏳ Pending'}
      </div>
    </div>
  );

  const PaymentBreakdownItem = ({ method, amount }: { method: string; amount: number }) => (
    <div className={styles.breakdownItem}>
      <span className={styles.breakdownMethod}>{method}</span>
      <span className={styles.breakdownAmount}>{formatMoney(amount)}</span>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Payment Traceability</h1>
          <p className={styles.pageDesc}>Track full payment journey from sale to bank reconciliation</p>
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

        {/* Traceability List */}
        {loading ? (
          <Card>
            <div className={styles.loading}>Loading…</div>
          </Card>
        ) : traceabilityData.length === 0 ? (
          <Card>
            <div className={styles.empty}>No traceability data available</div>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardIcon bg="var(--purple-lt)">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth={2}>
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                </svg>
              </CardIcon>
              Payment Traceability ({traceabilityData.length})
            </CardHeader>
            
            <div className={styles.traceList}>
              <div className={styles.traceHeader}>
                <div className={styles.headerDate}>Date</div>
                <div className={styles.headerCustomer}>Customer</div>
                <div className={styles.headerAmount}>Amount</div>
                <div className={styles.headerStaff}>Staff</div>
                <div className={styles.headerStatus}>Status</div>
              </div>
              {traceabilityData.map(data => (
                <TraceabilityRow key={data.saleId} data={data} />
              ))}
            </div>
          </Card>
        )}

        {/* Selected Sale Detail */}
        {selectedSale && (
          <Card>
            <CardHeader>
              <CardIcon bg="var(--green-bg)">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2}>
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </CardIcon>
              Sale Details
              <Button variant="subtle" onClick={() => setSelectedSale(null)}>✕</Button>
            </CardHeader>
            
            <div className={styles.saleDetail}>
              <div className={styles.detailSection}>
                <h3 className={styles.detailTitle}>Sale Information</h3>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Sale ID:</span>
                  <span className={styles.detailValue}>{selectedSale.saleId}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Date:</span>
                  <span className={styles.detailValue}>{selectedSale.saleDate.toLocaleString()}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Customer:</span>
                  <span className={styles.detailValue}>{selectedSale.customerName}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Total Amount:</span>
                  <span className={styles.detailValue}>{formatMoney(selectedSale.totalAmount)}</span>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3 className={styles.detailTitle}>Staff Information</h3>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Staff ID:</span>
                  <span className={styles.detailValue}>{selectedSale.staffId}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Staff Name:</span>
                  <span className={styles.detailValue}>{selectedSale.staffName}</span>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3 className={styles.detailTitle}>Products</h3>
                {selectedSale.products.map((product, idx) => (
                  <div key={idx} className={styles.productItem}>
                    <span className={styles.productName}>{product.name}</span>
                    <span className={styles.productQty}>×{product.quantity}</span>
                    <span className={styles.productPrice}>{formatMoney(product.price)}</span>
                  </div>
                ))}
              </div>

              <div className={styles.detailSection}>
                <h3 className={styles.detailTitle}>Payment Breakdown</h3>
                {selectedSale.paymentBreakdown.map((pb, idx) => (
                  <PaymentBreakdownItem key={idx} method={pb.method} amount={pb.amount} />
                ))}
              </div>

              <div className={styles.detailSection}>
                <h3 className={styles.detailTitle}>Reconciliation Status</h3>
                <div className={`${styles.statusBadge} ${selectedSale.reconciled ? styles.reconciled : styles.pending}`}>
                  {selectedSale.reconciled ? '✓ Reconciled' : '⏳ Pending'}
                </div>
                {selectedSale.reconciledAt && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Reconciled At:</span>
                    <span className={styles.detailValue}>{selectedSale.reconciledAt.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

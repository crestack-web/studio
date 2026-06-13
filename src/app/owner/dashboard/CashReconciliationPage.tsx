'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { Card, CardHeader, CardIcon } from './Card';
import { Button } from './Button';
import { CashReconciliation, detectShift, Shift } from './types';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, addDoc, Timestamp } from 'firebase/firestore';
import styles from './CashReconciliationPage.module.css';

interface SaleData {
  id: string;
  totalRevenue: number;
  paymentBreakdown?: any[];
  createdAt: Timestamp;
  recordedBy?: string;
  shift?: Shift;
}

interface StaffData {
  id: string;
  name: string;
}

export default function CashReconciliationPage() {
  const { user, showToast, navigateTo } = useApp();
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();
  
  const [loading, setLoading] = useState(true);
  const [reconciliations, setReconciliations] = useState<CashReconciliation[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedCash, setExpectedCash] = useState(0);
  const [actualCash, setActualCash] = useState(0);
  const [notes, setNotes] = useState('');
  const [shift, setShift] = useState<Shift>('morning');
  const [salesForShift, setSalesForShift] = useState<SaleData[]>([]);
  const [staffMap, setStaffMap] = useState<Record<string, StaffData>>({});
  const [autoCalculated, setAutoCalculated] = useState(false);

  useEffect(() => {
    loadReconciliations();
    loadStaffData();
  }, [user.businessId]);

  useEffect(() => {
    if (selectedDate && shift) {
      loadSalesForShift();
    }
  }, [selectedDate, shift, user.businessId]);

  const loadStaffData = async () => {
    if (!user.businessId) return;
    
    try {
      const { firestore } = initializeFirebase();
      const staffRef = collection(firestore, 'merchants', user.businessId, 'staff');
      const snapshot = await getDocs(staffRef);
      
      const staff: Record<string, StaffData> = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        staff[doc.id] = {
          id: doc.id,
          name: data.name || 'Unknown',
        };
      });
      
      setStaffMap(staff);
    } catch (error) {
      console.error('Error loading staff data:', error);
    }
  };

  const loadSalesForShift = async () => {
    if (!user.businessId || !selectedDate) return;
    
    try {
      const { firestore } = initializeFirebase();
      const salesRef = collection(firestore, 'merchants', user.businessId, 'sales');
      
      // Get start and end of selected date
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);
      
      const q = query(
        salesRef,
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate)),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      const sales: SaleData[] = snapshot.docs.map(doc => {
        const data = doc.data();
        const saleDate = data.createdAt?.toDate() || new Date();
        const detectedShift = detectShift(saleDate);
        
        return {
          id: doc.id,
          totalRevenue: data.totalRevenue || data.total || 0,
          paymentBreakdown: data.paymentBreakdown || [],
          createdAt: data.createdAt || Timestamp.now(),
          recordedBy: data.recordedBy,
          shift: detectedShift,
        };
      });
      
      // Filter sales by selected shift
      const shiftSales = sales.filter(sale => sale.shift === shift);
      setSalesForShift(shiftSales);
      
      // Auto-calculate expected cash from sales in this shift
      const expectedCashFromSales = shiftSales.reduce((sum, sale) => {
        const breakdown = sale.paymentBreakdown || [];
        const cashAmount = breakdown
          .filter((pb: any) => pb.method === 'cash')
          .reduce((s: number, pb: any) => s + pb.amount, 0);
        return sum + cashAmount;
      }, 0);
      
      setExpectedCash(expectedCashFromSales);
      setAutoCalculated(true);
      
    } catch (error) {
      console.error('Error loading sales for shift:', error);
    }
  };

  const loadReconciliations = async () => {
    if (!user.businessId) return;
    
    setLoading(true);
    try {
      const { firestore } = initializeFirebase();
      const reconciliationsRef = collection(firestore, 'merchants', user.businessId, 'cashReconciliations');
      
      const q = query(reconciliationsRef, orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      
      const recs: CashReconciliation[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          merchantId: data.merchantId,
          staffId: data.staffId || user.id,
          date: data.date?.toDate() || new Date(),
          expectedCash: data.expectedCash || 0,
          actualCash: data.actualCash || 0,
          variance: data.variance || 0,
          notes: data.notes || '',
          shift: data.shift || '',
          reconciledBy: data.reconciledBy || '',
          reconciledAt: data.reconciledAt?.toDate() || new Date(),
        };
      });
      
      setReconciliations(recs);
    } catch (error) {
      console.error('Error loading reconciliations:', error);
      showToast('Failed to load reconciliations');
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async () => {
    if (!user.businessId) {
      showToast('Business ID not found');
      return;
    }

    const variance = actualCash - expectedCash;
    
    try {
      const { firestore } = initializeFirebase();
      const reconciliationsRef = collection(firestore, 'merchants', user.businessId, 'cashReconciliations');
      
      // Link to sales for this shift
      const saleIds = salesForShift.map(s => s.id);
      
      await addDoc(reconciliationsRef, {
        merchantId: user.businessId,
        date: Timestamp.fromDate(new Date(selectedDate)),
        expectedCash,
        actualCash,
        variance,
        notes,
        shift,
        reconciledBy: user.id,
        reconciledAt: Timestamp.now(),
        saleIds, // Link to sales for traceability
        salesCount: salesForShift.length,
      });
      
      showToast('Cash reconciliation saved successfully');
      setExpectedCash(0);
      setActualCash(0);
      setNotes('');
      setAutoCalculated(false);
      loadReconciliations();
      loadSalesForShift(); // Reload sales to clear
    } catch (error) {
      console.error('Error saving reconciliation:', error);
      showToast('Failed to save reconciliation');
    }
  };

  const variance = actualCash - expectedCash;
  const variancePercent = expectedCash > 0 ? ((variance / expectedCash) * 100).toFixed(2) : '0';

  const ReconciliationRow = ({ rec }: { rec: CashReconciliation }) => (
    <div className={styles.reconciliationRow}>
      <div className={styles.recDate}>{rec.date.toLocaleDateString()}</div>
      <div className={styles.recShift}>{rec.shift}</div>
      <div className={styles.recExpected}>{formatMoney(rec.expectedCash)}</div>
      <div className={styles.recActual}>{formatMoney(rec.actualCash)}</div>
      <div className={`${styles.recVariance} ${rec.variance >= 0 ? styles.positive : styles.negative}`}>
        {rec.variance >= 0 ? '+' : ''}{formatMoney(rec.variance)}
      </div>
      <div className={styles.recNotes}>{rec.notes || '-'}</div>
    </div>
  );

  const SalesRow = ({ sale }: { sale: SaleData }) => {
    const staffName = sale.recordedBy ? staffMap[sale.recordedBy]?.name : 'Unknown';
    const cashAmount = (sale.paymentBreakdown || [])
      .filter((pb: any) => pb.method === 'cash')
      .reduce((s: number, pb: any) => s + pb.amount, 0);
    
    return (
      <div className={styles.saleRow}>
        <div className={styles.saleTime}>{sale.createdAt?.toDate()?.toLocaleTimeString()}</div>
        <div className={styles.saleStaff}>{staffName}</div>
        <div className={styles.saleTotal}>{formatMoney(sale.totalRevenue)}</div>
        <div className={styles.saleCash}>{formatMoney(cashAmount)}</div>
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Cash Reconciliation</h1>
          <p className={styles.pageDesc}>Track daily cash collections and identify variances</p>
        </div>
        <Button variant="subtle" onClick={() => navigateTo('money-control')}>← Back to Money Control</Button>
      </div>

      <div className={styles.content}>
        {/* New Reconciliation Form */}
        <Card>
          <CardHeader>
            <CardIcon bg="var(--green-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2}>
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </CardIcon>
            New Cash Reconciliation
          </CardHeader>
          
          <div className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Date</label>
                <input
                  type="date"
                  className={styles.formInput}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Shift</label>
                <select
                  className={styles.formInput}
                  value={shift}
                  onChange={(e) => setShift(e.target.value as any)}
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Expected Cash</label>
                <input
                  type="number"
                  className={styles.formInput}
                  value={expectedCash}
                  onChange={(e) => {
                    setExpectedCash(Number(e.target.value));
                    setAutoCalculated(false);
                  }}
                  placeholder="0.00"
                />
                {autoCalculated && (
                  <div className={styles.autoCalculatedBadge}>
                    ✓ Auto-calculated from {salesForShift.length} sales
                  </div>
                )}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Actual Cash</label>
                <input
                  type="number"
                  className={styles.formInput}
                  value={actualCash}
                  onChange={(e) => setActualCash(Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className={styles.varianceDisplay}>
              <div className={styles.varianceLabel}>Variance</div>
              <div className={`${styles.varianceValue} ${variance >= 0 ? styles.positive : styles.negative}`}>
                {variance >= 0 ? '+' : ''}{formatMoney(variance)} ({variancePercent}%)
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Notes (Optional)</label>
              <input
                className={styles.formInput}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this reconciliation..."
              />
            </div>

            <Button variant="primary" onClick={handleReconcile} className={styles.submitBtn}>
              Save Reconciliation
            </Button>
          </div>
        </Card>

        {/* Sales for Selected Shift */}
        <Card>
          <CardHeader>
            <CardIcon bg="var(--purple-lt)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth={2}>
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </CardIcon>
            Sales for {shift.charAt(0).toUpperCase() + shift.slice(1)} Shift ({selectedDate})
          </CardHeader>
          
          {salesForShift.length === 0 ? (
            <div className={styles.empty}>No sales recorded for this shift</div>
          ) : (
            <div className={styles.salesList}>
              <div className={styles.salesHeader}>
                <div className={styles.headerTime}>Time</div>
                <div className={styles.headerStaff}>Staff</div>
                <div className={styles.headerTotal}>Total</div>
                <div className={styles.headerCash}>Cash</div>
              </div>
              {salesForShift.map(sale => (
                <SalesRow key={sale.id} sale={sale} />
              ))}
            </div>
          )}
        </Card>

        {/* Reconciliation History */}
        <Card>
          <CardHeader>
            <CardIcon bg="var(--purple-lt)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth={2}>
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </CardIcon>
            Reconciliation History
          </CardHeader>
          
          {loading ? (
            <div className={styles.loading}>Loading…</div>
          ) : reconciliations.length === 0 ? (
            <div className={styles.empty}>No reconciliations yet</div>
          ) : (
            <div className={styles.reconciliationsList}>
              <div className={styles.reconciliationHeader}>
                <div className={styles.headerDate}>Date</div>
                <div className={styles.headerShift}>Shift</div>
                <div className={styles.headerExpected}>Expected</div>
                <div className={styles.headerActual}>Actual</div>
                <div className={styles.headerVariance}>Variance</div>
                <div className={styles.headerNotes}>Notes</div>
              </div>
              {reconciliations.map(rec => (
                <ReconciliationRow key={rec.id} rec={rec} />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc, Timestamp } from 'firebase/firestore';
import { Supplier, SupplierLedgerTransaction } from './types';
import { Card, CardHeader, CardIcon } from './Card';
import { Button } from './Button';
import styles from './SupplierProfilePage.module.css';

interface SupplierProfileProps {
  supplierId: string;
}

export function SupplierProfilePage({ supplierId }: SupplierProfileProps) {
  const { navigateTo, showToast, user } = useApp();
  const { formatMoney, currencyCode } = useCurrency();
  const { businessId } = useBranch();
  const { firestore } = initializeFirebase();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [supplierLedger, setSupplierLedger] = useState<SupplierLedgerTransaction[]>([]);
  const [stockReceipts, setStockReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'purchases' | 'financials' | 'ledger'>('overview');

  useEffect(() => {
    loadData();
  }, [businessId, firestore, supplierId]);

  const loadData = async () => {
    if (!businessId || !firestore || !supplierId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Load supplier details
      const supplierDoc = await getDoc(doc(firestore, 'businesses', businessId, 'suppliers', supplierId));
      if (supplierDoc.exists()) {
        const data = supplierDoc.data();
        setSupplier({
          id: supplierDoc.id,
          businessId: data.businessId || '',
          supplierName: data.supplierName || '',
          businessName: data.businessName || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          notes: data.notes || '',
          paymentTerms: data.paymentTerms || 'net_30',
          customPaymentDays: data.customPaymentDays || 30,
          creditLimit: data.creditLimit || 0,
          openingBalance: data.openingBalance || 0,
          currentBalance: data.currentBalance || 0,
          category: data.category || 'general',
          status: data.status || 'active',
          taxId: data.taxId || '',
          bankAccount: data.bankAccount || null,
          contactPerson: data.contactPerson || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastPurchaseDate: data.lastPurchaseDate?.toDate(),
          lastPaymentDate: data.lastPaymentDate?.toDate(),
          totalPurchases: data.totalPurchases || 0,
          totalPayments: data.totalPayments || 0,
          purchaseCount: data.purchaseCount || 0,
          paymentCount: data.paymentCount || 0,
          averagePaymentDays: data.averagePaymentDays || 0,
          creditUtilization: data.creditUtilization || 0,
        });
      }

      // Load supplier ledger
      const ledgerQuery = query(
        collection(firestore, 'businesses', businessId, 'supplierLedger'),
        where('supplierId', '==', supplierId),
        orderBy('date', 'desc')
      );
      const ledgerSnapshot = await getDocs(ledgerQuery);
      const ledgerList: SupplierLedgerTransaction[] = [];
      
      ledgerSnapshot.forEach(doc => {
        const data = doc.data();
        ledgerList.push({
          id: doc.id,
          supplierId: data.supplierId || '',
          businessId: data.businessId || '',
          type: data.type || 'purchase',
          amount: data.amount || 0,
          balanceAfter: data.balanceAfter || 0,
          description: data.description || '',
          reference: data.reference || '',
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          createdBy: data.createdBy || '',
          createdByName: data.createdByName || '',
          metadata: data.metadata || {},
        });
      });
      
      setSupplierLedger(ledgerList);

      // Load stock receipts from this supplier
      const receiptsQuery = query(
        collection(firestore, 'businesses', businessId, 'stockReceipts'),
        where('supplierId', '==', supplierId),
        orderBy('createdAt', 'desc')
      );
      const receiptsSnapshot = await getDocs(receiptsQuery);
      const receiptsList: any[] = [];
      
      receiptsSnapshot.forEach(doc => {
        const data = doc.data();
        receiptsList.push({
          id: doc.id,
          receiptNumber: data.receiptNumber,
          totalQuantity: data.totalQuantity,
          totalCost: data.totalCost,
          paymentMethod: data.paymentMethod,
          paidAmount: data.paidAmount,
          creditAmount: data.creditAmount,
          receivedAt: data.receivedAt,
          createdAt: data.createdAt?.toDate() || new Date(),
          items: data.items || [],
        });
      });
      
      setStockReceipts(receiptsList);
    } catch (error) {
      console.error('Error loading supplier profile:', error);
      showToast('Failed to load supplier data');
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilDue = (): number => {
    if (!supplier || !supplier.lastPurchaseDate) return 30;
    
    const paymentDays = supplier.paymentTerms === 'cash' ? 0 : 
      supplier.paymentTerms === 'net_7' ? 7 :
      supplier.paymentTerms === 'net_14' ? 14 :
      supplier.paymentTerms === 'net_30' ? 30 :
      supplier.paymentTerms === 'net_60' ? 60 :
      supplier.paymentTerms === 'net_90' ? 90 :
      supplier.customPaymentDays || 30;
    
    const dueDate = new Date(supplier.lastPurchaseDate.getTime() + paymentDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    return Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const isOverdue = (): boolean => {
    return getDaysUntilDue() < 0;
  };

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>Loading...</h2>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>Supplier Not Found</h2>
          <Button variant="subtle" onClick={() => navigateTo('home')}>← Back</Button>
        </div>
      </div>
    );
  }

  const daysUntilDue = getDaysUntilDue();
  const overdue = isOverdue();

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <Button variant="subtle" onClick={() => navigateTo('home')}>← Back</Button>
          <h2 className={styles.pageTitle}>{supplier.businessName}</h2>
          <p className={styles.pageDesc}>{supplier.category} • {supplier.paymentTerms.toUpperCase()}</p>
        </div>
        <div className={styles.headerActions}>
          <Button size="sm">Edit Supplier</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <Card>
          <CardHeader>
            <CardIcon bg="var(--purple-lt)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth={2} width={20} height={20}>
                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
            </CardIcon>
            Current Balance
          </CardHeader>
          <div className={`${styles.summaryValue} ${supplier.currentBalance > 0 ? styles.outstanding : ''}`}>
            {formatMoney(supplier.currentBalance)}
          </div>
          <div className={styles.summaryLabel}>
            {overdue ? `${Math.abs(daysUntilDue)} days overdue` : `Due in ${daysUntilDue} days`}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardIcon bg="var(--green-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2} width={20} height={20}>
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </CardIcon>
            Total Purchases
          </CardHeader>
          <div className={styles.summaryValue}>{formatMoney(supplier.totalPurchases)}</div>
          <div className={styles.summaryLabel}>{supplier.purchaseCount} purchases</div>
        </Card>

        <Card>
          <CardHeader>
            <CardIcon bg="var(--blue-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2} width={20} height={20}>
                <path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>
              </svg>
            </CardIcon>
            Total Payments
          </CardHeader>
          <div className={styles.summaryValue}>{formatMoney(supplier.totalPayments)}</div>
          <div className={styles.summaryLabel}>{supplier.paymentCount} payments</div>
        </Card>

        <Card>
          <CardHeader>
            <CardIcon bg="var(--amber-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth={2} width={20} height={20}>
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </CardIcon>
            Credit Utilization
          </CardHeader>
          <div className={styles.summaryValue}>{supplier.creditUtilization.toFixed(1)}%</div>
          <div className={styles.summaryLabel}>Limit: {formatMoney(supplier.creditLimit)}</div>
        </Card>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button 
          className={[styles.tab, selectedTab === 'overview' ? styles.tabActive : ''].join(' ')}
          onClick={() => setSelectedTab('overview')}
        >
          Overview
        </button>
        <button 
          className={[styles.tab, selectedTab === 'purchases' ? styles.tabActive : ''].join(' ')}
          onClick={() => setSelectedTab('purchases')}
        >
          Purchases ({stockReceipts.length})
        </button>
        <button 
          className={[styles.tab, selectedTab === 'financials' ? styles.tabActive : ''].join(' ')}
          onClick={() => setSelectedTab('financials')}
        >
          Financials
        </button>
        <button 
          className={[styles.tab, selectedTab === 'ledger' ? styles.tabActive : ''].join(' ')}
          onClick={() => setSelectedTab('ledger')}
        >
          Ledger ({supplierLedger.length})
        </button>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className={styles.tabContent}>
          <Card>
            <CardHeader>
              <CardIcon bg="var(--blue-bg)">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2} width={20} height={20}>
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                </svg>
              </CardIcon>
              Contact Information
            </CardHeader>
            <div className={styles.infoGrid}>
              {supplier.phone && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Phone:</span>
                  <span className={styles.infoValue}>{supplier.phone}</span>
                </div>
              )}
              {supplier.email && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Email:</span>
                  <span className={styles.infoValue}>{supplier.email}</span>
                </div>
              )}
              {supplier.address && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Address:</span>
                  <span className={styles.infoValue}>{supplier.address}</span>
                </div>
              )}
              {supplier.taxId && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Tax ID:</span>
                  <span className={styles.infoValue}>{supplier.taxId}</span>
                </div>
              )}
              {supplier.contactPerson && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Contact Person:</span>
                  <span className={styles.infoValue}>{supplier.contactPerson.name} ({supplier.contactPerson.phone})</span>
                </div>
              )}
              {supplier.bankAccount && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Bank Account:</span>
                  <span className={styles.infoValue}>{supplier.bankAccount.bankName} - {supplier.bankAccount.accountNumber}</span>
                </div>
              )}
            </div>
          </Card>

          {supplier.notes && (
            <Card>
              <CardHeader>
                <CardIcon bg="var(--purple-lt)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth={2} width={20} height={20}>
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                  </svg>
                </CardIcon>
                Notes
              </CardHeader>
              <div className={styles.notesContent}>{supplier.notes}</div>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardIcon bg="var(--green-bg)">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2} width={20} height={20}>
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </CardIcon>
              Payment Terms
            </CardHeader>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Payment Terms:</span>
                <span className={styles.infoValue}>{supplier.paymentTerms.toUpperCase()}</span>
              </div>
              {supplier.customPaymentDays && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Custom Days:</span>
                  <span className={styles.infoValue}>{supplier.customPaymentDays} days</span>
                </div>
              )}
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Average Payment Days:</span>
                <span className={styles.infoValue}>{supplier.averagePaymentDays} days</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Credit Limit:</span>
                <span className={styles.infoValue}>{formatMoney(supplier.creditLimit)}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {selectedTab === 'purchases' && (
        <div className={styles.tabContent}>
          <Card>
            <CardHeader>
              <CardIcon bg="var(--purple-lt)">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth={2} width={20} height={20}>
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </CardIcon>
              Purchase History
            </CardHeader>
            <div className={styles.purchaseList}>
              {stockReceipts.length === 0 ? (
                <div className={styles.emptyState}>No purchases recorded</div>
              ) : (
                stockReceipts.map(receipt => (
                  <div key={receipt.id} className={styles.purchaseItem}>
                    <div className={styles.purchaseHeader}>
                      <div className={styles.purchaseNumber}>{receipt.receiptNumber}</div>
                      <div className={styles.purchaseDate}>{receipt.createdAt.toLocaleDateString()}</div>
                    </div>
                    <div className={styles.purchaseDetails}>
                      <div className={styles.purchaseDetail}>
                        <span className={styles.purchaseLabel}>Items:</span>
                        <span className={styles.purchaseValue}>{receipt.totalQuantity}</span>
                      </div>
                      <div className={styles.purchaseDetail}>
                        <span className={styles.purchaseLabel}>Total:</span>
                        <span className={styles.purchaseValue}>{formatMoney(receipt.totalCost)}</span>
                      </div>
                      <div className={styles.purchaseDetail}>
                        <span className={styles.purchaseLabel}>Payment:</span>
                        <span className={styles.purchaseValue}>{receipt.paymentMethod.toUpperCase()}</span>
                      </div>
                      {receipt.creditAmount > 0 && (
                        <div className={styles.purchaseDetail}>
                          <span className={styles.purchaseLabel}>Credit:</span>
                          <span className={`${styles.purchaseValue} ${styles.credit}`}>{formatMoney(receipt.creditAmount)}</span>
                        </div>
                      )}
                    </div>
                    {receipt.items && receipt.items.length > 0 && (
                      <div className={styles.purchaseItems}>
                        {receipt.items.slice(0, 3).map((item: any, index: number) => (
                          <div key={index} className={styles.purchaseItemLine}>
                            {item.productName} × {item.quantity}
                          </div>
                        ))}
                        {receipt.items.length > 3 && (
                          <div className={styles.purchaseItemLine}>+{receipt.items.length - 3} more items</div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {selectedTab === 'financials' && (
        <div className={styles.tabContent}>
          <Card>
            <CardHeader>
              <CardIcon bg="var(--blue-bg)">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2} width={20} height={20}>
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
              </CardIcon>
              Financial Summary
            </CardHeader>
            <div className={styles.financialGrid}>
              <div className={styles.financialCard}>
                <div className={styles.financialLabel}>Opening Balance</div>
                <div className={styles.financialValue}>{formatMoney(supplier.openingBalance)}</div>
              </div>
              <div className={styles.financialCard}>
                <div className={styles.financialLabel}>Current Balance</div>
                <div className={`${styles.financialValue} ${supplier.currentBalance > 0 ? styles.outstanding : ''}`}>
                  {formatMoney(supplier.currentBalance)}
                </div>
              </div>
              <div className={styles.financialCard}>
                <div className={styles.financialLabel}>Total Purchases</div>
                <div className={styles.financialValue}>{formatMoney(supplier.totalPurchases)}</div>
              </div>
              <div className={styles.financialCard}>
                <div className={styles.financialLabel}>Total Payments</div>
                <div className={styles.financialValue}>{formatMoney(supplier.totalPayments)}</div>
              </div>
              <div className={styles.financialCard}>
                <div className={styles.financialLabel}>Credit Limit</div>
                <div className={styles.financialValue}>{formatMoney(supplier.creditLimit)}</div>
              </div>
              <div className={styles.financialCard}>
                <div className={styles.financialLabel}>Available Credit</div>
                <div className={styles.financialValue}>
                  {formatMoney(supplier.creditLimit - supplier.currentBalance)}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardIcon bg="var(--amber-bg)">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth={2} width={20} height={20}>
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </CardIcon>
              Credit Utilization
            </CardHeader>
            <div className={styles.creditUtilizationSection}>
              <div className={styles.creditBar}>
                <div 
                  className={styles.creditFill}
                  style={{ 
                    width: `${Math.min(supplier.creditUtilization, 100)}%`,
                    backgroundColor: supplier.creditUtilization > 80 ? 'var(--red)' : supplier.creditUtilization > 60 ? 'var(--amber)' : 'var(--green)'
                  }}
                />
              </div>
              <div className={styles.creditStats}>
                <span className={styles.creditStat}>{supplier.creditUtilization.toFixed(1)}% utilized</span>
                <span className={styles.creditStat}>{formatMoney(supplier.creditLimit - supplier.currentBalance)} available</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {selectedTab === 'ledger' && (
        <div className={styles.tabContent}>
          <Card>
            <CardHeader>
              <CardIcon bg="var(--purple-lt)">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth={2} width={20} height={20}>
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </CardIcon>
              Transaction Ledger
            </CardHeader>
            <div className={styles.ledgerList}>
              {supplierLedger.length === 0 ? (
                <div className={styles.emptyState}>No transactions recorded</div>
              ) : (
                supplierLedger.map(transaction => (
                  <div key={transaction.id} className={styles.ledgerItem}>
                    <div className={styles.ledgerMain}>
                      <div className={styles.ledgerType}>
                        <span className={`${styles.typeBadge} ${styles[transaction.type]}`}>
                          {transaction.type.toUpperCase()}
                        </span>
                        <span className={styles.ledgerDescription}>{transaction.description}</span>
                      </div>
                      <div className={`${styles.ledgerAmount} ${transaction.type === 'payment' ? styles.payment : styles.purchase}`}>
                        {transaction.type === 'payment' ? '-' : '+'}{formatMoney(transaction.amount)}
                      </div>
                    </div>
                    <div className={styles.ledgerMeta}>
                      <span className={styles.ledgerDate}>{transaction.date.toLocaleDateString()}</span>
                      <span className={styles.ledgerReference}>{transaction.reference}</span>
                      <span className={styles.ledgerBalance}>Balance: {formatMoney(transaction.balanceAfter)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

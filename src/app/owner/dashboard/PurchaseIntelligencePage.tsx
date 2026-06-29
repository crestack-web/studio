'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Supplier, SupplierLedgerTransaction, PurchaseIntelligence } from './types';
import { Card, CardHeader, CardIcon } from './Card';
import { Button } from './Button';
import styles from './PurchaseIntelligencePage.module.css';

export function PurchaseIntelligencePage() {
  const { showToast, user } = useApp();
  const { formatMoney, currencyCode } = useCurrency();
  const { businessId } = useBranch();
  const { firestore } = initializeFirebase();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierLedger, setSupplierLedger] = useState<SupplierLedgerTransaction[]>([]);
  const [stockReceipts, setStockReceipts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'30' | '90' | '180' | '365'>('90');
  const [intelligence, setIntelligence] = useState<PurchaseIntelligence | null>(null);

  useEffect(() => {
    loadData();
  }, [businessId, firestore, selectedPeriod]);

  const loadData = async () => {
    if (!businessId || !firestore) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Load suppliers
      const suppliersQuery = query(
        collection(firestore, 'businesses', businessId, 'suppliers'),
        where('status', '==', 'active')
      );
      const suppliersSnapshot = await getDocs(suppliersQuery);
      const suppliersList: Supplier[] = [];
      
      suppliersSnapshot.forEach(doc => {
        const data = doc.data();
        suppliersList.push({
          id: doc.id,
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
      });
      
      setSuppliers(suppliersList);

      // Load supplier ledger
      const ledgerQuery = query(
        collection(firestore, 'businesses', businessId, 'supplierLedger'),
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

      // Load stock receipts
      const receiptsQuery = query(
        collection(firestore, 'businesses', businessId, 'stockReceipts'),
        orderBy('createdAt', 'desc')
      );
      const receiptsSnapshot = await getDocs(receiptsQuery);
      const receiptsList: any[] = [];
      
      receiptsSnapshot.forEach(doc => {
        const data = doc.data();
        receiptsList.push({
          id: doc.id,
          supplierId: data.supplierId,
          supplierName: data.supplierName,
          receiptNumber: data.receiptNumber,
          totalQuantity: data.totalQuantity,
          totalCost: data.totalCost,
          items: data.items || [],
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });
      
      setStockReceipts(receiptsList);

      // Load products
      const productsQuery = query(
        collection(firestore, 'businesses', businessId, 'products'),
        where('active', '==', true)
      );
      const productsSnapshot = await getDocs(productsQuery);
      const productsList: any[] = [];
      
      productsSnapshot.forEach(doc => {
        const data = doc.data();
        productsList.push({
          id: doc.id,
          name: data.name,
          category: data.category,
          cost: data.cost || 0,
          suppliers: data.suppliers || [],
        });
      });
      
      setProducts(productsList);

      // Calculate purchase intelligence
      const calculatedIntelligence = calculatePurchaseIntelligence(
        suppliersList,
        ledgerList,
        receiptsList,
        productsList,
        parseInt(selectedPeriod)
      );
      setIntelligence(calculatedIntelligence);
    } catch (error) {
      console.error('Error loading purchase intelligence data:', error);
      showToast('Failed to load purchase intelligence data');
    } finally {
      setLoading(false);
    }
  };

  const calculatePurchaseIntelligence = (
    suppliers: Supplier[],
    ledger: SupplierLedgerTransaction[],
    receipts: any[],
    productList: any[],
    periodDays: number
  ): PurchaseIntelligence => {
    const now = new Date();
    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Filter data by period
    const periodReceipts = receipts.filter(r => r.createdAt >= periodStart);
    const periodLedger = ledger.filter(l => l.date >= periodStart);

    // Total spend by supplier
    const totalSpendBySupplier = suppliers.map(supplier => {
      const supplierReceipts = periodReceipts.filter(r => r.supplierId === supplier.id);
      const totalSpend = supplierReceipts.reduce((sum, r) => sum + r.totalCost, 0);
      const purchaseCount = supplierReceipts.length;
      const totalPeriodSpend = periodReceipts.reduce((sum, r) => sum + r.totalCost, 0);
      
      return {
        supplierId: supplier.id,
        supplierName: supplier.businessName,
        totalSpend,
        purchaseCount,
        percentageOfTotal: totalPeriodSpend > 0 ? (totalSpend / totalPeriodSpend) * 100 : 0,
      };
    }).sort((a, b) => b.totalSpend - a.totalSpend);

    // Purchase trends by month
    const purchaseTrends: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthReceipts = receipts.filter(r => r.createdAt >= monthStart && r.createdAt <= monthEnd);
      const totalPurchases = monthReceipts.reduce((sum, r) => sum + r.totalCost, 0);
      const supplierCount = new Set(monthReceipts.map(r => r.supplierId)).size;
      const averageOrderValue = monthReceipts.length > 0 ? totalPurchases / monthReceipts.length : 0;
      
      purchaseTrends.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        totalPurchases,
        supplierCount,
        averageOrderValue,
      });
    }

    // Supplier price changes (compare current cost with previous cost from receipts)
    const supplierPriceChanges: any[] = [];
    productList.forEach(product => {
      if (product.suppliers && product.suppliers.length > 0) {
        product.suppliers.forEach((supplierInfo: any) => {
          const supplierReceipts = receipts.filter(r => r.supplierId === supplierInfo.supplierId);
          if (supplierReceipts.length >= 2) {
            const sortedReceipts = supplierReceipts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
            const latestReceipt = sortedReceipts[sortedReceipts.length - 1];
            const previousReceipt = sortedReceipts[sortedReceipts.length - 2];
            
            const latestItem = latestReceipt.items?.find((item: any) => item.productId === product.id);
            const previousItem = previousReceipt.items?.find((item: any) => item.productId === product.id);
            
            if (latestItem && previousItem && latestItem.unitCost !== previousItem.unitCost) {
              const changePercent = ((latestItem.unitCost - previousItem.unitCost) / previousItem.unitCost) * 100;
              const supplier = suppliers.find(s => s.id === supplierInfo.supplierId);
              
              supplierPriceChanges.push({
                supplierId: supplierInfo.supplierId,
                supplierName: supplier?.businessName || 'Unknown',
                productName: product.name,
                oldPrice: previousItem.unitCost,
                newPrice: latestItem.unitCost,
                changePercent,
                date: latestReceipt.createdAt,
              });
            }
          }
        });
      }
    });

    // Supplier dependency analysis
    const supplierDependency = suppliers.map(supplier => {
      const supplierReceipts = periodReceipts.filter(r => r.supplierId === supplier.id);
      const supplierSpend = supplierReceipts.reduce((sum, r) => sum + r.totalCost, 0);
      const totalPeriodSpend = periodReceipts.reduce((sum, r) => sum + r.totalCost, 0);
      const percentageOfPurchases = totalPeriodSpend > 0 ? (supplierSpend / totalPeriodSpend) * 100 : 0;
      
      // Count unique products from this supplier
      const productIds = new Set<string>();
      supplierReceipts.forEach(receipt => {
        receipt.items?.forEach((item: any) => {
          productIds.add(item.productId);
        });
      });
      const productsCount = productIds.size;

      // Calculate dependency score based on spend percentage and product count
      const dependencyScore = Math.min(100, (percentageOfPurchases * 0.7) + (productsCount * 2));
      
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (dependencyScore > 60) riskLevel = 'high';
      else if (dependencyScore > 30) riskLevel = 'medium';

      return {
        supplierId: supplier.id,
        supplierName: supplier.businessName,
        dependencyScore,
        riskLevel,
        productsCount,
        percentageOfPurchases,
      };
    }).sort((a, b) => b.dependencyScore - a.dependencyScore);

    // Product sourcing analysis
    const productSourcing = productList.map(product => {
      const productReceipts = receipts.filter(r => 
        r.items?.some((item: any) => item.productId === product.id)
      );
      
      const supplierCounts: Record<string, number> = {};
      let totalCost = 0;
      
      productReceipts.forEach(receipt => {
        const item = receipt.items?.find((i: any) => i.productId === product.id);
        if (item) {
          supplierCounts[receipt.supplierId] = (supplierCounts[receipt.supplierId] || 0) + 1;
          totalCost += item.unitCost * item.quantity;
        }
      });

      const suppliersArray = Object.entries(supplierCounts)
        .map(([supplierId, count]) => ({ supplierId, countPercentage: (count / productReceipts.length) * 100 }))
        .sort((a, b) => b.countPercentage - a.countPercentage);

      const primarySupplier = suppliersArray[0]?.supplierId || '';
      const alternativeSuppliers = suppliersArray.slice(1).map(s => s.supplierId);

      const primarySupplierData = suppliers.find(s => s.id === primarySupplier);
      
      // Calculate average cost
      const averageCost = productReceipts.length > 0 ? totalCost / productReceipts.reduce((sum, r) => {
        const item = r.items?.find((i: any) => i.productId === product.id);
        return sum + (item?.quantity || 0);
      }, 0) : 0;

      // Determine cost trend (simplified)
      let costTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (productReceipts.length >= 3) {
        const sortedReceipts = productReceipts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        const recentCosts = sortedReceipts.slice(-3).map(r => {
          const item = r.items?.find((i: any) => i.productId === product.id);
          return item?.unitCost || 0;
        });
        if (recentCosts[2] > recentCosts[0] * 1.05) costTrend = 'increasing';
        else if (recentCosts[2] < recentCosts[0] * 0.95) costTrend = 'decreasing';
      }

      return {
        productId: product.id,
        productName: product.name,
        primarySupplier: primarySupplierData?.businessName || 'Unknown',
        alternativeSuppliers,
        lastPurchaseDate: productReceipts.length > 0 ? productReceipts[0].createdAt : new Date(),
        averageCost,
        costTrend,
      };
    });

    return {
      totalSpendBySupplier,
      purchaseTrends,
      supplierPriceChanges,
      supplierDependency,
      productSourcing,
    };
  };

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>Purchase Intelligence</h2>
          <p className={styles.pageDesc}>Loading...</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  if (!intelligence) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>Purchase Intelligence</h2>
          <p className={styles.pageDesc}>No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Purchase Intelligence</h2>
          <p className={styles.pageDesc}>Analyze your purchasing patterns and supplier relationships</p>
        </div>
        <div className={styles.periodSelector}>
          <select
            className={styles.select}
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
          >
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="180">Last 180 Days</option>
            <option value="365">Last Year</option>
          </select>
        </div>
      </div>

      {/* Supplier Spend Analysis */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Total Spend by Supplier</h3>
        <Card>
          <div className={styles.supplierSpendList}>
            {intelligence.totalSpendBySupplier.length === 0 ? (
              <div className={styles.emptyState}>No purchase data available</div>
            ) : (
              intelligence.totalSpendBySupplier.map((item, index) => (
                <div key={item.supplierId} className={styles.supplierSpendItem}>
                  <div className={styles.spendRank}>{index + 1}</div>
                  <div className={styles.spendInfo}>
                    <div className={styles.spendName}>{item.supplierName}</div>
                    <div className={styles.spendMeta}>{item.purchaseCount} purchases</div>
                  </div>
                  <div className={styles.spendAmount}>{formatMoney(item.totalSpend)}</div>
                  <div className={styles.spendPercentage}>{item.percentageOfTotal.toFixed(1)}%</div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Purchase Trends */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Purchase Trends</h3>
        <Card>
          <div className={styles.trendsGrid}>
            {intelligence.purchaseTrends.map(trend => (
              <div key={trend.month} className={styles.trendCard}>
                <div className={styles.trendMonth}>{trend.month}</div>
                <div className={styles.trendValue}>{formatMoney(trend.totalPurchases)}</div>
                <div className={styles.trendMeta}>
                  <span>{trend.supplierCount} suppliers</span>
                  <span>Avg: {formatMoney(trend.averageOrderValue)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Supplier Dependency */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Supplier Dependency Analysis</h3>
        <Card>
          <div className={styles.dependencyList}>
            {intelligence.supplierDependency.map(item => (
              <div key={item.supplierId} className={styles.dependencyItem}>
                <div className={styles.dependencyInfo}>
                  <div className={styles.dependencyName}>{item.supplierName}</div>
                  <div className={styles.dependencyMeta}>
                    {item.productsCount} products • {item.percentageOfPurchases.toFixed(1)}% of purchases
                  </div>
                </div>
                <div className={styles.dependencyScore}>
                  <div className={styles.scoreBar}>
                    <div 
                      className={styles.scoreFill} 
                      style={{ 
                        width: `${item.dependencyScore}%`,
                        backgroundColor: item.riskLevel === 'high' ? 'var(--red)' : item.riskLevel === 'medium' ? 'var(--amber)' : 'var(--green)'
                      }}
                    />
                  </div>
                  <div className={`${styles.scoreLabel} ${styles[item.riskLevel]}`}>
                    {item.riskLevel.toUpperCase()} ({item.dependencyScore.toFixed(0)}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Price Changes */}
      {intelligence.supplierPriceChanges.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Price Changes</h3>
          <Card>
            <div className={styles.priceChangeList}>
              {intelligence.supplierPriceChanges.map(change => (
                <div key={`${change.supplierId}-${change.productName}`} className={styles.priceChangeItem}>
                  <div className={styles.priceChangeInfo}>
                    <div className={styles.priceChangeProduct}>{change.productName}</div>
                    <div className={styles.priceChangeSupplier}>{change.supplierName}</div>
                    <div className={styles.priceChangeDate}>{change.date.toLocaleDateString()}</div>
                  </div>
                  <div className={styles.priceChangeValues}>
                    <div className={styles.priceOld}>{formatMoney(change.oldPrice)}</div>
                    <div className={styles.priceArrow}>→</div>
                    <div className={styles.priceNew}>{formatMoney(change.newPrice)}</div>
                    <div className={`${styles.priceChangePercent} ${change.changePercent > 0 ? styles.increase : styles.decrease}`}>
                      {change.changePercent > 0 ? '+' : ''}{change.changePercent.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Product Sourcing */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Product Sourcing</h3>
        <Card>
          <div className={styles.productSourcingList}>
            {intelligence.productSourcing.slice(0, 20).map(product => (
              <div key={product.productId} className={styles.productSourcingItem}>
                <div className={styles.sourcingInfo}>
                  <div className={styles.sourcingProduct}>{product.productName}</div>
                  <div className={styles.sourcingMeta}>
                    <span className={styles.sourcingPrimary}>Primary: {product.primarySupplier}</span>
                    <span className={styles.sourcingTrend}>
                      {product.costTrend === 'increasing' && '📈 Prices rising'}
                      {product.costTrend === 'decreasing' && '📉 Prices falling'}
                      {product.costTrend === 'stable' && '➡️ Stable prices'}
                    </span>
                  </div>
                </div>
                <div className={styles.sourcingCost}>
                  <div className={styles.sourcingAvg}>Avg: {formatMoney(product.averageCost)}</div>
                  <div className={styles.sourcingDate}>
                    Last: {product.lastPurchaseDate.toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}


'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { fetchDocs, fetchDoc, updateDoc, toDate } from '@/lib/supabase-client-data';
import styles from './OperationsDashboard.module.css';
import { DashboardTour } from './components/DashboardTour';

interface Product {
  id: string;
  name: string;
  stock: number;
  lowStockThreshold: number;
  costPrice: number;
  sellingPrice: number;
  unitsSold30d?: number;
  lastSaleDate?: any;
  imageUrl?: string;
}

interface Supplier {
  id: string;
  name: string;
  totalAmountSpent: number;
  supplyCount: number;
  lastSupplyDate: any;
}

interface Sale {
  id: string;
  total: number;
  createdAt: any;
}

export function OperationsDashboard() {
  const { showToast, user } = useApp();
  const { formatMoney, currency } = useCurrency();
  const { businessId } = useBranch();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTour, setShowTour] = useState(false);
  const [tourCompleted, setTourCompleted] = useState(false);

  useEffect(() => {
    loadData();
    checkTourStatus();
  }, [businessId]);

  const checkTourStatus = async () => {
    if (!user?.id) return;
    
    try {
      const userData = await fetchDoc('users', user.id);
      if (userData) {
        const hasCompletedTour = userData.dashboardTourCompleted === true;
        const isNewUser = !userData.hasUsedDashboard;
        
        setTourCompleted(hasCompletedTour);
        
        // Show tour for new users or those who haven't completed it
        if (isNewUser || !hasCompletedTour) {
          // Delay tour start to allow dashboard to render
          setTimeout(() => setShowTour(true), 1000);
        }
      }
    } catch (error) {
      console.error('Error checking tour status:', error);
    }
  };

  const handleTourComplete = async () => {
    setShowTour(false);
    setTourCompleted(true);
    
    if (user?.id) {
      try {
        await updateDoc('users', user.id, {
          dashboardTourCompleted: true,
          hasUsedDashboard: true,
        });
      } catch (error) {
        console.error('Error updating tour status:', error);
      }
    }
  };

  const handleTourSkip = async () => {
    setShowTour(false);
    
    if (user?.id) {
      try {
        await updateDoc('users', user.id, {
          hasUsedDashboard: true,
        });
      } catch (error) {
        console.error('Error updating tour status:', error);
      }
    }
  };

  const loadData = async () => {
    if (!businessId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Load products
      const productsData = await fetchDocs(`businesses/${businessId}/products`, {
        filters: [{ field: 'active', op: '=', value: true }],
      });
      
      const productsList: Product[] = productsData.map((data) => ({
        id: data.id,
        name: data.name || '',
        stock: data.stock || 0,
        lowStockThreshold: data.lowStockThreshold || 10,
        costPrice: data.costPrice || data.cost || 0,
        sellingPrice: data.sellingPrice || data.price || 0,
        unitsSold30d: data.unitsSold30d || 0,
        lastSaleDate: data.lastSaleDate,
        imageUrl: data.imageUrl || '',
      }));
      
      setProducts(productsList);
      
      // Load suppliers
      const suppliersData = await fetchDocs(`businesses/${businessId}/suppliers`, {
        filters: [{ field: 'active', op: '=', value: true }],
        orderBy: { field: 'totalAmountSpent', ascending: false },
      });
      
      const suppliersList: Supplier[] = suppliersData.map((data) => ({
        id: data.id,
        name: data.name || '',
        totalAmountSpent: data.totalAmountSpent || 0,
        supplyCount: data.supplyCount || 0,
        lastSupplyDate: data.lastSupplyDate,
      }));
      
      setSuppliers(suppliersList);
      
      // Load recent sales
      const salesData = await fetchDocs(`businesses/${businessId}/sales`, {
        orderBy: { field: 'createdAt', ascending: false },
        limit: 100,
      });
      
      const salesList: Sale[] = salesData.map((data) => ({
        id: data.id,
        total: data.total || 0,
        createdAt: data.createdAt,
      }));
      
      setSales(salesList);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('❌ Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate metrics
  const totalStockValue = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);
  const totalStockCount = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStockCount = products.filter(p => p.stock <= p.lowStockThreshold).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  
  const activeSuppliers = suppliers.length;
  const totalSpentOnSuppliers = suppliers.reduce((sum, s) => sum + s.totalAmountSpent, 0);
  
  // Sales calculations
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const dailySales = sales
    .filter(s => {
      const d = toDate(s.createdAt);
      return d && d >= todayStart;
    })
    .reduce((sum, s) => sum + s.total, 0);
    
  const monthlySales = sales
    .filter(s => {
      const d = toDate(s.createdAt);
      return d && d >= monthStart;
    })
    .reduce((sum, s) => sum + s.total, 0);
  
  // AI Insights
  const productsToRestock = products
    .filter(p => p.stock <= p.lowStockThreshold)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);
  
  const deadStock = products
    .filter(p => {
      const lastSale = toDate(p.lastSaleDate);
      if (!lastSale) return false;
      const daysSinceSale = (today.getTime() - lastSale.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceSale > 30 && p.stock > 0;
    })
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);
  
  const fastMovingProducts = products
    .filter(p => (p.unitsSold30d || 0) > 0)
    .sort((a, b) => (b.unitsSold30d || 0) - (a.unitsSold30d || 0))
    .slice(0, 5);
  
  const topSupplier = suppliers.length > 0 ? suppliers[0] : null;

  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>Operations Dashboard</h2>
          <p className={styles.pageDesc}>Loading...</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Operations Dashboard</h2>
          <p className={styles.pageDesc}>Overview of your inventory, suppliers, and operations</p>
        </div>
        {tourCompleted && (
          <button
            onClick={() => setShowTour(true)}
            className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-2"
          >
            🎯 Show Tour Again
          </button>
        )}
      </div>

      {/* Key Metrics */}
      <div className={styles.metricsGrid} data-tour="metrics-grid">
        <div className={styles.metricCard} data-tour="metric-stock">
          <div className={styles.metricIcon}>📦</div>
          <div className={styles.metricInfo}>
            <div className={styles.metricLabel}>Total Stock Value</div>
            <div className={styles.metricValue}>{formatMoney(totalStockValue)}</div>
            <div className={styles.metricSub}>{totalStockCount.toLocaleString()} units</div>
          </div>
        </div>
        
        <div className={styles.metricCard} data-tour="metric-low-stock">
          <div className={styles.metricIcon}>⚠️</div>
          <div className={styles.metricInfo}>
            <div className={styles.metricLabel}>Low Stock</div>
            <div className={styles.metricValue}>{lowStockCount}</div>
            <div className={styles.metricSub}>{outOfStockCount} out of stock</div>
          </div>
        </div>
        
        <div className={styles.metricCard} data-tour="metric-suppliers">
          <div className={styles.metricIcon}>🏭</div>
          <div className={styles.metricInfo}>
            <div className={styles.metricLabel}>Active Suppliers</div>
            <div className={styles.metricValue}>{activeSuppliers}</div>
            <div className={styles.metricSub}>{formatMoney(totalSpentOnSuppliers)} spent</div>
          </div>
        </div>
        
        <div className={styles.metricCard} data-tour="metric-sales">
          <div className={styles.metricIcon}>💰</div>
          <div className={styles.metricInfo}>
            <div className={styles.metricLabel}>Daily Sales</div>
            <div className={styles.metricValue}>{formatMoney(dailySales)}</div>
            <div className={styles.metricSub}>{formatMoney(monthlySales)} this month</div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className={styles.insightsSection} data-tour="ai-insights">
        <h3 className={styles.sectionTitle}>AI Insights</h3>
        
        <div className={styles.insightsGrid}>
          {/* Products to Restock */}
          <div className={styles.insightCard} data-tour="insight-restock">
            <div className={styles.insightHeader}>
              <div className={styles.insightIcon}>🔄</div>
              <h4 className={styles.insightTitle}>Products to Restock</h4>
            </div>
            {productsToRestock.length === 0 ? (
              <div className={styles.insightEmpty}>All stock levels healthy</div>
            ) : (
              <div className={styles.insightList}>
                {productsToRestock.map(product => (
                  <div key={product.id} className={styles.insightItem}>
                    <div className={styles.insightItemName}>{product.name}</div>
                    <div className={`${styles.insightItemValue} ${styles.lowStock}`}>
                      {product.stock} left
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dead Stock Alerts */}
          <div className={styles.insightCard} data-tour="insight-dead-stock">
            <div className={styles.insightHeader}>
              <div className={styles.insightIcon}>💀</div>
              <h4 className={styles.insightTitle}>Dead Stock Alerts</h4>
            </div>
            {deadStock.length === 0 ? (
              <div className={styles.insightEmpty}>No dead stock detected</div>
            ) : (
              <div className={styles.insightList}>
                {deadStock.map(product => (
                  <div key={product.id} className={styles.insightItem}>
                    <div className={styles.insightItemName}>{product.name}</div>
                    <div className={`${styles.insightItemValue} ${styles.deadStock}`}>
                      {product.stock} units
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fast-Moving Products */}
          <div className={styles.insightCard} data-tour="insight-fast-moving">
            <div className={styles.insightHeader}>
              <div className={styles.insightIcon}>🚀</div>
              <h4 className={styles.insightTitle}>Fast-Moving Products</h4>
            </div>
            {fastMovingProducts.length === 0 ? (
              <div className={styles.insightEmpty}>No sales data yet</div>
            ) : (
              <div className={styles.insightList}>
                {fastMovingProducts.map(product => (
                  <div key={product.id} className={styles.insightItem}>
                    <div className={styles.insightItemName}>{product.name}</div>
                    <div className={`${styles.insightItemValue} ${styles.fastMoving}`}>
                      {product.unitsSold30d} sold (30d)
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Supplier Recommendation */}
          <div className={styles.insightCard} data-tour="insight-supplier">
            <div className={styles.insightHeader}>
              <div className={styles.insightIcon}>🏆</div>
              <h4 className={styles.insightTitle}>Top Supplier</h4>
            </div>
            {!topSupplier ? (
              <div className={styles.insightEmpty}>No suppliers yet</div>
            ) : (
              <div className={styles.insightList}>
                <div className={styles.insightItem}>
                  <div className={styles.insightItemName}>{topSupplier.name}</div>
                  <div className={`${styles.insightItemValue} ${styles.topSupplier}`}>
                    {formatMoney(topSupplier.totalAmountSpent)}
                  </div>
                </div>
                <div className={styles.insightItem}>
                  <div className={styles.insightItemName}>Supplies</div>
                  <div className={styles.insightItemValue}>{topSupplier.supplyCount} times</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.actionsSection} data-tour="quick-actions">
        <h3 className={styles.sectionTitle}>Quick Actions</h3>
        <div className={styles.actionsGrid}>
          <button className={styles.actionButton} data-tour="action-receive">
            <span className={styles.actionIcon}>📥</span>
            <span className={styles.actionLabel}>Receive Stock</span>
          </button>
          <button className={styles.actionButton} data-tour="action-restock">
            <span className={styles.actionIcon}>🔄</span>
            <span className={styles.actionLabel}>Restock Items</span>
          </button>
          <button className={styles.actionButton} data-tour="action-move">
            <span className={styles.actionIcon}>📦</span>
            <span className={styles.actionLabel}>Move Stock</span>
          </button>
          <button className={styles.actionButton}>
            <span className={styles.actionIcon}>🏭</span>
            <span className={styles.actionLabel}>View Warehouse</span>
          </button>
          <button className={styles.actionButton}>
            <span className={styles.actionIcon}>🏢</span>
            <span className={styles.actionLabel}>View Suppliers</span>
          </button>
          <button className={styles.actionButton}>
            <span className={styles.actionIcon}>📊</span>
            <span className={styles.actionLabel}>View Inventory</span>
          </button>
        </div>
      </div>

      {/* Dashboard Tour */}
      {showTour && (
        <DashboardTour
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
        />
      )}
    </div>
  );
}


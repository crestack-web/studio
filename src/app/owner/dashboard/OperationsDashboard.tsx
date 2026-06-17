'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import styles from './OperationsDashboard.module.css';

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
  const { showToast } = useApp();
  const { formatMoney, currency } = useCurrency();
  const { businessId } = useBranch();
  const { firestore } = initializeFirebase();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [businessId, firestore]);

  const loadData = async () => {
    if (!businessId || !firestore) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Load products
      const productsQuery = query(
        collection(firestore, 'businesses', businessId, 'products'),
        where('active', '==', true)
      );
      
      const productsSnapshot = await getDocs(productsQuery);
      const productsList: Product[] = [];
      
      productsSnapshot.forEach(doc => {
        const data = doc.data();
        productsList.push({
          id: doc.id,
          name: data.name || '',
          stock: data.stock || 0,
          lowStockThreshold: data.lowStockThreshold || 10,
          costPrice: data.cost || 0,
          sellingPrice: data.price || 0,
          unitsSold30d: data.unitsSold30d || 0,
          lastSaleDate: data.lastSaleDate,
          imageUrl: data.imageUrl || '',
        });
      });
      
      setProducts(productsList);
      
      // Load suppliers
      const suppliersQuery = query(
        collection(firestore, 'businesses', businessId, 'suppliers'),
        where('active', '==', true),
        orderBy('totalAmountSpent', 'desc')
      );
      
      const suppliersSnapshot = await getDocs(suppliersQuery);
      const suppliersList: Supplier[] = [];
      
      suppliersSnapshot.forEach(doc => {
        const data = doc.data();
        suppliersList.push({
          id: doc.id,
          name: data.name || '',
          totalAmountSpent: data.totalAmountSpent || 0,
          supplyCount: data.supplyCount || 0,
          lastSupplyDate: data.lastSupplyDate,
        });
      });
      
      setSuppliers(suppliersList);
      
      // Load recent sales
      const salesQuery = query(
        collection(firestore, 'businesses', businessId, 'sales'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      
      const salesSnapshot = await getDocs(salesQuery);
      const salesList: Sale[] = [];
      
      salesSnapshot.forEach(doc => {
        const data = doc.data();
        salesList.push({
          id: doc.id,
          total: data.total || 0,
          createdAt: data.createdAt,
        });
      });
      
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
    .filter(s => s.createdAt?.toDate?.() >= todayStart)
    .reduce((sum, s) => sum + s.total, 0);
    
  const monthlySales = sales
    .filter(s => s.createdAt?.toDate?.() >= monthStart)
    .reduce((sum, s) => sum + s.total, 0);
  
  // AI Insights
  const productsToRestock = products
    .filter(p => p.stock <= p.lowStockThreshold)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);
  
  const deadStock = products
    .filter(p => {
      const lastSale = p.lastSaleDate?.toDate?.();
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
      </div>

      {/* Key Metrics */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>📦</div>
          <div className={styles.metricInfo}>
            <div className={styles.metricLabel}>Total Stock Value</div>
            <div className={styles.metricValue}>{formatMoney(totalStockValue)}</div>
            <div className={styles.metricSub}>{totalStockCount.toLocaleString()} units</div>
          </div>
        </div>
        
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>⚠️</div>
          <div className={styles.metricInfo}>
            <div className={styles.metricLabel}>Low Stock</div>
            <div className={styles.metricValue}>{lowStockCount}</div>
            <div className={styles.metricSub}>{outOfStockCount} out of stock</div>
          </div>
        </div>
        
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>🏭</div>
          <div className={styles.metricInfo}>
            <div className={styles.metricLabel}>Active Suppliers</div>
            <div className={styles.metricValue}>{activeSuppliers}</div>
            <div className={styles.metricSub}>{formatMoney(totalSpentOnSuppliers)} spent</div>
          </div>
        </div>
        
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>💰</div>
          <div className={styles.metricInfo}>
            <div className={styles.metricLabel}>Daily Sales</div>
            <div className={styles.metricValue}>{formatMoney(dailySales)}</div>
            <div className={styles.metricSub}>{formatMoney(monthlySales)} this month</div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className={styles.insightsSection}>
        <h3 className={styles.sectionTitle}>AI Insights</h3>
        
        <div className={styles.insightsGrid}>
          {/* Products to Restock */}
          <div className={styles.insightCard}>
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
          <div className={styles.insightCard}>
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
          <div className={styles.insightCard}>
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
          <div className={styles.insightCard}>
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
      <div className={styles.actionsSection}>
        <h3 className={styles.sectionTitle}>Quick Actions</h3>
        <div className={styles.actionsGrid}>
          <button className={styles.actionButton}>
            <span className={styles.actionIcon}>📥</span>
            <span className={styles.actionLabel}>Receive Stock</span>
          </button>
          <button className={styles.actionButton}>
            <span className={styles.actionIcon}>🔄</span>
            <span className={styles.actionLabel}>Restock Items</span>
          </button>
          <button className={styles.actionButton}>
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
    </div>
  );
}

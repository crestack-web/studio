'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { fetchDocs, updateDoc, toDate } from '@/lib/supabase-client-data';
import { checkFeatureAccess } from '@/lib/featureRestrictions';
import { AlertTriangle, Calendar, Search, Filter, Trash2, Package, DollarSign, TrendingDown, MessageSquare } from 'lucide-react';
import styles from './ExpiryAlertsPage.module.css';

interface ExpiringProduct {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalValue: number;
  expiryDate: Date;
  daysUntilExpiry: number;
  location: string;
  supplier?: string;
}

export default function ExpiryAlertsPage() {
  const { user, showToast, navigateTo } = useApp();
  const { formatMoney } = useCurrency();
  const [expiringProducts, setExpiringProducts] = useState<ExpiringProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDays, setFilterDays] = useState<number>(30);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [isAskingMO, setIsAskingMO] = useState(false);

  // Check feature access
  useEffect(() => {
    const checkAccess = async () => {
      if (user?.id) {
        const hasAccess = await checkFeatureAccess(user.id, 'expiry-alerts');
        if (!hasAccess.eligible) {
          showToast('This feature requires a Standard plan or higher');
        }
      }
    };
    checkAccess();
  }, [user]);

  // Load expiring products
  useEffect(() => {
    loadExpiringProducts();
  }, [user?.businessId, filterDays]);

  const loadExpiringProducts = async () => {
    try {
      if (!user?.businessId) return;
      
      const rows = await fetchDocs(`businesses/${user.businessId}/products`);
      
      const now = new Date();
      const filterDate = new Date();
      filterDate.setDate(filterDate.getDate() + filterDays);
      
      const products = rows
        .map(row => {
          const data = row as Record<string, unknown>;
          const expiryDate = toDate(data.expiryDate);
          const daysUntilExpiry = expiryDate 
            ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : null;
          
          return {
            id: String(data.id),
            name: String(data.name || 'Unknown'),
            category: String(data.category || 'uncategorized'),
            quantity: Number(data.stock || 0),
            unit: String(data.unit || 'pieces'),
            unitCost: Number(data.cost || 0),
            totalValue: Number(data.stock || 0) * Number(data.cost || 0),
            expiryDate,
            daysUntilExpiry: daysUntilExpiry || 0,
            location: String(data.location || 'main-store'),
            supplier: data.supplier as string | undefined,
            productType: data.productType as string | undefined,
          };
        })
        .filter(product => {
          const expiryDate = product.expiryDate;
          if (!expiryDate) return false;
          // Skip pure menu dishes — expiry is about stock
          if ((product as any).productType === 'dish') return false;
          // Include already expired and those within the window
          return expiryDate <= filterDate;
        }) as ExpiringProduct[];
      
      // Sort by days until expiry (ascending)
      products.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
      
      setExpiringProducts(products);
    } catch (error) {
      console.error('Failed to load expiring products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsSold = async (productId: string) => {
    if (!confirm('Mark this product as sold to clear it from expiry alerts?')) return;
    
    try {
      if (!user?.businessId) return;
      
      await updateDoc(`businesses/${user.businessId}/products`, productId, {
        expiryDate: null,
        expiryAlertCleared: true,
        expiryAlertClearedAt: new Date().toISOString(),
      });
      
      showToast('Product marked as sold');
      loadExpiringProducts();
    } catch (error) {
      console.error('Failed to mark product as sold:', error);
      showToast('Failed to mark product as sold');
    }
  };

  const handleDispose = async (productId: string) => {
    const reason = prompt('Enter reason for disposal:');
    if (!reason) return;
    
    try {
      if (!user?.businessId) return;
      
      await updateDoc(`businesses/${user.businessId}/products`, productId, {
        stock: 0,
        expiryDate: null,
        disposed: true,
        disposalReason: reason,
        disposedAt: new Date().toISOString(),
      });
      
      showToast('Product disposed successfully');
      loadExpiringProducts();
    } catch (error) {
      console.error('Failed to dispose product:', error);
      showToast('Failed to dispose product');
    }
  };

  const filteredProducts = expiringProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesLocation = selectedLocation === 'all' || product.location === selectedLocation;
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const getExpiryStatus = (daysUntilExpiry: number) => {
    if (daysUntilExpiry <= 0) return { label: 'Expired', color: 'red' };
    if (daysUntilExpiry <= 3) return { label: 'Critical', color: 'red' };
    if (daysUntilExpiry <= 7) return { label: 'Urgent', color: 'orange' };
    if (daysUntilExpiry <= 14) return { label: 'Warning', color: 'yellow' };
    return { label: 'Upcoming', color: 'blue' };
  };

  const calculateTotalValueAtRisk = () => {
    return expiringProducts.reduce((total, product) => total + product.totalValue, 0);
  };

  const getCriticalCount = () => {
    return expiringProducts.filter(p => p.daysUntilExpiry <= 3).length;
  };

  const getExpiredCount = () => {
    return expiringProducts.filter(p => p.daysUntilExpiry <= 0).length;
  };

  const handleAskMO = async () => {
    if (expiringProducts.length === 0) {
      showToast('No expiring products to analyze');
      return;
    }

    setIsAskingMO(true);
    
    // Build a detailed question for MO about the expiring products
    const criticalProducts = expiringProducts.filter(p => p.daysUntilExpiry <= 3);
    const expiredProducts = expiringProducts.filter(p => p.daysUntilExpiry <= 0);
    const totalValue = calculateTotalValueAtRisk();
    
    let question = `I have ${expiringProducts.length} products expiring soon. `;
    
    if (expiredProducts.length > 0) {
      question += `${expiredProducts.length} have already expired. `;
    }
    
    if (criticalProducts.length > 0) {
      question += `${criticalProducts.length} will expire within 3 days. `;
    }
    
    question += `The total value at risk is ${formatMoney(totalValue)}. `;
    question += `What should I do to minimize losses? Should I offer discounts, bundle them, or take other actions?`;
    
    // Navigate to Ask MO with the pre-filled question
    // Store the question in localStorage for Ask MO to pick up
    localStorage.setItem('mo-prefilled-question', question);
    navigateTo('mo');
    
    setIsAskingMO(false);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <div className="text-center">
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Loading expiry alerts...</p>
        </div>
      </div>
    );
  }

  const criticalCount = getCriticalCount();
  const expiredCount = getExpiredCount();

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Expiry Alerts</h1>
          <p className={styles.pageDesc}>Track products approaching expiry dates</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <Package className={styles.summaryIcon} />
          <div>
            <p className={styles.summaryLabel}>Expiring Soon</p>
            <p className={styles.summaryValue}>{expiringProducts.length}</p>
          </div>
        </div>
        
        <div className={styles.summaryCard}>
          <AlertTriangle className={styles.summaryIcon} style={{ color: criticalCount > 0 ? 'var(--red)' : 'var(--text-3)' }} />
          <div>
            <p className={styles.summaryLabel}>Critical (≤3 days)</p>
            <p className={styles.summaryValue}>{criticalCount}</p>
          </div>
        </div>
        
        <div className={styles.summaryCard}>
          <TrendingDown className={styles.summaryIcon} style={{ color: expiredCount > 0 ? 'var(--red)' : 'var(--text-3)' }} />
          <div>
            <p className={styles.summaryLabel}>Already Expired</p>
            <p className={styles.summaryValue}>{expiredCount}</p>
          </div>
        </div>
        
        <div className={styles.summaryCard}>
          <DollarSign className={styles.summaryIcon} style={{ color: 'var(--green)' }} />
          <div>
            <p className={styles.summaryLabel}>Value at Risk</p>
            <p className={styles.summaryValue}>{formatMoney(calculateTotalValueAtRisk())}</p>
          </div>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {(criticalCount > 0 || expiredCount > 0) && (
        <div className={styles.alertBanner}>
          <div className={styles.alertBannerContent}>
            <AlertTriangle className={styles.alertBannerIcon} />
            <div className="flex-1">
              <h3 className={styles.alertBannerTitle}>Immediate Action Required</h3>
              <p className={styles.alertBannerText}>
                {expiredCount > 0 && `${expiredCount} products have expired. `}
                {criticalCount > 0 && `${criticalCount} products will expire within 3 days. `}
                Consider discounting or disposing these items immediately.
              </p>
            </div>
          </div>
          <button
            onClick={handleAskMO}
            disabled={isAskingMO}
            className={styles.askMOButton}
          >
            <MessageSquare className="w-4 h-4" />
            {isAskingMO ? 'Loading...' : 'Ask MO for Recommendations'}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className={styles.searchIcon} />
          <select
            value={filterDays}
            onChange={(e) => setFilterDays(parseInt(e.target.value))}
            className={styles.filterSelect}
          >
            <option value={7}>Next 7 days</option>
            <option value={14}>Next 14 days</option>
            <option value={30}>Next 30 days</option>
            <option value={60}>Next 60 days</option>
            <option value={90}>Next 90 days</option>
          </select>
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Categories</option>
          <option value="food">Food</option>
          <option value="beverages">Beverages</option>
          <option value="dairy">Dairy</option>
          <option value="pharmaceutical">Pharmaceutical</option>
          <option value="cosmetics">Cosmetics</option>
          <option value="other">Other</option>
        </select>
        
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Locations</option>
          <option value="main-store">Main Store</option>
          <option value="back-store">Back Store</option>
          <option value="warehouse">Warehouse</option>
        </select>
      </div>

      {/* Products Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th className={styles.tableHeader}>Product</th>
              <th className={styles.tableHeader}>Category</th>
              <th className={styles.tableHeader}>Quantity</th>
              <th className={styles.tableHeader}>Value</th>
              <th className={styles.tableHeader}>Expiry Date</th>
              <th className={styles.tableHeader}>Days Left</th>
              <th className={styles.tableHeader}>Location</th>
              <th className={styles.tableHeader}>Status</th>
              <th className={styles.tableHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => {
              const status = getExpiryStatus(product.daysUntilExpiry);
              
              return (
                <tr key={product.id} className={`${styles.tableRow} ${
                  product.daysUntilExpiry <= 0 ? styles.expired :
                  product.daysUntilExpiry <= 3 ? styles.critical :
                  product.daysUntilExpiry <= 7 ? styles.warning : ''
                }`}>
                  <td className={styles.tableCell}>
                    <div className={styles.productName}>{product.name}</div>
                    {product.supplier && (
                      <div className={styles.productSupplier}>{product.supplier}</div>
                    )}
                  </td>
                  <td className={styles.tableCell} style={{ textTransform: 'capitalize' }}>{product.category}</td>
                  <td className={styles.tableCell}>
                    <div className="font-medium">{product.quantity} {product.unit}</div>
                  </td>
                  <td className={styles.tableCell}>{formatMoney(product.totalValue)}</td>
                  <td className={styles.tableCell}>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
                      {product.expiryDate.toLocaleDateString()}
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <span className={`${styles.daysLeft} ${
                      product.daysUntilExpiry <= 0 ? styles.expired :
                      product.daysUntilExpiry <= 3 ? styles.critical :
                      product.daysUntilExpiry <= 7 ? styles.urgent : ''
                    }`}>
                      {product.daysUntilExpiry <= 0 ? 'Expired' : `${product.daysUntilExpiry} days`}
                    </span>
                  </td>
                  <td className={styles.tableCell} style={{ textTransform: 'capitalize' }}>{product.location.replace('-', ' ')}</td>
                  <td className={styles.tableCell}>
                    <span className={`${styles.statusBadge} ${styles[status.color]}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.actionButtons}>
                      <button
                        onClick={() => handleMarkAsSold(product.id)}
                        className={`${styles.actionButton} ${styles.sold}`}
                        title="Mark as sold"
                      >
                        Sold
                      </button>
                      <button
                        onClick={() => handleDispose(product.id)}
                        className={`${styles.actionButton} ${styles.dispose}`}
                        title="Dispose"
                      >
                        Dispose
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredProducts.length === 0 && (
          <div className={styles.emptyState}>
            <Package className={styles.emptyStateIcon} />
            <p>No expiring products found</p>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>Products will appear here when they approach their expiry dates</p>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {expiringProducts.length > 0 && (
        <div className={styles.recommendations}>
          <h3 className={styles.recommendationsTitle}>Recommendations</h3>
          <ul className={styles.recommendationsList}>
            <li className={styles.recommendationsItem}>• Consider offering discounts on products expiring within 7 days</li>
            <li className={styles.recommendationsItem}>• Bundle expiring products with popular items to increase sales</li>
            <li className={styles.recommendationsItem}>• Review ordering patterns to reduce future expiry waste</li>
            <li className={styles.recommendationsItem}>• Set up automatic reorder points for fast-moving items</li>
          </ul>
        </div>
      )}
    </div>
  );
}


'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { checkFeatureAccess, getBusinessType } from '@/lib/featureRestrictions';
import styles from './WarehousePage.module.css';

interface Product {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  stock: number;
  stockByLocation?: {
    main_store: number;
    back_store: number;
    warehouse: number;
    [key: string]: number;
  };
  costPrice: number;
  sellingPrice: number;
  imageUrl?: string;
  lowStockThreshold: number;
}

interface LocationSummary {
  name: string;
  type: string;
  stockCount: number;
  stockValue: number;
  productCount: number;
}

export function WarehousePage() {
  const { showToast, user } = useApp();
  const { formatMoney, currency } = useCurrency();
  const { businessId, branches } = useBranch();
  const { firestore } = initializeFirebase();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasAccess, setHasAccess] = useState(true);
  const [accessReason, setAccessReason] = useState('');

  useEffect(() => {
    checkWarehouseAccess();
  }, [user]);

  const checkWarehouseAccess = async () => {
    if (!user?.id) return;
    
    // Warehouse management is available for retailers and wholesalers regardless of plan
    const businessType = await getBusinessType(user.id);
    const isRetailOrWholesale = businessType.toLowerCase().includes('retail') || 
                                 businessType.toLowerCase().includes('wholesale') ||
                                 businessType.toLowerCase().includes('distributor');
    
    if (isRetailOrWholesale) {
      setHasAccess(true);
      return;
    }
    
    // For other business types, check feature access
    const accessResult = await checkFeatureAccess(user.id, 'warehouseManagement');
    if (!accessResult.eligible) {
      setHasAccess(false);
      setAccessReason(accessResult.reason || 'This feature is not available for your plan');
    }
  };

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Feature Not Available</h3>
          <p className="text-gray-600">{accessReason}</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadProducts();
  }, [businessId, firestore]);

  const loadProducts = async () => {
    if (!businessId || !firestore) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const productsQuery = query(
        collection(firestore, 'businesses', businessId, 'products'),
        where('active', '==', true)
      );
      
      const productsSnapshot = await getDocs(productsQuery);
      const productsList: Product[] = [];
      
      productsSnapshot.forEach(doc => {
        const data = doc.data();
        const stockByLocation = data.stockByLocation || {
          main_store: data.stock || 0,
          back_store: 0,
          warehouse: 0,
        };
        
        productsList.push({
          id: doc.id,
          name: data.name || '',
          sku: data.attributes?.sku || '',
          category: data.category || '',
          stock: data.stock || 0,
          stockByLocation,
          costPrice: data.cost || 0,
          sellingPrice: data.price || 0,
          imageUrl: data.imageUrl || '',
          lowStockThreshold: data.lowStockThreshold || 10,
        });
      });
      
      setProducts(productsList);
    } catch (error) {
      console.error('Error loading products:', error);
      showToast('❌ Failed to load warehouse data');
    } finally {
      setIsLoading(false);
    }
  };

  const getLocationSummary = (): LocationSummary[] => {
    const locations: LocationSummary[] = [];

    // Only add branches (user-created locations)
    branches.forEach(branch => {
      const branchStockCount = products.reduce((sum, p) => sum + (p.stockByLocation?.[branch.id] || 0), 0);
      const branchStockValue = products.reduce((sum, p) => sum + ((p.stockByLocation?.[branch.id] || 0) * p.costPrice), 0);
      const branchProductCount = products.filter(p => (p.stockByLocation?.[branch.id] || 0) > 0).length;
      
      if (branchStockCount > 0) {
        locations.push({
          name: branch.name,
          type: branch.id,
          stockCount: branchStockCount,
          stockValue: branchStockValue,
          productCount: branchProductCount,
        });
      }
    });

    // Add any custom locations from stockByLocation that aren't branches
    const customLocationIds = new Set<string>();
    products.forEach(p => {
      if (p.stockByLocation) {
        Object.keys(p.stockByLocation).forEach(locId => {
          if (!['main_store', 'back_store', 'warehouse'].includes(locId) && 
              !branches.find(b => b.id === locId)) {
            customLocationIds.add(locId);
          }
        });
      }
    });

    customLocationIds.forEach(locId => {
      const locStockCount = products.reduce((sum, p) => sum + (p.stockByLocation?.[locId] || 0), 0);
      const locStockValue = products.reduce((sum, p) => sum + ((p.stockByLocation?.[locId] || 0) * p.costPrice), 0);
      const locProductCount = products.filter(p => (p.stockByLocation?.[locId] || 0) > 0).length;
      
      if (locStockCount > 0) {
        locations.push({
          name: locId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          type: locId,
          stockCount: locStockCount,
          stockValue: locStockValue,
          productCount: locProductCount,
        });
      }
    });

    return locations;
  };

  const getFilteredProducts = () => {
    let filtered = products;
    
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(p => (p.stockByLocation?.[selectedLocation] || 0) > 0);
    }
    
    return filtered;
  };

  const getStockForLocation = (product: Product, location: string) => {
    if (location === 'all') return product.stock;
    return product.stockByLocation?.[location] || 0;
  };

  const getTotalStockValue = () => {
    return products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);
  };

  const getTotalStockCount = () => {
    return products.reduce((sum, p) => sum + p.stock, 0);
  };

  const locationSummary = getLocationSummary();
  const filteredProducts = getFilteredProducts();

  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>Warehouse</h2>
          <p className={styles.pageDesc}>Loading warehouse data...</p>
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
          <h2 className={styles.pageTitle}>Warehouse</h2>
          <p className={styles.pageDesc}>View stock across all locations</p>
        </div>
        <div className={styles.totalStats}>
          <div className={styles.totalStat}>
            <span className={styles.totalStatLabel}>Total Stock</span>
            <span className={styles.totalStatValue}>{getTotalStockCount().toLocaleString()} units</span>
          </div>
          <div className={styles.totalStat}>
            <span className={styles.totalStatLabel}>Total Value</span>
            <span className={styles.totalStatValue}>{formatMoney(getTotalStockValue())}</span>
          </div>
        </div>
      </div>

      {/* Location Summary Cards */}
      <div className={styles.locationsGrid}>
        {locationSummary.map(location => (
          <div
            key={location.type}
            className={`${styles.locationCard} ${selectedLocation === location.type ? styles.active : ''}`}
            onClick={() => setSelectedLocation(selectedLocation === location.type ? 'all' : location.type)}
          >
            <div className={styles.locationHeader}>
              <div className={styles.locationIcon}>
                {location.type === 'main_store' && '🏪'}
                {location.type === 'back_store' && '📦'}
                {location.type === 'warehouse' && '🏭'}
                {!['main_store', 'back_store', 'warehouse'].includes(location.type) && '🏢'}
              </div>
              <h3 className={styles.locationName}>{location.name}</h3>
            </div>
            <div className={styles.locationStats}>
              <div className={styles.locationStat}>
                <span className={styles.locationStatLabel}>Stock</span>
                <span className={styles.locationStatValue}>{location.stockCount.toLocaleString()}</span>
              </div>
              <div className={styles.locationStat}>
                <span className={styles.locationStatLabel}>Value</span>
                <span className={styles.locationStatValue}>{formatMoney(location.stockValue)}</span>
              </div>
              <div className={styles.locationStat}>
                <span className={styles.locationStatLabel}>Products</span>
                <span className={styles.locationStatValue}>{location.productCount}</span>
              </div>
            </div>
          </div>
        ))}
        
        {/* All Locations Card */}
        <div
          className={`${styles.locationCard} ${selectedLocation === 'all' ? styles.active : ''}`}
          onClick={() => setSelectedLocation('all')}
        >
          <div className={styles.locationHeader}>
            <div className={styles.locationIcon}>📊</div>
            <h3 className={styles.locationName}>All Locations</h3>
          </div>
          <div className={styles.locationStats}>
            <div className={styles.locationStat}>
              <span className={styles.locationStatLabel}>Stock</span>
              <span className={styles.locationStatValue}>{getTotalStockCount().toLocaleString()}</span>
            </div>
            <div className={styles.locationStat}>
              <span className={styles.locationStatLabel}>Value</span>
              <span className={styles.locationStatValue}>{formatMoney(getTotalStockValue())}</span>
            </div>
            <div className={styles.locationStat}>
              <span className={styles.locationStatLabel}>Products</span>
              <span className={styles.locationStatValue}>{products.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className={styles.productsSection}>
        <div className={styles.productsHeader}>
          <h3 className={styles.productsTitle}>
            {selectedLocation === 'all' ? 'All Products' : locationSummary.find(l => l.type === selectedLocation)?.name || 'Products'}
          </h3>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredProducts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📦</div>
            <h3>No Products Found</h3>
            <p>Try adjusting your search or location filter</p>
          </div>
        ) : (
          <div className={styles.productsTable}>
            <div className={styles.tableHeader}>
              <div className={styles.tableCell}>Product</div>
              <div className={styles.tableCell}>Main Store</div>
              <div className={styles.tableCell}>Back Store</div>
              <div className={styles.tableCell}>Warehouse</div>
              <div className={styles.tableCell}>Total</div>
              <div className={styles.tableCell}>Value</div>
            </div>
            
            {filteredProducts.map(product => (
              <div key={product.id} className={styles.tableRow}>
                <div className={styles.tableCell}>
                  <div className={styles.productCell}>
                    {product.imageUrl && (
                      <img src={product.imageUrl} alt="" className={styles.productImage} />
                    )}
                    <div className={styles.productInfo}>
                      <div className={styles.productName}>{product.name}</div>
                      {product.sku && (
                        <div className={styles.productSku}>{product.sku}</div>
                      )}
                    </div>
                  </div>
                </div>
                <div className={styles.tableCell}>
                  <span className={styles.stockValue}>{product.stockByLocation?.main_store || 0}</span>
                </div>
                <div className={styles.tableCell}>
                  <span className={styles.stockValue}>{product.stockByLocation?.back_store || 0}</span>
                </div>
                <div className={styles.tableCell}>
                  <span className={styles.stockValue}>{product.stockByLocation?.warehouse || 0}</span>
                </div>
                <div className={styles.tableCell}>
                  <span className={`${styles.stockValue} ${styles.totalStock}`}>{product.stock}</span>
                </div>
                <div className={styles.tableCell}>
                  <span className={styles.valueText}>{formatMoney(product.stock * product.costPrice)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { fetchDocs, updateDoc, toDate } from '@/lib/supabase-client-data';
import { checkFeatureAccess } from '@/lib/featureRestrictions';
import {
  AlertTriangle,
  Calendar,
  Search,
  Filter,
  Package,
  DollarSign,
  TrendingDown,
  MessageSquare,
  RefreshCw,
  Loader2,
} from 'lucide-react';
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
  productType?: string;
  usedInMenus: string[];
}

export default function ExpiryAlertsPage() {
  const { user, showToast, navigateTo } = useApp();
  const { formatMoney } = useCurrency();
  const [expiringProducts, setExpiringProducts] = useState<ExpiringProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDays, setFilterDays] = useState<number>(30);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [isAskingMO, setIsAskingMO] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'used' | 'dispose' | null>(null);

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

  const loadExpiringProducts = useCallback(async () => {
    try {
      if (!user?.businessId) return;

      const rows = await fetchDocs(`businesses/${user.businessId}/products`);
      const now = new Date();
      const filterDate = new Date();
      filterDate.setDate(filterDate.getDate() + filterDays);

      const usageByIngredient: Record<string, string[]> = {};
      rows.forEach((row) => {
        const data = row as Record<string, unknown>;
        const meta =
          data.metadata && typeof data.metadata === 'object'
            ? (data.metadata as Record<string, unknown>)
            : {};
        const productType = (data.productType || meta.productType) as string | undefined;
        if (productType === 'ingredient') return;
        const recipe = Array.isArray(data.recipeIngredients)
          ? data.recipeIngredients
          : Array.isArray(meta.recipeIngredients)
            ? meta.recipeIngredients
            : [];
        recipe.forEach((line: any) => {
          if (!line?.ingredientId) return;
          if (!usageByIngredient[line.ingredientId]) usageByIngredient[line.ingredientId] = [];
          const name = String(data.name || 'Menu');
          if (!usageByIngredient[line.ingredientId].includes(name)) {
            usageByIngredient[line.ingredientId].push(name);
          }
        });
      });

      const products = rows
        .map((row) => {
          const data = row as Record<string, unknown>;
          const meta =
            data.metadata && typeof data.metadata === 'object'
              ? (data.metadata as Record<string, unknown>)
              : {};
          const productType = (data.productType || meta.productType) as string | undefined;
          if (productType === 'dish') return null;

          const expiryDate = toDate(data.expiryDate || meta.expiryDate);
          if (!expiryDate) return null;

          const daysUntilExpiry = Math.ceil(
            (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          const qty = Number(data.stock ?? data.stockLevel ?? 0);
          const unitCost = Number(data.cost ?? data.costPrice ?? data.unitCost ?? 0);
          const id = String(data.id);

          return {
            id,
            name: String(data.name || 'Unknown'),
            category: String(data.category || 'uncategorized'),
            quantity: qty,
            unit: String(
              data.ingredientUnit || meta.ingredientUnit || data.unit || 'pieces'
            ),
            unitCost,
            totalValue: qty * unitCost,
            expiryDate,
            daysUntilExpiry,
            location: String(data.location || meta.location || 'kitchen'),
            supplier: (data.supplier || meta.supplier) as string | undefined,
            productType,
            usedInMenus: usageByIngredient[id] || [],
          } as ExpiringProduct;
        })
        .filter((product): product is ExpiringProduct => {
          if (!product) return false;
          return product.expiryDate <= filterDate;
        });

      products.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
      setExpiringProducts(products);
    } catch (error) {
      console.error('Failed to load expiring products:', error);
      showToast('Failed to load expiry alerts');
    } finally {
      setIsLoading(false);
    }
  }, [user?.businessId, filterDays, showToast]);

  useEffect(() => {
    setIsLoading(true);
    loadExpiringProducts();
  }, [loadExpiringProducts]);

  const handleMarkAsUsed = async (productId: string) => {
    if (!confirm('Clear this item from expiry alerts (used / sold)?')) return;
    if (!user?.businessId) return;
    setActionId(productId);
    setActionType('used');
    try {
      await updateDoc(`businesses/${user.businessId}/products`, productId, {
        expiryDate: null,
        expiryAlertCleared: true,
        expiryAlertClearedAt: new Date().toISOString(),
      });
      showToast('Cleared from expiry alerts');
      await loadExpiringProducts();
    } catch (error) {
      console.error('Failed to clear alert:', error);
      showToast('Failed to update product');
    } finally {
      setActionId(null);
      setActionType(null);
    }
  };

  const handleDispose = async (productId: string) => {
    const reason = prompt('Reason for disposal (spoilage, waste, etc.):');
    if (!reason) return;
    if (!user?.businessId) return;
    setActionId(productId);
    setActionType('dispose');
    try {
      await updateDoc(`businesses/${user.businessId}/products`, productId, {
        stock: 0,
        stockLevel: 0,
        currentStock: 0,
        expiryDate: null,
        disposed: true,
        disposalReason: reason,
        disposedAt: new Date().toISOString(),
      });
      showToast('Disposed and stock zeroed');
      await loadExpiringProducts();
    } catch (error) {
      console.error('Failed to dispose product:', error);
      showToast('Failed to dispose product');
    } finally {
      setActionId(null);
      setActionType(null);
    }
  };

  const filteredProducts = expiringProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || product.category === selectedCategory;
    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'ingredients' && product.productType === 'ingredient') ||
      (stockFilter === 'other' && product.productType !== 'ingredient');
    return matchesSearch && matchesCategory && matchesStock;
  });

  const getExpiryStatus = (daysUntilExpiry: number) => {
    if (daysUntilExpiry <= 0) return { label: 'Expired', color: 'red' as const };
    if (daysUntilExpiry <= 3) return { label: 'Critical', color: 'red' as const };
    if (daysUntilExpiry <= 7) return { label: 'Urgent', color: 'orange' as const };
    if (daysUntilExpiry <= 14) return { label: 'Warning', color: 'yellow' as const };
    return { label: 'Upcoming', color: 'blue' as const };
  };

  const totalValueAtRisk = filteredProducts.reduce((t, p) => t + p.totalValue, 0);
  const criticalCount = filteredProducts.filter((p) => p.daysUntilExpiry <= 3).length;
  const expiredCount = filteredProducts.filter((p) => p.daysUntilExpiry <= 0).length;

  const handleAskMO = () => {
    if (filteredProducts.length === 0) {
      showToast('No expiring products to analyze');
      return;
    }
    setIsAskingMO(true);
    let question = `I have ${filteredProducts.length} stock items expiring soon. `;
    if (expiredCount > 0) question += `${expiredCount} already expired. `;
    if (criticalCount > 0) question += `${criticalCount} expire within 3 days. `;
    question += `Value at risk is ${formatMoney(totalValueAtRisk)}. `;
    const menuHits = filteredProducts.filter((p) => p.usedInMenus.length > 0).slice(0, 5);
    if (menuHits.length > 0) {
      question +=
        'Linked to menus: ' +
        menuHits.map((p) => `${p.name} (${p.usedInMenus.join(', ')})`).join('; ') +
        '. ';
    }
    question += 'How should I minimize waste?';
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

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Expiry Alerts</h1>
          <p className={styles.pageDesc}>Protect stock value and cut waste</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.refreshButton}
            title="Refresh"
            onClick={() => {
              setIsLoading(true);
              loadExpiringProducts();
            }}
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <Package className={styles.summaryIcon} />
          <div>
            <p className={styles.summaryLabel}>In window</p>
            <p className={styles.summaryValue}>{filteredProducts.length}</p>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <AlertTriangle
            className={styles.summaryIcon}
            style={{ color: criticalCount > 0 ? 'var(--red)' : 'var(--text-3)' }}
          />
          <div>
            <p className={styles.summaryLabel}>Critical ≤3d</p>
            <p className={styles.summaryValue}>{criticalCount}</p>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <TrendingDown
            className={styles.summaryIcon}
            style={{ color: expiredCount > 0 ? 'var(--red)' : 'var(--text-3)' }}
          />
          <div>
            <p className={styles.summaryLabel}>Expired</p>
            <p className={styles.summaryValue}>{expiredCount}</p>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <DollarSign className={styles.summaryIcon} style={{ color: 'var(--green)' }} />
          <div>
            <p className={styles.summaryLabel}>Value at risk</p>
            <p className={styles.summaryValue}>{formatMoney(totalValueAtRisk)}</p>
          </div>
        </div>
      </div>

      {(criticalCount > 0 || expiredCount > 0) && (
        <div className={styles.alertBanner}>
          <div className={styles.alertBannerContent}>
            <AlertTriangle className={styles.alertBannerIcon} />
            <div className={styles.alertBannerBody}>
              <h3 className={styles.alertBannerTitle}>Action needed</h3>
              <p className={styles.alertBannerText}>
                {expiredCount > 0 && `${expiredCount} expired. `}
                {criticalCount > 0 && `${criticalCount} critical (≤3 days). `}
                Use in specials, staff meals, or dispose safely.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAskMO}
            disabled={isAskingMO}
            className={styles.askMOButton}
          >
            {isAskingMO ? (
              <Loader2 size={16} className={styles.spin} />
            ) : (
              <MessageSquare size={16} />
            )}
            {isAskingMO ? 'Opening…' : 'Ask MO'}
          </button>
        </div>
      )}

      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search stock..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterGroup}>
          <Filter size={16} className={styles.filterIcon} />
          <select
            value={filterDays}
            onChange={(e) => setFilterDays(parseInt(e.target.value, 10))}
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
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All stock</option>
          <option value="ingredients">Ingredients</option>
          <option value="other">Other stock</option>
        </select>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All categories</option>
          <option value="vegetables">Vegetables</option>
          <option value="meat">Meat</option>
          <option value="dairy">Dairy</option>
          <option value="grains">Grains</option>
          <option value="spices">Spices</option>
          <option value="oils">Oils</option>
          <option value="beverages">Beverages</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className={styles.cardsGrid}>
        {filteredProducts.map((product) => {
          const status = getExpiryStatus(product.daysUntilExpiry);
          const busy = actionId === product.id;

          return (
            <div
              key={product.id}
              className={`${styles.expiryCard} ${
                product.daysUntilExpiry <= 0
                  ? styles.cardExpired
                  : product.daysUntilExpiry <= 3
                    ? styles.cardCritical
                    : product.daysUntilExpiry <= 7
                      ? styles.cardWarning
                      : ''
              }`}
            >
              <div className={styles.cardTop}>
                <div>
                  <h3 className={styles.cardName}>{product.name}</h3>
                  <p className={styles.cardMeta}>
                    {product.category}
                    {product.supplier ? ` · ${product.supplier}` : ''}
                  </p>
                </div>
                <span className={`${styles.statusBadge} ${styles[status.color]}`}>
                  {status.label}
                </span>
              </div>

              <div className={styles.cardStats}>
                <div>
                  <span className={styles.statLabel}>Qty</span>
                  <span className={styles.statValue}>
                    {product.quantity} {product.unit}
                  </span>
                </div>
                <div>
                  <span className={styles.statLabel}>Value</span>
                  <span className={styles.statValue}>{formatMoney(product.totalValue)}</span>
                </div>
                <div>
                  <span className={styles.statLabel}>Expires</span>
                  <span className={styles.statValue}>
                    <Calendar size={12} className={styles.inlineIcon} />
                    {product.expiryDate.toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className={styles.statLabel}>Days left</span>
                  <span
                    className={`${styles.statValue} ${
                      product.daysUntilExpiry <= 3 ? styles.dangerText : ''
                    }`}
                  >
                    {product.daysUntilExpiry <= 0
                      ? 'Expired'
                      : `${product.daysUntilExpiry}d`}
                  </span>
                </div>
              </div>

              {product.usedInMenus.length > 0 && (
                <div className={styles.cardExtra}>
                  <span
                    className={styles.menuUsage}
                    title={product.usedInMenus.join(', ')}
                  >
                    Used in: {product.usedInMenus.slice(0, 2).join(', ')}
                    {product.usedInMenus.length > 2
                      ? ` +${product.usedInMenus.length - 2}`
                      : ''}
                  </span>
                </div>
              )}

              <div className={styles.cardActions}>
                <button
                  type="button"
                  onClick={() => handleMarkAsUsed(product.id)}
                  className={`${styles.cardBtn} ${styles.cardBtnSuccess}`}
                  disabled={busy}
                >
                  {busy && actionType === 'used' ? (
                    <Loader2 size={14} className={styles.spin} />
                  ) : null}
                  {busy && actionType === 'used' ? '…' : 'Used'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDispose(product.id)}
                  className={`${styles.cardBtn} ${styles.cardBtnDanger}`}
                  disabled={busy}
                >
                  {busy && actionType === 'dispose' ? (
                    <Loader2 size={14} className={styles.spin} />
                  ) : null}
                  {busy && actionType === 'dispose' ? '…' : 'Dispose'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className={styles.emptyState}>
          <Package className={styles.emptyStateIcon} />
          <p>No expiring stock in this window</p>
          <p className={styles.emptyHint}>
            Items appear when they approach their expiry dates
          </p>
        </div>
      )}

      {filteredProducts.length > 0 && (
        <div className={styles.recommendations}>
          <h3 className={styles.recommendationsTitle}>Tips</h3>
          <ul className={styles.recommendationsList}>
            <li>Feature near-expiry items in specials or staff meals</li>
            <li>Adjust portions on menus that use critical stock</li>
            <li>Review reorder points to avoid overstock</li>
            <li>Dispose only when unsafe — note the reason</li>
          </ul>
        </div>
      )}
    </div>
  );
}

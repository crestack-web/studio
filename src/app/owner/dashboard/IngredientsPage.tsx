'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { fetchDocs, addDoc, updateDoc, deleteDoc, toDate } from '@/lib/supabase-client-data';
import { resolveOwnerScopeBusinessId } from '@/lib/resolve-business-scope';
import { getSupabase } from '@/lib/supabase';
import { checkFeatureAccess } from '@/lib/featureRestrictions';
import { getIngredientUnits } from './utils/restaurantHelpers';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  AlertTriangle,
  Package,
  Scale,
  TrendingUp,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import styles from './IngredientsPage.module.css';

interface Ingredient {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  unitCost: number;
  supplier?: string;
  lastRestocked?: Date | null;
  expiryDate?: Date | null;
  active: boolean;
  createdAt: Date;
}

interface MenuUsage {
  menuId: string;
  menuName: string;
  quantity: number;
  unit: string;
}

const INGREDIENT_CATEGORIES = [
  'vegetables',
  'meat',
  'dairy',
  'grains',
  'spices',
  'oils',
  'beverages',
  'other',
];

export default function IngredientsPage() {
  const { user, showToast } = useApp();
  const { formatMoney } = useCurrency();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [usageMap, setUsageMap] = useState<Record<string, MenuUsage[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockTarget, setRestockTarget] = useState<Ingredient | null>(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockUnitCost, setRestockUnitCost] = useState('');
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [saving, setSaving] = useState(false);
  const [restocking, setRestocking] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: '',
    unitCost: '',
    currentStock: '',
    minimumStock: '10',
    supplier: '',
    expiryDate: '',
  });

  const units = getIngredientUnits();
  const [businessId, setBusinessId] = useState<string | null>(user?.businessId || null);

  useEffect(() => {
    if (user?.businessId && user.businessId !== businessId) {
      setBusinessId(user.businessId);
    }
  }, [user?.businessId]);
  const path = businessId ? `businesses/${businessId}/products` : '';
  const [loadError, setLoadError] = useState<string | null>(null);

  // Resolve businessId reliably (AppContext can lag or miss it)
  const resolveBusinessId = useCallback(async (): Promise<string | null> => {
    if (businessId) return businessId;
    if (user?.businessId) {
      setBusinessId(user.businessId);
      return user.businessId;
    }
    const uid = user?.id;
    if (!uid) {
      try {
        const { data: { session } } = await getSupabase().auth.getSession();
        if (!session?.user?.id) return null;
        const bid = await resolveOwnerScopeBusinessId(session.user.id);
        if (bid) {
          setBusinessId(bid);
          return bid;
        }
        // Profile fallback
        const { data: profile } = await getSupabase()
          .from('users')
          .select('business_id, businessId')
          .eq('id', session.user.id)
          .maybeSingle();
        const fromProfile = (profile as any)?.business_id || (profile as any)?.businessId || null;
        if (fromProfile && fromProfile !== session.user.id) {
          setBusinessId(String(fromProfile));
          return String(fromProfile);
        }
        return null;
      } catch {
        return null;
      }
    }
    try {
      const bid = await resolveOwnerScopeBusinessId(uid, user?.businessId);
      if (bid) {
        setBusinessId(bid);
        return bid;
      }
      const { data: profile } = await getSupabase()
        .from('users')
        .select('business_id, businessId')
        .eq('id', uid)
        .maybeSingle();
      const fromProfile = (profile as any)?.business_id || (profile as any)?.businessId || null;
      if (fromProfile && fromProfile !== uid) {
        setBusinessId(String(fromProfile));
        return String(fromProfile);
      }
    } catch (e) {
      console.error('resolveBusinessId failed', e);
    }
    return null;
  }, [businessId, user?.businessId, user?.id]);

  // Non-blocking plan check — never block the page on Firebase
  useEffect(() => {
    let cancelled = false;
    const checkAccess = async () => {
      if (!user?.id) return;
      try {
        const hasAccess = await Promise.race([
          checkFeatureAccess(user.id, 'ingredient-tracking'),
          new Promise<{ eligible: boolean }>((resolve) =>
            setTimeout(() => resolve({ eligible: true }), 2500)
          ),
        ]);
        if (!cancelled && !hasAccess.eligible) {
          showToast('This feature requires Busmo Control or higher');
        }
      } catch {
        // ignore — page still usable
      }
    };
    checkAccess();
    return () => {
      cancelled = true;
    };
  }, [user?.id, showToast]);

  const loadAll = useCallback(async () => {
    const bid = await resolveBusinessId();
    if (!bid) {
      return false;
    }
    setLoadError(null);
    try {
      const docs = await fetchDocs(`businesses/${bid}/products`);
      const map: Record<string, MenuUsage[]> = {};
      const items: Ingredient[] = [];

      for (const data of docs as any[]) {
        const meta =
          data.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata)
            ? data.metadata
            : {};
        const productType = data.productType || meta.productType || null;

        // Build menu usage from dishes
        if (productType !== 'ingredient') {
          const recipe = Array.isArray(data.recipeIngredients)
            ? data.recipeIngredients
            : Array.isArray(meta.recipeIngredients)
              ? meta.recipeIngredients
              : [];
          for (const line of recipe) {
            if (!line?.ingredientId) continue;
            if (!map[line.ingredientId]) map[line.ingredientId] = [];
            map[line.ingredientId].push({
              menuId: String(data.id),
              menuName: String(data.name || 'Menu item'),
              quantity: Number(line.quantity || 0),
              unit: String(line.unit || ''),
            });
          }
          continue;
        }

        items.push({
          id: String(data.id),
          name: String(data.name || ''),
          category: String(data.category || meta.category || 'other'),
          unit: String(
            data.ingredientUnit || meta.ingredientUnit || data.unit || 'Piece'
          ),
          currentStock: Number(
            data.stock ?? data.stockLevel ?? data.currentStock ?? meta.currentStock ?? 0
          ),
          minimumStock: Number(
            data.reorderLevel ??
              data.lowStockThreshold ??
              meta.minimumStock ??
              meta.reorderLevel ??
              10
          ),
          unitCost: Number(
            data.cost ?? data.costPrice ?? data.unitCost ?? meta.unitCost ?? 0
          ),
          supplier: (data.supplier || meta.supplier || undefined) as string | undefined,
          lastRestocked:
            toDate(data.lastRestocked || meta.lastRestocked) ||
            toDate(data.updatedAt) ||
            toDate(data.createdAt),
          expiryDate: toDate(data.expiryDate || meta.expiryDate),
          active: data.active !== false && data.status !== 'inactive',
          createdAt: toDate(data.createdAt) || new Date(),
        });
      }

      setIngredients(items);
      setUsageMap(map);
      return true;
    } catch (error: any) {
      console.error('Failed to load ingredients:', error);
      setLoadError(error?.message || 'Failed to load ingredients');
      showToast('Failed to load ingredients');
      return true; // stop spinner even on error
    }
  }, [resolveBusinessId, showToast]);

  // Load when user is available; resolve businessId then fetch
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const run = async () => {
      setIsLoading(true);
      const ok = await loadAll();
      if (!cancelled) {
        if (!ok) {
          // Retry once after short delay (auth/business may still be loading)
          timer = setTimeout(async () => {
            await loadAll();
            if (!cancelled) setIsLoading(false);
          }, 1500);
        } else {
          setIsLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [user?.id, loadAll]);

  const loadIngredients = loadAll;
  const loadMenuUsage = loadAll;

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      unit: '',
      unitCost: '',
      currentStock: '',
      minimumStock: '10',
      supplier: '',
      expiryDate: '',
    });
  };

  const handleSave = async () => {
    const bid = await resolveBusinessId();
    if (!bid) {
      showToast('Business not loaded — refresh and try again');
      return;
    }
    if (!formData.name.trim() || !formData.category || !formData.unit) {
      showToast('Name, category, and unit are required');
      return;
    }
    const unitCost = parseFloat(formData.unitCost);
    if (isNaN(unitCost) || unitCost < 0) {
      showToast('Enter a valid unit cost');
      return;
    }

    setSaving(true);
    try {
      const savePath = `businesses/${bid}/products`;
      const stock = Math.max(0, Math.round(parseFloat(formData.currentStock) || 0));
      const minStock = Math.max(0, Math.round(parseFloat(formData.minimumStock) || 10));
      const ingredientData: Record<string, unknown> = {
        name: formData.name.trim(),
        description: '',
        category: formData.category,
        unit: formData.unit,
        ingredientUnit: formData.unit,
        price: 0,
        cost: unitCost,
        costPrice: unitCost,
        unitCost,
        stock,
        stockLevel: stock,
        reorderLevel: minStock,
        lowStockThreshold: minStock,
        productType: 'ingredient',
        active: true,
        status: 'active',
        attributes: { emoji: '🥘' },
        updatedAt: new Date().toISOString(),
      };
      if (formData.supplier.trim()) {
        ingredientData.supplier = formData.supplier.trim();
      }
      if (formData.expiryDate) {
        ingredientData.expiryDate = formData.expiryDate;
      }

      if (editingIngredient) {
        await updateDoc(savePath, editingIngredient.id, ingredientData);
        showToast('Ingredient updated');
      } else {
        const id = crypto.randomUUID();
        ingredientData.id = id;
        ingredientData.createdAt = new Date().toISOString();
        await addDoc(savePath, ingredientData);
        showToast('Ingredient added');
      }

      setShowAddModal(false);
      setEditingIngredient(null);
      resetForm();
      await loadAll();
    } catch (error: any) {
      console.error('Failed to save ingredient:', error);
      const msg = error?.message || error?.details || 'Failed to save ingredient';
      showToast(String(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ingredient: Ingredient) => {
    const bid = await resolveBusinessId();
    if (!bid) {
      showToast('Business not loaded — refresh and try again');
      return;
    }
    const deletePath = `businesses/${bid}/products`;
    const usedIn = usageMap[ingredient.id] || [];
    if (usedIn.length > 0) {
      const names = usedIn.map((u) => u.menuName).join(', ');
      if (
        !confirm(
          `"${ingredient.name}" is used in: ${names}. Delete anyway?`
        )
      ) {
        return;
      }
    } else if (!confirm(`Delete ${ingredient.name}?`)) {
      return;
    }

    setDeletingId(ingredient.id);
    try {
      await deleteDoc(deletePath, ingredient.id);
      showToast('Ingredient deleted');
      await loadAll();
    } catch (error) {
      console.error('Failed to delete ingredient:', error);
      showToast('Failed to delete ingredient');
    } finally {
      setDeletingId(null);
    }
  };

  const openRestock = (ingredient: Ingredient) => {
    setRestockTarget(ingredient);
    setRestockQty('');
    setRestockUnitCost(ingredient.unitCost.toString());
    setShowRestockModal(true);
  };

  const handleRestock = async () => {
    if (!restockTarget) return;
    const bid = await resolveBusinessId();
    if (!bid) {
      showToast('Business not loaded — refresh and try again');
      return;
    }
    const qty = parseFloat(restockQty);
    if (isNaN(qty) || qty <= 0) {
      showToast('Enter a valid quantity');
      return;
    }

    setRestocking(true);
    try {
      const restockPath = `businesses/${bid}/products`;
      const newStock = Math.max(0, Math.round(restockTarget.currentStock + qty));
      const updates: Record<string, unknown> = {
        stock: newStock,
        stockLevel: newStock,
        currentStock: newStock,
        lastRestocked: new Date().toISOString(),
      };
      const newCost = parseFloat(restockUnitCost);
      if (!isNaN(newCost) && newCost >= 0) {
        updates.unitCost = newCost;
        updates.cost = newCost;
        updates.costPrice = newCost;
      }
      await updateDoc(restockPath, restockTarget.id, updates);
      showToast(`Restocked ${qty} ${restockTarget.unit} of ${restockTarget.name}`);
      setShowRestockModal(false);
      setRestockTarget(null);
      await loadAll();
    } catch (error) {
      console.error('Failed to restock:', error);
      showToast('Failed to restock');
    } finally {
      setRestocking(false);
    }
  };

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      category: ingredient.category,
      unit: ingredient.unit,
      unitCost: ingredient.unitCost.toString(),
      currentStock: ingredient.currentStock.toString(),
      minimumStock: ingredient.minimumStock.toString(),
      supplier: ingredient.supplier || '',
      expiryDate: ingredient.expiryDate
        ? ingredient.expiryDate.toISOString().slice(0, 10)
        : '',
    });
    setShowAddModal(true);
  };

  const filteredIngredients = ingredients.filter((ingredient) => {
    const matchesSearch =
      ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ingredient.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || ingredient.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = ingredients.filter(
    (ing) => ing.currentStock <= ing.minimumStock
  ).length;
  const expiringSoonCount = ingredients.filter((ing) => {
    if (!ing.expiryDate || !ing.active) return false;
    const seven = new Date();
    seven.setDate(seven.getDate() + 7);
    return ing.expiryDate <= seven;
  }).length;
  const totalValue = ingredients.reduce(
    (sum, ing) => sum + ing.currentStock * ing.unitCost,
    0
  );

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <div className="text-center">
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Loading ingredients...</p>
          {!user?.businessId && (
            <p className={styles.loadingText} style={{ marginTop: 8, opacity: 0.7 }}>
              Waiting for business…
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {loadError && (
        <div className={styles.alertBanner} style={{ marginBottom: 16 }}>
          <AlertTriangle size={18} />
          <span>{loadError}</span>
          <button
            type="button"
            className={styles.addButton}
            style={{ marginLeft: 'auto' }}
            onClick={async () => {
              setIsLoading(true);
              await loadAll();
              setIsLoading(false);
            }}
          >
            Retry
          </button>
        </div>
      )}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Ingredients</h1>
          <p className={styles.pageDesc}>
            Kitchen stock, costs, and which menus use each item
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={async () => {
              setIsLoading(true);
              await loadAll();
              setIsLoading(false);
            }}
            className={styles.refreshButton}
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setEditingIngredient(null);
              setShowAddModal(true);
            }}
            className={styles.addButton}
          >
            <Plus size={20} />
            Add Ingredient
          </button>
        </div>
      </div>

      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <Package className={styles.summaryIcon} />
          <div>
            <p className={styles.summaryLabel}>Total</p>
            <p className={styles.summaryValue}>{ingredients.length}</p>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <Scale className={styles.summaryIcon} style={{ color: 'var(--green)' }} />
          <div>
            <p className={styles.summaryLabel}>Stock value</p>
            <p className={styles.summaryValue}>{formatMoney(totalValue)}</p>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <AlertTriangle
            className={styles.summaryIcon}
            style={{ color: lowStockCount > 0 ? 'var(--red)' : 'var(--text-3)' }}
          />
          <div>
            <p className={styles.summaryLabel}>Low stock</p>
            <p className={styles.summaryValue}>{lowStockCount}</p>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <TrendingUp
            className={styles.summaryIcon}
            style={{ color: expiringSoonCount > 0 ? 'var(--amber)' : 'var(--text-3)' }}
          />
          <div>
            <p className={styles.summaryLabel}>Expiring ≤7d</p>
            <p className={styles.summaryValue}>{expiringSoonCount}</p>
          </div>
        </div>
      </div>

      {(lowStockCount > 0 || expiringSoonCount > 0) && (
        <div className={styles.alerts}>
          <h3 className={styles.alertsTitle}>Alerts</h3>
          {lowStockCount > 0 && (
            <p className={styles.alertItem}>
              • {lowStockCount} ingredient{lowStockCount !== 1 ? 's' : ''} below minimum
            </p>
          )}
          {expiringSoonCount > 0 && (
            <p className={styles.alertItem}>
              • {expiringSoonCount} expiring within 7 days
            </p>
          )}
        </div>
      )}

      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All categories</option>
          {INGREDIENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Mobile-friendly cards + desktop table */}
      <div className={styles.cardsGrid}>
        {filteredIngredients.map((ingredient) => {
          const isLow = ingredient.currentStock <= ingredient.minimumStock;
          const isExpired =
            ingredient.expiryDate && ingredient.expiryDate < new Date();
          const isExpiring =
            ingredient.expiryDate &&
            !isExpired &&
            ingredient.expiryDate <=
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          const usedIn = usageMap[ingredient.id] || [];
          const isDeleting = deletingId === ingredient.id;

          return (
            <div
              key={ingredient.id}
              className={`${styles.ingredientCard} ${isLow ? styles.cardLow : ''}`}
            >
              <div className={styles.cardTop}>
                <div>
                  <h3 className={styles.cardName}>{ingredient.name}</h3>
                  <p className={styles.cardMeta}>
                    {ingredient.category} · {ingredient.unit}
                  </p>
                </div>
                <span
                  className={`${styles.statusBadge} ${
                    isExpired
                      ? styles.expired
                      : isExpiring
                        ? styles.expiring
                        : isLow
                          ? styles.lowStock
                          : styles.inStock
                  }`}
                >
                  {isExpired
                    ? 'Expired'
                    : isExpiring
                      ? 'Expiring'
                      : isLow
                        ? 'Low stock'
                        : 'In stock'}
                </span>
              </div>

              <div className={styles.cardStats}>
                <div>
                  <span className={styles.statLabel}>Stock</span>
                  <span className={`${styles.statValue} ${isLow ? styles.low : ''}`}>
                    {ingredient.currentStock} {ingredient.unit}
                  </span>
                </div>
                <div>
                  <span className={styles.statLabel}>Unit cost</span>
                  <span className={styles.statValue}>
                    {formatMoney(ingredient.unitCost)}
                  </span>
                </div>
                <div>
                  <span className={styles.statLabel}>Value</span>
                  <span className={styles.statValue}>
                    {formatMoney(ingredient.currentStock * ingredient.unitCost)}
                  </span>
                </div>
                <div>
                  <span className={styles.statLabel}>Min</span>
                  <span className={styles.statValue}>{ingredient.minimumStock}</span>
                </div>
              </div>

              {(usedIn.length > 0 || ingredient.expiryDate) && (
                <div className={styles.cardExtra}>
                  {usedIn.length > 0 && (
                    <span
                      className={styles.usedInList}
                      title={usedIn.map((u) => u.menuName).join(', ')}
                    >
                      Used in {usedIn.length} menu{usedIn.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {ingredient.expiryDate && (
                    <span
                      className={`${styles.expiryDate} ${
                        isExpired ? styles.expired : isExpiring ? styles.expiring : ''
                      }`}
                    >
                      Exp {ingredient.expiryDate.toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}

              <div className={styles.cardActions}>
                <button
                  type="button"
                  onClick={() => openRestock(ingredient)}
                  className={`${styles.cardBtn} ${styles.cardBtnPrimary}`}
                  disabled={!!deletingId || saving}
                >
                  <Plus size={14} />
                  Restock
                </button>
                <button
                  type="button"
                  onClick={() => handleEdit(ingredient)}
                  className={styles.cardBtn}
                  disabled={!!deletingId || saving}
                >
                  <Edit2 size={14} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(ingredient)}
                  className={`${styles.cardBtn} ${styles.cardBtnDanger}`}
                  disabled={isDeleting || saving}
                >
                  {isDeleting ? (
                    <Loader2 size={14} className={styles.spin} />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  {isDeleting ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredIngredients.length === 0 && (
        <div className={styles.emptyState}>
          <Package className={styles.emptyIcon} />
          <p>No ingredients found</p>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setEditingIngredient(null);
              setShowAddModal(true);
            }}
            className={styles.emptyStateButton}
          >
            Add your first ingredient
          </button>
        </div>
      )}

      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.restockHeader}>
              <h2 className={styles.modalTitle}>
                {editingIngredient ? 'Edit ingredient' : 'Add ingredient'}
              </h2>
              <button
                type="button"
                className={styles.closeIcon}
                onClick={() => {
                  if (saving) return;
                  setShowAddModal(false);
                  setEditingIngredient(null);
                  resetForm();
                }}
                disabled={saving}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={styles.formInput}
                  placeholder="e.g. Rice, Tomato, Chicken"
                  disabled={saving}
                />
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={styles.formSelect}
                    disabled={saving}
                  >
                    <option value="">Select</option>
                    {INGREDIENT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className={styles.formSelect}
                    disabled={saving}
                  >
                    <option value="">Select</option>
                    {units.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Unit cost</label>
                  <input
                    type="number"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                    className={styles.formInput}
                    min={0}
                    step="0.01"
                    disabled={saving}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Current stock</label>
                  <input
                    type="number"
                    value={formData.currentStock}
                    onChange={(e) =>
                      setFormData({ ...formData, currentStock: e.target.value })
                    }
                    className={styles.formInput}
                    min={0}
                    step="0.01"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Minimum stock</label>
                  <input
                    type="number"
                    value={formData.minimumStock}
                    onChange={(e) =>
                      setFormData({ ...formData, minimumStock: e.target.value })
                    }
                    className={styles.formInput}
                    min={0}
                    step="0.01"
                    disabled={saving}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Expiry date</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expiryDate: e.target.value })
                    }
                    className={styles.formInput}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Supplier (optional)</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className={styles.formInput}
                  disabled={saving}
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingIngredient(null);
                  resetForm();
                }}
                className={`${styles.modalButton} ${styles.secondary}`}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className={`${styles.modalButton} ${styles.primary}`}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className={styles.spin} />
                    {editingIngredient ? 'Updating…' : 'Adding…'}
                  </>
                ) : editingIngredient ? (
                  'Update'
                ) : (
                  'Add ingredient'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRestockModal && restockTarget && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.restockHeader}>
              <h2 className={styles.modalTitle}>Restock {restockTarget.name}</h2>
              <button
                type="button"
                className={styles.closeIcon}
                onClick={() => {
                  if (restocking) return;
                  setShowRestockModal(false);
                  setRestockTarget(null);
                }}
                disabled={restocking}
              >
                <X size={18} />
              </button>
            </div>
            <p className={styles.restockHint}>
              Current: {restockTarget.currentStock} {restockTarget.unit}
            </p>
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Quantity to add ({restockTarget.unit})
                </label>
                <input
                  type="number"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className={styles.formInput}
                  min={0}
                  step="0.01"
                  autoFocus
                  disabled={restocking}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Unit cost (optional update)</label>
                <input
                  type="number"
                  value={restockUnitCost}
                  onChange={(e) => setRestockUnitCost(e.target.value)}
                  className={styles.formInput}
                  min={0}
                  step="0.01"
                  disabled={restocking}
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => {
                  setShowRestockModal(false);
                  setRestockTarget(null);
                }}
                className={`${styles.modalButton} ${styles.secondary}`}
                disabled={restocking}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRestock}
                className={`${styles.modalButton} ${styles.primary}`}
                disabled={restocking}
              >
                {restocking ? (
                  <>
                    <Loader2 size={16} className={styles.spin} />
                    Restocking…
                  </>
                ) : (
                  'Restock'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

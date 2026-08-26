'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { fetchDocs, addDoc, updateDoc, deleteDoc, toDate } from '@/lib/supabase-client-data';
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
  const path = user?.businessId ? `businesses/${user.businessId}/products` : '';

  useEffect(() => {
    const checkAccess = async () => {
      if (user?.id) {
        const hasAccess = await checkFeatureAccess(user.id, 'ingredient-tracking');
        if (!hasAccess.eligible) {
          showToast('This feature requires a Standard plan or higher');
        }
      }
    };
    checkAccess();
  }, [user]);

  const loadIngredients = useCallback(async () => {
    if (!user?.businessId) return;
    try {
      const docs = await fetchDocs(`businesses/${user.businessId}/products`);
      const items = docs
        .map((data: any) => {
          const meta = data.metadata && typeof data.metadata === 'object' ? data.metadata : {};
          return {
            id: data.id,
            name: data.name || '',
            category: data.category || meta.category || 'other',
            unit: data.ingredientUnit || meta.ingredientUnit || data.unit || 'Piece',
            currentStock: Number(data.stock ?? data.stockLevel ?? data.currentStock ?? 0),
            minimumStock: Number(
              data.reorderLevel ?? data.lowStockThreshold ?? meta.minimumStock ?? 10
            ),
            unitCost: Number(data.cost ?? data.costPrice ?? data.unitCost ?? meta.unitCost ?? 0),
            supplier: data.supplier || meta.supplier,
            lastRestocked: toDate(data.lastRestocked || meta.lastRestocked) || toDate(data.createdAt),
            expiryDate: toDate(data.expiryDate || meta.expiryDate),
            active: data.active !== false,
            createdAt: toDate(data.createdAt) || new Date(),
            productType: data.productType || meta.productType,
          };
        })
        .filter((item: any) => item.productType === 'ingredient') as Ingredient[];
      setIngredients(items);
    } catch (error) {
      console.error('Failed to load ingredients:', error);
      showToast('Failed to load ingredients');
    } finally {
      setIsLoading(false);
    }
  }, [user?.businessId, showToast]);

  const loadMenuUsage = useCallback(async () => {
    if (!user?.businessId) return;
    try {
      const docs = await fetchDocs(`businesses/${user.businessId}/products`);
      const map: Record<string, MenuUsage[]> = {};
      docs.forEach((data: any) => {
        const meta = data.metadata && typeof data.metadata === 'object' ? data.metadata : {};
        const productType = data.productType || meta.productType;
        if (productType === 'ingredient') return;
        const recipe = Array.isArray(data.recipeIngredients)
          ? data.recipeIngredients
          : Array.isArray(meta.recipeIngredients)
            ? meta.recipeIngredients
            : [];
        recipe.forEach((line: any) => {
          if (!line?.ingredientId) return;
          if (!map[line.ingredientId]) map[line.ingredientId] = [];
          map[line.ingredientId].push({
            menuId: data.id,
            menuName: data.name || 'Menu item',
            quantity: Number(line.quantity || 0),
            unit: line.unit || '',
          });
        });
      });
      setUsageMap(map);
    } catch (error) {
      console.error('Failed to load menu usage:', error);
    }
  }, [user?.businessId]);

  useEffect(() => {
    loadIngredients();
    loadMenuUsage();
  }, [loadIngredients, loadMenuUsage]);

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
    if (!path) return;
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
      const stock = parseFloat(formData.currentStock) || 0;
      const minStock = parseFloat(formData.minimumStock) || 10;
      const ingredientData: Record<string, unknown> = {
        name: formData.name.trim(),
        category: formData.category,
        unit: formData.unit,
        ingredientUnit: formData.unit,
        unitCost,
        cost: unitCost,
        costPrice: unitCost,
        stock,
        stockLevel: stock,
        currentStock: stock,
        reorderLevel: minStock,
        lowStockThreshold: minStock,
        productType: 'ingredient',
        supplier: formData.supplier.trim() || null,
        expiryDate: formData.expiryDate ? formData.expiryDate : null,
        active: true,
        attributes: { emoji: '🥘' },
      };

      if (editingIngredient) {
        await updateDoc(path, editingIngredient.id, ingredientData);
        showToast('Ingredient updated');
      } else {
        ingredientData.createdAt = new Date().toISOString();
        await addDoc(path, ingredientData);
        showToast('Ingredient added');
      }

      setShowAddModal(false);
      setEditingIngredient(null);
      resetForm();
      await loadIngredients();
      await loadMenuUsage();
    } catch (error) {
      console.error('Failed to save ingredient:', error);
      showToast('Failed to save ingredient');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ingredient: Ingredient) => {
    if (!path) return;
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
      await deleteDoc(path, ingredient.id);
      showToast('Ingredient deleted');
      await loadIngredients();
      await loadMenuUsage();
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
    if (!restockTarget || !path) return;
    const qty = parseFloat(restockQty);
    if (isNaN(qty) || qty <= 0) {
      showToast('Enter a valid quantity');
      return;
    }

    setRestocking(true);
    try {
      const newStock = restockTarget.currentStock + qty;
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
      await updateDoc(path, restockTarget.id, updates);
      showToast(`Restocked ${qty} ${restockTarget.unit} of ${restockTarget.name}`);
      setShowRestockModal(false);
      setRestockTarget(null);
      await loadIngredients();
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
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
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
            onClick={() => {
              setIsLoading(true);
              loadIngredients().then(() => loadMenuUsage());
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
                    Saving…
                  </>
                ) : editingIngredient ? (
                  'Update'
                ) : (
                  'Add'
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

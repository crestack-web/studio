'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { fetchDocs, toDate } from '@/lib/supabase-client-data';
import { saveProductViaApi, deleteProductViaApi } from '@/lib/product-api';
import { resolveOwnerScopeBusinessId } from '@/lib/resolve-business-scope';
import { getSupabase } from '@/lib/supabase';
import { checkFeatureAccess } from '@/lib/featureRestrictions';
import { getDishCategories } from './utils/restaurantHelpers';
import { Plus, Edit2, Trash2, Search, Clock, X, ChefHat, Loader2 } from 'lucide-react';
import styles from './MenuManagementPage.module.css';

interface RecipeLine {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  unitCost: number;
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  cost: number;
  preparationTime: number;
  ingredients: string[];
  recipeIngredients: RecipeLine[];
  available: boolean;
  imageUrl?: string;
  createdAt: Date;
}

interface IngredientOption {
  id: string;
  name: string;
  unit: string;
  unitCost: number;
  stock: number;
}

export default function MenuManagementPage() {
  const { user, showToast } = useApp();
  const { formatMoney } = useCurrency();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [ingredientOptions, setIngredientOptions] = useState<IngredientOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    preparationTime: '',
    available: true,
  });
  const [recipeLines, setRecipeLines] = useState<RecipeLine[]>([]);
  const [pickIngredientId, setPickIngredientId] = useState('');
  const [pickQuantity, setPickQuantity] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const dishCategories = getDishCategories();
  const [businessId, setBusinessId] = useState<string | null>(user?.businessId || null);

  useEffect(() => {
    if (user?.businessId && user.businessId !== businessId) {
      setBusinessId(user.businessId);
    }
  }, [user?.businessId]);

  const resolveBusinessId = useCallback(async (): Promise<string | null> => {
    if (businessId) return businessId;
    if (user?.businessId) {
      setBusinessId(user.businessId);
      return user.businessId;
    }
    try {
      let authId: string | undefined = user?.id;
      if (!authId) {
        const { data: { session } } = await getSupabase().auth.getSession();
        authId = session?.user?.id ?? undefined;
      }
      if (!authId) return null;
      const bid = await resolveOwnerScopeBusinessId(authId, user?.businessId);
      if (bid) {
        setBusinessId(bid);
        return bid;
      }
      const { data: profile } = await getSupabase()
        .from('users')
        .select('business_id, businessId')
        .eq('id', authId)
        .maybeSingle();
      const fromProfile = (profile as any)?.business_id || (profile as any)?.businessId || null;
      if (fromProfile && fromProfile !== authId) {
        setBusinessId(String(fromProfile));
        return String(fromProfile);
      }
    } catch (e) {
      console.error('resolveBusinessId failed', e);
    }
    return null;
  }, [businessId, user?.businessId, user?.id]);

  useEffect(() => {
    const checkAccess = async () => {
      if (user?.id) {
        try {
          const hasAccess = await Promise.race([
            checkFeatureAccess(user.id, 'menu-management'),
            new Promise<{ eligible: boolean }>((r) => setTimeout(() => r({ eligible: true }), 2500)),
          ]);
          if (!hasAccess.eligible) {
            showToast('This feature requires Busmo Control or higher');
          }
        } catch { /* ignore */ }
      }
    };
    checkAccess();
  }, [user?.id, showToast]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      const bid = await resolveBusinessId();
      if (!bid) {
        setTimeout(() => { if (!cancelled) setIsLoading(false); }, 2000);
        return;
      }
      await Promise.all([loadMenuItems(bid), loadIngredients(bid)]);
      if (!cancelled) setIsLoading(false);
    };
    run();
    return () => { cancelled = true; };
  }, [user?.id, resolveBusinessId]);

  const loadMenuItems = async (bidArg?: string) => {
    try {
      const bid = bidArg || (await resolveBusinessId());
      if (!bid) {
        setIsLoading(false);
        return;
      }
      const docs = await fetchDocs(`businesses/${bid}/products`);
      const items = docs
        .map((data: any) => {
          const meta = data.metadata && typeof data.metadata === 'object' ? data.metadata : {};
          const recipeIngredients: RecipeLine[] = Array.isArray(data.recipeIngredients)
            ? data.recipeIngredients
            : Array.isArray(meta.recipeIngredients)
              ? meta.recipeIngredients
              : [];
          return {
            id: data.id,
            name: data.name || '',
            description: data.description,
            category: data.dishCategory || meta.dishCategory || data.category || 'Other',
            price: Number(data.price ?? data.sellingPrice ?? 0),
            cost: Number(data.cost ?? data.costPrice ?? 0),
            preparationTime: Number(data.preparationTime || meta.preparationTime || 0),
            ingredients: data.ingredients || meta.ingredients || [],
            recipeIngredients,
            available: data.active !== false,
            imageUrl: data.imageUrl,
            createdAt: toDate(data.createdAt) || new Date(),
            productType: data.productType || meta.productType,
            dishCategory: data.dishCategory || meta.dishCategory,
          };
        })
        .filter((item: any) => {
          if (item.productType === 'ingredient') return false;
          if (item.productType === 'dish') return true;
          if (item.dishCategory) return true;
          return item.category !== undefined && item.productType !== 'product';
        }) as MenuItem[];
      setMenuItems(items);
    } catch (error) {
      console.error('Failed to load menu items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadIngredients = async (bidArg?: string) => {
    try {
      const bid = bidArg || (await resolveBusinessId());
      if (!bid) return;
      const docs = await fetchDocs(`businesses/${bid}/products`);
      const options = docs
        .map((data: any) => {
          const meta = data.metadata && typeof data.metadata === 'object' ? data.metadata : {};
          return {
            id: data.id,
            name: data.name || '',
            unit: data.ingredientUnit || meta.ingredientUnit || data.unit || 'Piece',
            unitCost: Number(data.cost ?? data.costPrice ?? data.unitCost ?? meta.unitCost ?? 0),
            stock: Number(data.stock ?? data.stockLevel ?? 0),
            productType: data.productType || meta.productType,
          };
        })
        .filter((item: any) => item.productType === 'ingredient') as IngredientOption[];
      setIngredientOptions(options);
    } catch (error) {
      console.error('Failed to load ingredients:', error);
    }
  };

  const calculatedCost = useMemo(() => {
    return recipeLines.reduce((sum, line) => sum + line.quantity * line.unitCost, 0);
  }, [recipeLines]);

  const addRecipeLine = () => {
    if (!pickIngredientId || !pickQuantity) {
      showToast('Select an ingredient and quantity');
      return;
    }
    const qty = parseFloat(pickQuantity);
    if (isNaN(qty) || qty <= 0) {
      showToast('Enter a valid quantity');
      return;
    }
    const ing = ingredientOptions.find((i) => i.id === pickIngredientId);
    if (!ing) return;
    if (recipeLines.some((l) => l.ingredientId === ing.id)) {
      showToast('Ingredient already in recipe — update quantity instead');
      return;
    }
    setRecipeLines([
      ...recipeLines,
      {
        ingredientId: ing.id,
        ingredientName: ing.name,
        quantity: qty,
        unit: ing.unit,
        unitCost: ing.unitCost,
      },
    ]);
    setPickIngredientId('');
    setPickQuantity('');
  };

  const removeRecipeLine = (ingredientId: string) => {
    setRecipeLines(recipeLines.filter((l) => l.ingredientId !== ingredientId));
  };

  const updateRecipeQty = (ingredientId: string, quantity: number) => {
    setRecipeLines(
      recipeLines.map((l) =>
        l.ingredientId === ingredientId ? { ...l, quantity: quantity > 0 ? quantity : l.quantity } : l
      )
    );
  };

  const handleSave = async () => {
    const bid = await resolveBusinessId();
    if (!bid) {
      showToast('Business not loaded — refresh and try again');
      return;
    }
    if (!formData.name.trim()) {
      showToast('Name is required');
      return;
    }
    if (!formData.category) {
      showToast('Category is required');
      return;
    }
    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      showToast('Enter a valid selling price');
      return;
    }
    setSaving(true);
    try {
      const path = `businesses/${bid}/products`;
      const cost = calculatedCost;
      const itemData: Record<string, unknown> = {
        name: formData.name.trim(),
        description: formData.description.trim() || '',
        category: formData.category,
        dishCategory: formData.category,
        price,
        sellingPrice: price,
        cost,
        costPrice: cost,
        preparationTime: parseInt(formData.preparationTime || '0', 10) || 0,
        ingredients: recipeLines.map((l) => l.ingredientName),
        recipeIngredients: recipeLines,
        productType: 'dish',
        active: formData.available,
        status: formData.available ? 'active' : 'inactive',
        stock: 999,
        stockLevel: 999,
        reorderLevel: 10,
        lowStockThreshold: 10,
        unit: 'portion',
        attributes: { emoji: '🍽️' },
        updatedAt: new Date().toISOString(),
      };
      if (editingItem) {
        await saveProductViaApi(bid, itemData, {
          mode: 'update',
          productId: editingItem.id,
        });
        showToast('Menu item updated');
      } else {
        const id = crypto.randomUUID();
        itemData.id = id;
        itemData.createdAt = new Date().toISOString();
        await saveProductViaApi(bid, itemData, { mode: 'insert' });
        showToast('Menu item added');
      }
      setShowAddModal(false);
      setEditingItem(null);
      resetForm();
      await loadMenuItems(bid);
      await loadIngredients(bid);
    } catch (error: any) {
      console.error('Failed to save menu item:', error);
      const msg = error?.message || error?.details || 'Failed to save menu item';
      showToast(String(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    const bid = await resolveBusinessId();
    if (!bid) {
      showToast('Business not loaded — refresh and try again');
      return;
    }
    setDeletingId(itemId);
    try {
      await deleteProductViaApi(bid, itemId);
      showToast('Menu item deleted successfully');
      await loadMenuItems(bid);
    } catch (error) {
      console.error('Failed to delete menu item:', error);
      showToast('Failed to delete menu item');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      category: item.category,
      price: item.price.toString(),
      preparationTime: item.preparationTime.toString(),
      available: item.available,
    });
    setRecipeLines(item.recipeIngredients?.length ? item.recipeIngredients : []);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      price: '',
      preparationTime: '',
      available: true,
    });
    setRecipeLines([]);
    setPickIngredientId('');
    setPickQuantity('');
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const calculateProfit = (item: MenuItem) => item.price - item.cost;
  const calculateMargin = (item: MenuItem) => {
    if (item.price === 0) return 0;
    return ((item.price - item.cost) / item.price) * 100;
  };

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <div className="text-center">
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Loading menu...</p>
        </div>
      </div>
    );
  }

  const sellingPrice = parseFloat(formData.price) || 0;
  const liveProfit = sellingPrice - calculatedCost;
  const liveMargin = sellingPrice > 0 ? (liveProfit / sellingPrice) * 100 : 0;

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Menu Management</h1>
          <p className={styles.pageDesc}>Build dishes with recipes and see true plate cost</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingItem(null);
            setShowAddModal(true);
          }}
          className={styles.addButton}
        >
          <Plus size={20} />
          Add Menu Item
        </button>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search menu items..."
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
          <option value="all">All Categories</option>
          {dishCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className={styles.menuGrid}>
        {filteredItems.map((item) => (
          <div key={item.id} className={styles.menuCard}>
            <div className={styles.menuCardHeader}>
              <div className={styles.menuCardInfo}>
                <h3 className={styles.menuCardName}>{item.name}</h3>
                <p className={styles.menuCardCategory}>{item.category}</p>
              </div>
              <div className={styles.menuCardActions}>
                <button onClick={() => handleEdit(item)} className={styles.actionButton} title="Edit">
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className={`${styles.actionButton} ${styles.danger}`}
                  title="Delete"
                  disabled={deletingId === item.id || saving}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            {item.description && <p className={styles.menuDescription}>{item.description}</p>}
            {item.recipeIngredients?.length > 0 && (
              <div className={styles.recipePreview}>
                <ChefHat size={14} />
                <span>
                  {item.recipeIngredients
                    .slice(0, 3)
                    .map((r) => `${r.quantity}${r.unit} ${r.ingredientName}`)
                    .join(' · ')}
                  {item.recipeIngredients.length > 3 ? ` +${item.recipeIngredients.length - 3}` : ''}
                </span>
              </div>
            )}
            <div className={styles.menuDetails}>
              <div className={styles.menuDetailRow}>
                <span className={styles.menuDetailLabel}>Price:</span>
                <span className={styles.menuDetailValue}>{formatMoney(item.price)}</span>
              </div>
              <div className={styles.menuDetailRow}>
                <span className={styles.menuDetailLabel}>Ingredient cost:</span>
                <span className={styles.menuDetailValue}>{formatMoney(item.cost)}</span>
              </div>
              <div className={styles.menuDetailRow}>
                <span className={styles.menuDetailLabel}>Profit:</span>
                <span className={`${styles.menuDetailValue} ${styles.profit}`}>
                  {formatMoney(calculateProfit(item))}
                </span>
              </div>
              <div className={styles.menuDetailRow}>
                <span className={styles.menuDetailLabel}>Margin:</span>
                <span className={`${styles.menuDetailValue} ${styles.margin}`}>
                  {calculateMargin(item).toFixed(1)}%
                </span>
              </div>
              <div className={styles.menuPrepTime}>
                <Clock size={14} />
                <span>{item.preparationTime} min prep</span>
              </div>
            </div>
            <div className={styles.menuStatus}>
              <span className={`${styles.statusBadge} ${item.available ? styles.available : styles.unavailable}`}>
                {item.available ? 'Available' : 'Unavailable'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className={styles.emptyState}>
          <p>No menu items found</p>
          <button
            onClick={() => {
              resetForm();
              setEditingItem(null);
              setShowAddModal(true);
            }}
            className={styles.emptyStateButton}
          >
            Add your first menu item
          </button>
        </div>
      )}

      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${styles.modalWide}`}>
            <h2 className={styles.modalTitle}>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={styles.formInput}
                  placeholder="e.g. Jollof Rice"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={styles.formTextarea}
                  rows={2}
                />
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={styles.formSelect}
                    required
                  >
                    <option value="">Select category</option>
                    {dishCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Prep time (minutes)</label>
                  <input
                    type="number"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                    className={styles.formInput}
                    min={0}
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Selling price</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className={styles.formInput}
                  min={0}
                  step="0.01"
                  required
                />
              </div>
              <div className={styles.recipeSection}>
                <div className={styles.recipeHeader}>
                  <ChefHat size={18} />
                  <span>Recipe (ingredients per portion)</span>
                </div>
                <p className={styles.recipeHint}>
                  Add ingredients used to prepare this dish. Cost is calculated from unit costs.
                </p>
                {ingredientOptions.length === 0 && (
                  <p className={styles.recipeWarn}>
                    No ingredients in stock yet. Add them under Ingredients first.
                  </p>
                )}
                <div className={styles.recipeAddRow}>
                  <select
                    value={pickIngredientId}
                    onChange={(e) => setPickIngredientId(e.target.value)}
                    className={styles.formSelect}
                  >
                    <option value="">Select ingredient</option>
                    {ingredientOptions.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.unit}) — {formatMoney(ing.unitCost)}/{ing.unit}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={pickQuantity}
                    onChange={(e) => setPickQuantity(e.target.value)}
                    className={styles.formInput}
                    placeholder="Qty"
                    min={0}
                    step="0.01"
                  />
                  <button type="button" onClick={addRecipeLine} className={styles.addLineButton}>
                    <Plus size={16} />
                  </button>
                </div>
                {recipeLines.length > 0 && (
                  <div className={styles.recipeLines}>
                    {recipeLines.map((line) => (
                      <div key={line.ingredientId} className={styles.recipeLine}>
                        <div className={styles.recipeLineInfo}>
                          <span className={styles.recipeLineName}>{line.ingredientName}</span>
                          <span className={styles.recipeLineMeta}>
                            {formatMoney(line.unitCost)}/{line.unit}
                          </span>
                        </div>
                        <div className={styles.recipeLineQty}>
                          <input
                            type="number"
                            value={line.quantity}
                            onChange={(e) =>
                              updateRecipeQty(line.ingredientId, parseFloat(e.target.value) || 0)
                            }
                            className={styles.qtyInput}
                            min={0}
                            step="0.01"
                          />
                          <span className={styles.unitLabel}>{line.unit}</span>
                          <span className={styles.lineCost}>
                            {formatMoney(line.quantity * line.unitCost)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeRecipeLine(line.ingredientId)}
                            className={styles.removeLineBtn}
                            title="Remove"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className={styles.costSummary}>
                  <div className={styles.costRow}>
                    <span>Ingredient cost / plate</span>
                    <strong>{formatMoney(calculatedCost)}</strong>
                  </div>
                  <div className={styles.costRow}>
                    <span>Selling price</span>
                    <strong>{formatMoney(sellingPrice)}</strong>
                  </div>
                  <div className={styles.costRow}>
                    <span>Profit / plate</span>
                    <strong className={liveProfit >= 0 ? styles.profit : styles.loss}>
                      {formatMoney(liveProfit)} ({liveMargin.toFixed(1)}%)
                    </strong>
                  </div>
                </div>
              </div>
              <div className={styles.formCheckbox}>
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.available}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  className={styles.formCheckboxInput}
                />
                <label htmlFor="available" className={styles.formCheckboxLabel}>
                  Available for ordering
                </label>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                onClick={() => {
                  if (saving) return;
                  setShowAddModal(false);
                  setEditingItem(null);
                  resetForm();
                }}
                className={`${styles.modalButton} ${styles.secondary}`}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className={`${styles.modalButton} ${styles.primary}`}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className={styles.spin} />
                    {editingItem ? 'Updating…' : 'Adding…'}
                  </>
                ) : editingItem ? (
                  'Update'
                ) : (
                  'Add menu item'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

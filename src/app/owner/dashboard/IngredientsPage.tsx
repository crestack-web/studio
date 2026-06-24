'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { checkFeatureAccess } from '@/lib/featureRestrictions';
import { Plus, Edit2, Trash2, Search, AlertTriangle, Package, Scale, TrendingUp } from 'lucide-react';
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
  lastRestocked?: Date;
  expiryDate?: Date;
  active: boolean;
  createdAt: Date;
}

interface Recipe {
  id: string;
  name: string;
  menuItemId: string;
  menuItemName: string;
  ingredients: Array<{
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: string;
  }>;
  createdAt: Date;
}

export default function IngredientsPage() {
  const { user, showToast } = useApp();
  const { formatMoney } = useCurrency();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: '',
    currentStock: '',
    minimumStock: '',
    unitCost: '',
    supplier: '',
    expiryDate: '',
    active: true,
  });

  // Check feature access
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

  // Load ingredients
  useEffect(() => {
    loadIngredients();
    loadRecipes();
  }, [user?.businessId]);

  const loadIngredients = async () => {
    try {
      if (!user?.businessId) return;
      
      const { firestore } = initializeFirebase();
      const productsCollection = collection(firestore, 'businesses', user.businessId, 'products');
      const snapshot = await getDocs(productsCollection);
      
      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          category: data.category,
          unit: data.ingredientUnit || data.unit,
          currentStock: data.stock || 0,
          minimumStock: data.reorderLevel || data.lowStockThreshold || 10,
          unitCost: data.cost || data.costPrice || 0,
          supplier: data.supplier,
          lastRestocked: data.createdAt?.toDate(),
          expiryDate: data.expiryDate?.toDate(),
          active: data.active !== false,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      }).filter((item: any) => item.category !== undefined) as Ingredient[];
      
      setIngredients(items);
    } catch (error) {
      console.error('Failed to load ingredients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecipes = async () => {
    try {
      if (!user?.businessId) return;
      
      const { firestore } = initializeFirebase();
      const recipesCollection = collection(firestore, 'businesses', user.businessId, 'recipes');
      const snapshot = await getDocs(recipesCollection);
      
      const recipeData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Recipe[];
      
      setRecipes(recipeData);
    } catch (error) {
      console.error('Failed to load recipes:', error);
    }
  };

  const handleSave = async () => {
    try {
      if (!user?.businessId) return;
      
      const { firestore } = initializeFirebase();
      const productsCollection = collection(firestore, 'businesses', user.businessId, 'products');
      
      const ingredientData = {
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        ingredientUnit: formData.unit,
        stock: parseFloat(formData.currentStock),
        currentStock: parseFloat(formData.currentStock),
        minimumStock: parseFloat(formData.minimumStock),
        reorderLevel: parseFloat(formData.minimumStock),
        lowStockThreshold: parseFloat(formData.minimumStock),
        unitCost: parseFloat(formData.unitCost),
        cost: parseFloat(formData.unitCost),
        costPrice: parseFloat(formData.unitCost),
        supplier: formData.supplier,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : null,
        active: formData.active,
        productType: 'ingredient',
        createdAt: editingIngredient ? editingIngredient.createdAt : new Date(),
        lastRestocked: new Date(),
        attributes: {
          emoji: '🥘',
        },
      };

      if (editingIngredient) {
        await updateDoc(doc(productsCollection, editingIngredient.id), ingredientData);
        showToast('Ingredient updated successfully');
      } else {
        await addDoc(productsCollection, ingredientData);
        showToast('Ingredient added successfully');
      }

      setShowAddModal(false);
      setEditingIngredient(null);
      resetForm();
      loadIngredients();
    } catch (error) {
      console.error('Failed to save ingredient:', error);
      showToast('Failed to save ingredient');
    }
  };

  const handleDelete = async (ingredientId: string) => {
    if (!confirm('Are you sure you want to delete this ingredient?')) return;
    
    try {
      if (!user?.businessId) return;
      
      const { firestore } = initializeFirebase();
      await deleteDoc(doc(firestore, 'businesses', user.businessId, 'products', ingredientId));
      
      showToast('Ingredient deleted successfully');
      loadIngredients();
    } catch (error) {
      console.error('Failed to delete ingredient:', error);
      showToast('Failed to delete ingredient');
    }
  };

  const handleRestock = async (ingredient: Ingredient) => {
    const quantity = prompt(`Enter restock quantity for ${ingredient.name}:`);
    if (!quantity) return;
    
    try {
      if (!user?.businessId) return;
      
      const { firestore } = initializeFirebase();
      await updateDoc(doc(firestore, 'businesses', user.businessId, 'products', ingredient.id), {
        stock: ingredient.currentStock + parseFloat(quantity),
        currentStock: ingredient.currentStock + parseFloat(quantity),
        lastRestocked: new Date(),
      });
      
      showToast('Ingredient restocked successfully');
      loadIngredients();
    } catch (error) {
      console.error('Failed to restock ingredient:', error);
      showToast('Failed to restock ingredient');
    }
  };

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      category: ingredient.category,
      unit: ingredient.unit,
      currentStock: ingredient.currentStock.toString(),
      minimumStock: ingredient.minimumStock.toString(),
      unitCost: ingredient.unitCost.toString(),
      supplier: ingredient.supplier || '',
      expiryDate: ingredient.expiryDate ? ingredient.expiryDate.toISOString().split('T')[0] : '',
      active: ingredient.active,
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      unit: '',
      currentStock: '',
      minimumStock: '',
      unitCost: '',
      supplier: '',
      expiryDate: '',
      active: true,
    });
  };

  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ingredient.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || ingredient.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getLowStockIngredients = () => {
    return ingredients.filter(ing => ing.currentStock <= ing.minimumStock);
  };

  const getExpiringSoonIngredients = () => {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    return ingredients.filter(ing => 
      ing.expiryDate && ing.expiryDate <= sevenDaysFromNow && ing.active
    );
  };

  const calculateTotalValue = () => {
    return ingredients.reduce((total, ing) => total + (ing.currentStock * ing.unitCost), 0);
  };

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

  const lowStockCount = getLowStockIngredients().length;
  const expiringSoonCount = getExpiringSoonIngredients().length;

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Ingredients Tracking</h1>
          <p className={styles.pageDesc}>Manage your kitchen ingredients and inventory</p>
        </div>
        <button
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

      {/* Summary Cards */}
      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <Package className={styles.summaryIcon} />
          <div>
            <p className={styles.summaryLabel}>Total Ingredients</p>
            <p className={styles.summaryValue}>{ingredients.length}</p>
          </div>
        </div>
        
        <div className={styles.summaryCard}>
          <Scale className={styles.summaryIcon} style={{ color: 'var(--green)' }} />
          <div>
            <p className={styles.summaryLabel}>Total Value</p>
            <p className={styles.summaryValue}>{formatMoney(calculateTotalValue())}</p>
          </div>
        </div>
        
        <div className={styles.summaryCard}>
          <AlertTriangle className={styles.summaryIcon} style={{ color: lowStockCount > 0 ? 'var(--red)' : 'var(--text-3)' }} />
          <div>
            <p className={styles.summaryLabel}>Low Stock</p>
            <p className={styles.summaryValue}>{lowStockCount}</p>
          </div>
        </div>
        
        <div className={styles.summaryCard}>
          <TrendingUp className={styles.summaryIcon} style={{ color: expiringSoonCount > 0 ? 'var(--amber)' : 'var(--text-3)' }} />
          <div>
            <p className={styles.summaryLabel}>Expiring Soon</p>
            <p className={styles.summaryValue}>{expiringSoonCount}</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(lowStockCount > 0 || expiringSoonCount > 0) && (
        <div className={styles.alerts}>
          <h3 className={styles.alertsTitle}>Alerts</h3>
          <div>
            {lowStockCount > 0 && (
              <p className={styles.alertItem}>• {lowStockCount} ingredients are below minimum stock level</p>
            )}
            {expiringSoonCount > 0 && (
              <p className={styles.alertItem}>• {expiringSoonCount} ingredients are expiring within 7 days</p>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
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
          <option value="all">All Categories</option>
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

      {/* Ingredients Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th className={styles.tableHeader}>Name</th>
              <th className={styles.tableHeader}>Category</th>
              <th className={styles.tableHeader}>Stock</th>
              <th className={styles.tableHeader}>Min Stock</th>
              <th className={styles.tableHeader}>Unit Cost</th>
              <th className={styles.tableHeader}>Expiry</th>
              <th className={styles.tableHeader}>Status</th>
              <th className={styles.tableHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredIngredients.map(ingredient => {
              const isLowStock = ingredient.currentStock <= ingredient.minimumStock;
              const isExpiringSoon = ingredient.expiryDate && ingredient.expiryDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
              const isExpired = ingredient.expiryDate && ingredient.expiryDate < new Date();
              
              return (
                <tr key={ingredient.id} className={styles.tableRow}>
                  <td className={styles.tableCell}>
                    <div className={styles.ingredientName}>{ingredient.name}</div>
                    <div className={styles.ingredientUnit}>{ingredient.unit}</div>
                  </td>
                  <td className={styles.tableCell}>{ingredient.category}</td>
                  <td className={styles.tableCell}>
                    <span className={`${styles.stockValue} ${isLowStock ? styles.low : ''}`}>
                      {ingredient.currentStock}
                    </span>
                  </td>
                  <td className={styles.tableCell}>{ingredient.minimumStock}</td>
                  <td className={styles.tableCell}>{formatMoney(ingredient.unitCost)}</td>
                  <td className={styles.tableCell}>
                    {ingredient.expiryDate ? (
                      <span className={`${styles.expiryDate} ${isExpired ? styles.expired : isExpiringSoon ? styles.expiring : ''}`}>
                        {ingredient.expiryDate.toLocaleDateString()}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className={styles.tableCell}>
                    <span className={`${styles.statusBadge} ${
                      !ingredient.active ? styles.inactive :
                      isExpired ? styles.expired :
                      isExpiringSoon ? styles.expiring :
                      isLowStock ? styles.lowStock :
                      styles.inStock
                    }`}>
                      {!ingredient.active ? 'Inactive' :
                       isExpired ? 'Expired' :
                       isExpiringSoon ? 'Expiring Soon' :
                       isLowStock ? 'Low Stock' :
                       'In Stock'}
                    </span>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.actionButtons}>
                      <button
                        onClick={() => handleRestock(ingredient)}
                        className={`${styles.actionButton} ${styles.primary}`}
                        title="Restock"
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(ingredient)}
                        className={styles.actionButton}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(ingredient.id)}
                        className={`${styles.actionButton} ${styles.danger}`}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredIngredients.length === 0 && (
          <div className={styles.emptyState}>
            <p>No ingredients found</p>
            <button
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
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>
              {editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}
            </h2>
            
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={styles.formInput}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={styles.formSelect}
                  required
                >
                  <option value="">Select category</option>
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
              
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Current Stock</label>
                  <input
                    type="number"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                    className={styles.formInput}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Minimum Stock</label>
                  <input
                    type="number"
                    value={formData.minimumStock}
                    onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
                    className={styles.formInput}
                    required
                  />
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Unit</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className={styles.formInput}
                  placeholder="e.g., kg, liters, pieces"
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Unit Cost</label>
                <input
                  type="number"
                  value={formData.unitCost}
                  onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                  className={styles.formInput}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Supplier</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className={styles.formInput}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className={styles.formInput}
                />
              </div>
              
              <div className={styles.formCheckbox}>
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className={styles.formCheckboxInput}
                />
                <label htmlFor="active" className={styles.formCheckboxLabel}>Active</label>
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingIngredient(null);
                  resetForm();
                }}
                className={`${styles.modalButton} ${styles.secondary}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className={`${styles.modalButton} ${styles.primary}`}
              >
                {editingIngredient ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

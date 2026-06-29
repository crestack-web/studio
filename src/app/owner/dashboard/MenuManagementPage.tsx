'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { checkFeatureAccess } from '@/lib/featureRestrictions';
import { Plus, Edit2, Trash2, Search, DollarSign, Clock } from 'lucide-react';
import styles from './MenuManagementPage.module.css';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  cost: number;
  preparationTime: number;
  ingredients: string[];
  available: boolean;
  imageUrl?: string;
  createdAt: Date;
}

interface MenuCategory {
  id: string;
  name: string;
  description?: string;
}

let firestoreInstance: ReturnType<typeof initializeFirebase>['firestore'] | null = null;

export default function MenuManagementPage() {
  const { user, showToast } = useApp();
  const { formatMoney } = useCurrency();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
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
    cost: '',
    preparationTime: '',
    ingredients: '',
    available: true,
  });

  // Check feature access
  useEffect(() => {
    const checkAccess = async () => {
      if (user?.id) {
        const hasAccess = await checkFeatureAccess(user.id, 'menu-management');
        if (!hasAccess.eligible) {
          showToast('This feature requires a Standard plan or higher');
        }
      }
    };
    checkAccess();
  }, [user]);

  // Load menu items
  useEffect(() => {
    loadMenuItems();
    loadCategories();
  }, [user?.businessId]);

  const loadMenuItems = async () => {
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
          description: data.description,
          category: data.dishCategory || data.category,
          price: data.price || data.sellingPrice,
          cost: data.cost || data.costPrice,
          preparationTime: data.preparationTime || 0,
          ingredients: data.ingredients || [],
          available: data.active !== false,
          imageUrl: data.imageUrl,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      }).filter((item: any) => item.category !== undefined) as MenuItem[];
      
      setMenuItems(items);
    } catch (error) {
      console.error('Failed to load menu items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      if (!user?.businessId) return;
      
      const { firestore } = initializeFirebase();
      const categoriesCollection = collection(firestore, 'businesses', user.businessId, 'menuCategories');
      const snapshot = await getDocs(categoriesCollection);
      
      const cats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as MenuCategory[];
      
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleSave = async () => {
    try {
      if (!user?.businessId) return;
      
      const { firestore } = initializeFirebase();
      const productsCollection = collection(firestore, 'businesses', user.businessId, 'products');
      
      const itemData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        dishCategory: formData.category,
        price: parseFloat(formData.price),
        sellingPrice: parseFloat(formData.price),
        cost: parseFloat(formData.cost),
        costPrice: parseFloat(formData.cost),
        preparationTime: parseInt(formData.preparationTime),
        ingredients: formData.ingredients.split(',').map(i => i.trim()).filter(i => i),
        productType: 'dish',
        active: formData.available,
        stock: 999,
        lowStockThreshold: 10,
        createdAt: editingItem ? editingItem.createdAt : new Date(),
        attributes: {
          emoji: '🍽️',
        },
      };

      if (editingItem) {
        await updateDoc(doc(productsCollection, editingItem.id), itemData);
        showToast('Menu item updated successfully');
      } else {
        await addDoc(productsCollection, itemData);
        showToast('Menu item added successfully');
      }

      setShowAddModal(false);
      setEditingItem(null);
      resetForm();
      loadMenuItems();
    } catch (error) {
      console.error('Failed to save menu item:', error);
      showToast('Failed to save menu item');
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    
    try {
      if (!user?.businessId) return;
      
      const { firestore } = initializeFirebase();
      await deleteDoc(doc(firestore, 'businesses', user.businessId, 'products', itemId));
      
      showToast('Menu item deleted successfully');
      loadMenuItems();
    } catch (error) {
      console.error('Failed to delete menu item:', error);
      showToast('Failed to delete menu item');
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      category: item.category,
      price: item.price.toString(),
      cost: item.cost.toString(),
      preparationTime: item.preparationTime.toString(),
      ingredients: item.ingredients.join(', '),
      available: item.available,
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      price: '',
      cost: '',
      preparationTime: '',
      ingredients: '',
      available: true,
    });
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const calculateProfit = (item: MenuItem) => {
    return item.price - item.cost;
  };

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

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Menu Management</h1>
          <p className={styles.pageDesc}>Manage your restaurant menu items</p>
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

      {/* Filters */}
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
          {categories.map(cat => (
            <option key={cat.id} value={cat.name}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Menu Items Grid */}
      <div className={styles.menuGrid}>
        {filteredItems.map(item => (
          <div key={item.id} className={styles.menuCard}>
            <div className={styles.menuCardHeader}>
              <div className={styles.menuCardInfo}>
                <h3 className={styles.menuCardName}>{item.name}</h3>
                <p className={styles.menuCardCategory}>{item.category}</p>
              </div>
              <div className={styles.menuCardActions}>
                <button
                  onClick={() => handleEdit(item)}
                  className={styles.actionButton}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className={`${styles.actionButton} ${styles.danger}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            {item.description && (
              <p className={styles.menuDescription}>{item.description}</p>
            )}
            
            <div className={styles.menuDetails}>
              <div className={styles.menuDetailRow}>
                <span className={styles.menuDetailLabel}>Price:</span>
                <span className={styles.menuDetailValue}>{formatMoney(item.price)}</span>
              </div>
              <div className={styles.menuDetailRow}>
                <span className={styles.menuDetailLabel}>Cost:</span>
                <span className={styles.menuDetailValue}>{formatMoney(item.cost)}</span>
              </div>
              <div className={styles.menuDetailRow}>
                <span className={styles.menuDetailLabel}>Profit:</span>
                <span className={`${styles.menuDetailValue} ${styles.profit}`}>{formatMoney(calculateProfit(item))}</span>
              </div>
              <div className={styles.menuDetailRow}>
                <span className={styles.menuDetailLabel}>Margin:</span>
                <span className={`${styles.menuDetailValue} ${styles.margin}`}>{calculateMargin(item).toFixed(1)}%</span>
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

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>
              {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
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
                <label className={styles.formLabel}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={styles.formTextarea}
                  rows={2}
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
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Price</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className={styles.formInput}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Cost</label>
                  <input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className={styles.formInput}
                    required
                  />
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Preparation Time (minutes)</label>
                <input
                  type="number"
                  value={formData.preparationTime}
                  onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                  className={styles.formInput}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Ingredients (comma-separated)</label>
                <textarea
                  value={formData.ingredients}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                  className={styles.formTextarea}
                  rows={2}
                  placeholder="e.g., Rice, Beans, Plantain"
                />
              </div>
              
              <div className={styles.formCheckbox}>
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.available}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  className={styles.formCheckboxInput}
                />
                <label htmlFor="available" className={styles.formCheckboxLabel}>Available for ordering</label>
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingItem(null);
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
                {editingItem ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


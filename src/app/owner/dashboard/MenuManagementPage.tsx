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
      const menuCollection = collection(firestore, 'businesses', user.businessId, 'menu');
      const snapshot = await getDocs(menuCollection);
      
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as MenuItem[];
      
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
      const menuCollection = collection(firestore, 'businesses', user.businessId, 'menu');
      
      const itemData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost),
        preparationTime: parseInt(formData.preparationTime),
        ingredients: formData.ingredients.split(',').map(i => i.trim()).filter(i => i),
        available: formData.available,
        createdAt: new Date(),
      };

      if (editingItem) {
        await updateDoc(doc(menuCollection, editingItem.id), itemData);
        showToast('Menu item updated successfully');
      } else {
        await addDoc(menuCollection, itemData);
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
      await deleteDoc(doc(firestore, 'businesses', user.businessId, 'menu', itemId));
      
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <p className="text-gray-600">Manage your restaurant menu items</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingItem(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Menu Item
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{item.name}</h3>
                <p className="text-sm text-gray-500">{item.category}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1 hover:bg-red-100 rounded text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            {item.description && (
              <p className="text-sm text-gray-600 mb-3">{item.description}</p>
            )}
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Price:</span>
                <span className="font-semibold">{formatMoney(item.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cost:</span>
                <span>{formatMoney(item.cost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Profit:</span>
                <span className="text-green-600 font-semibold">{formatMoney(calculateProfit(item))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Margin:</span>
                <span className="text-blue-600">{calculateMargin(item).toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Clock size={14} />
                <span>{item.preparationTime} min prep</span>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t">
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${
                item.available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {item.available ? 'Available' : 'Unavailable'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No menu items found</p>
          <button
            onClick={() => {
              resetForm();
              setEditingItem(null);
              setShowAddModal(true);
            }}
            className="mt-4 text-blue-600 hover:underline"
          >
            Add your first menu item
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cost</label>
                  <input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Preparation Time (minutes)</label>
                <input
                  type="number"
                  value={formData.preparationTime}
                  onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Ingredients (comma-separated)</label>
                <textarea
                  value={formData.ingredients}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                  placeholder="e.g., Rice, Beans, Plantain"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.available}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="available" className="text-sm">Available for ordering</label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingItem(null);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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

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
      const ingredientsCollection = collection(firestore, 'businesses', user.businessId, 'ingredients');
      const snapshot = await getDocs(ingredientsCollection);
      
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastRestocked: doc.data().lastRestocked?.toDate(),
        expiryDate: doc.data().expiryDate?.toDate(),
      })) as Ingredient[];
      
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
      const ingredientsCollection = collection(firestore, 'businesses', user.businessId, 'ingredients');
      
      const ingredientData = {
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        currentStock: parseFloat(formData.currentStock),
        minimumStock: parseFloat(formData.minimumStock),
        unitCost: parseFloat(formData.unitCost),
        supplier: formData.supplier,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : null,
        active: formData.active,
        createdAt: new Date(),
        lastRestocked: new Date(),
      };

      if (editingIngredient) {
        await updateDoc(doc(ingredientsCollection, editingIngredient.id), ingredientData);
        showToast('Ingredient updated successfully');
      } else {
        await addDoc(ingredientsCollection, ingredientData);
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
      await deleteDoc(doc(firestore, 'businesses', user.businessId, 'ingredients', ingredientId));
      
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
      await updateDoc(doc(firestore, 'businesses', user.businessId, 'ingredients', ingredient.id), {
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading ingredients...</p>
        </div>
      </div>
    );
  }

  const lowStockCount = getLowStockIngredients().length;
  const expiringSoonCount = getExpiringSoonIngredients().length;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Ingredients Tracking</h1>
          <p className="text-gray-600">Manage your kitchen ingredients and inventory</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingIngredient(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Ingredient
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-500">Total Ingredients</p>
              <p className="text-2xl font-bold">{ingredients.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <Scale className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-2xl font-bold">{formatMoney(calculateTotalValue())}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-8 h-8 ${lowStockCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            <div>
              <p className="text-sm text-gray-500">Low Stock</p>
              <p className="text-2xl font-bold">{lowStockCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className={`w-8 h-8 ${expiringSoonCount > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
            <div>
              <p className="text-sm text-gray-500">Expiring Soon</p>
              <p className="text-2xl font-bold">{expiringSoonCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(lowStockCount > 0 || expiringSoonCount > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-red-800 mb-2">Alerts</h3>
          <div className="space-y-1 text-sm text-red-700">
            {lowStockCount > 0 && (
              <p>• {lowStockCount} ingredients are below minimum stock level</p>
            )}
            {expiringSoonCount > 0 && (
              <p>• {expiringSoonCount} ingredients are expiring within 7 days</p>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search ingredients..."
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
      </div>

      {/* Ingredients Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Category</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Stock</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Min Stock</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Unit Cost</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Expiry</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredIngredients.map(ingredient => {
              const isLowStock = ingredient.currentStock <= ingredient.minimumStock;
              const isExpiringSoon = ingredient.expiryDate && ingredient.expiryDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
              const isExpired = ingredient.expiryDate && ingredient.expiryDate < new Date();
              
              return (
                <tr key={ingredient.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{ingredient.name}</div>
                    <div className="text-sm text-gray-500">{ingredient.unit}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">{ingredient.category}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${isLowStock ? 'text-red-600' : ''}`}>
                      {ingredient.currentStock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{ingredient.minimumStock}</td>
                  <td className="px-4 py-3 text-sm">{formatMoney(ingredient.unitCost)}</td>
                  <td className="px-4 py-3 text-sm">
                    {ingredient.expiryDate ? (
                      <span className={isExpired ? 'text-red-600' : isExpiringSoon ? 'text-orange-600' : ''}>
                        {ingredient.expiryDate.toLocaleDateString()}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${
                      !ingredient.active ? 'bg-gray-100 text-gray-700' :
                      isExpired ? 'bg-red-100 text-red-700' :
                      isExpiringSoon ? 'bg-orange-100 text-orange-700' :
                      isLowStock ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {!ingredient.active ? 'Inactive' :
                       isExpired ? 'Expired' :
                       isExpiringSoon ? 'Expiring Soon' :
                       isLowStock ? 'Low Stock' :
                       'In Stock'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRestock(ingredient)}
                        className="p-1 hover:bg-blue-100 rounded text-blue-600"
                        title="Restock"
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(ingredient)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(ingredient.id)}
                        className="p-1 hover:bg-red-100 rounded text-red-600"
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
          <div className="text-center py-12 text-gray-500">
            <p>No ingredients found</p>
            <button
              onClick={() => {
                resetForm();
                setEditingIngredient(null);
                setShowAddModal(true);
              }}
              className="mt-4 text-blue-600 hover:underline"
            >
              Add your first ingredient
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}
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
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
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
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Current Stock</label>
                  <input
                    type="number"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Minimum Stock</label>
                  <input
                    type="number"
                    value={formData.minimumStock}
                    onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Unit</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., kg, liters, pieces"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Unit Cost</label>
                <input
                  type="number"
                  value={formData.unitCost}
                  onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Supplier</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="active" className="text-sm">Active</label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingIngredient(null);
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
                {editingIngredient ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

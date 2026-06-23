'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
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
      
      const { firestore } = initializeFirebase();
      const productsCollection = collection(firestore, 'businesses', user.businessId, 'products');
      const snapshot = await getDocs(productsCollection);
      
      const now = new Date();
      const filterDate = new Date();
      filterDate.setDate(filterDate.getDate() + filterDays);
      
      const products = snapshot.docs
        .map(doc => {
          const data = doc.data();
          const expiryDate = data.expiryDate?.toDate();
          const daysUntilExpiry = expiryDate 
            ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : null;
          
          return {
            id: doc.id,
            name: data.name || 'Unknown',
            category: data.category || 'uncategorized',
            quantity: data.stock || 0,
            unit: data.unit || 'pieces',
            unitCost: data.cost || 0,
            totalValue: (data.stock || 0) * (data.cost || 0),
            expiryDate,
            daysUntilExpiry: daysUntilExpiry || 0,
            location: data.location || 'main-store',
            supplier: data.supplier,
          };
        })
        .filter(product => {
          const expiryDate = product.expiryDate;
          if (!expiryDate) return false;
          
          // Only include products expiring within the filter period
          return expiryDate <= filterDate && expiryDate >= now;
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
      
      const { firestore } = initializeFirebase();
      await updateDoc(doc(firestore, 'businesses', user.businessId, 'products', productId), {
        expiryDate: null,
        expiryAlertCleared: true,
        expiryAlertClearedAt: new Date(),
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
      
      const { firestore } = initializeFirebase();
      await updateDoc(doc(firestore, 'businesses', user.businessId, 'products', productId), {
        stock: 0,
        expiryDate: null,
        disposed: true,
        disposalReason: reason,
        disposedAt: new Date(),
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading expiry alerts...</p>
        </div>
      </div>
    );
  }

  const criticalCount = getCriticalCount();
  const expiredCount = getExpiredCount();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Expiry Alerts</h1>
          <p className="text-gray-600">Track products approaching expiry dates</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-500">Expiring Soon</p>
              <p className="text-2xl font-bold">{expiringProducts.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-8 h-8 ${criticalCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            <div>
              <p className="text-sm text-gray-500">Critical (≤3 days)</p>
              <p className="text-2xl font-bold">{criticalCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <TrendingDown className={`w-8 h-8 ${expiredCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            <div>
              <p className="text-sm text-gray-500">Already Expired</p>
              <p className="text-2xl font-bold">{expiredCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-500">Value at Risk</p>
              <p className="text-2xl font-bold">{formatMoney(calculateTotalValueAtRisk())}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {(criticalCount > 0 || expiredCount > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800">Immediate Action Required</h3>
              <p className="text-sm text-red-700">
                {expiredCount > 0 && `${expiredCount} products have expired. `}
                {criticalCount > 0 && `${criticalCount} products will expire within 3 days. `}
                Consider discounting or disposing these items immediately.
              </p>
            </div>
          </div>
          <button
            onClick={handleAskMO}
            disabled={isAskingMO}
            className="mt-3 w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            {isAskingMO ? 'Loading...' : 'Ask MO for Recommendations'}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterDays}
              onChange={(e) => setFilterDays(parseInt(e.target.value))}
              className="px-4 py-2 border rounded-lg"
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
            className="px-4 py-2 border rounded-lg"
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
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Locations</option>
            <option value="main-store">Main Store</option>
            <option value="back-store">Back Store</option>
            <option value="warehouse">Warehouse</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Product</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Category</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Quantity</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Value</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Expiry Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Days Left</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Location</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredProducts.map(product => {
              const status = getExpiryStatus(product.daysUntilExpiry);
              
              return (
                <tr key={product.id} className={`hover:bg-gray-50 ${
                  product.daysUntilExpiry <= 0 ? 'bg-red-50' :
                  product.daysUntilExpiry <= 3 ? 'bg-orange-50' :
                  product.daysUntilExpiry <= 7 ? 'bg-yellow-50' : ''
                }`}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{product.name}</div>
                    {product.supplier && (
                      <div className="text-sm text-gray-500">{product.supplier}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm capitalize">{product.category}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{product.quantity} {product.unit}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">{formatMoney(product.totalValue)}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {product.expiryDate.toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${
                      product.daysUntilExpiry <= 0 ? 'text-red-600' :
                      product.daysUntilExpiry <= 3 ? 'text-red-600' :
                      product.daysUntilExpiry <= 7 ? 'text-orange-600' :
                      'text-gray-600'
                    }`}>
                      {product.daysUntilExpiry <= 0 ? 'Expired' : `${product.daysUntilExpiry} days`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm capitalize">{product.location.replace('-', ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                      status.color === 'red' ? 'bg-red-100 text-red-700' :
                      status.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                      status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMarkAsSold(product.id)}
                        className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                        title="Mark as sold"
                      >
                        Sold
                      </button>
                      <button
                        onClick={() => handleDispose(product.id)}
                        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
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
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No expiring products found</p>
            <p className="text-sm">Products will appear here when they approach their expiry dates</p>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {expiringProducts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="font-semibold text-blue-800 mb-2">Recommendations</h3>
          <ul className="space-y-1 text-sm text-blue-700">
            <li>• Consider offering discounts on products expiring within 7 days</li>
            <li>• Bundle expiring products with popular items to increase sales</li>
            <li>• Review ordering patterns to reduce future expiry waste</li>
            <li>• Set up automatic reorder points for fast-moving items</li>
          </ul>
        </div>
      )}
    </div>
  );
}

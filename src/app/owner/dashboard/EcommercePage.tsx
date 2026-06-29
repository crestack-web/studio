'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { checkFeatureAccess } from '@/lib/featureRestrictions';
import { Plus, Edit2, Trash2, Search, ShoppingBag, Eye, TrendingUp, DollarSign, Package, Globe, ToggleLeft, ToggleRight } from 'lucide-react';
import styles from './EcommercePage.module.css';

interface StoreProduct {
  id: string;
  productId: string;
  productName: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  imageUrl?: string;
  category: string;
  stock: number;
  sku?: string;
  weight?: number;
  dimensions?: string;
  tags: string[];
  available: boolean;
  featured: boolean;
  createdAt: Date;
}

interface StoreOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shippingCost: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  createdAt: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  trackingNumber?: string;
}

let firestoreInstance: ReturnType<typeof initializeFirebase>['firestore'] | null = null;

export default function EcommercePage() {
  const { user, showToast } = useApp();
  const { formatMoney } = useCurrency();
  const { firestore } = React.useMemo(() => {
    if (!firestoreInstance) {
      const initialized = initializeFirebase();
      firestoreInstance = initialized.firestore;
    }
    return { firestore: firestoreInstance };
  }, []);
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    description: '',
    price: '',
    compareAtPrice: '',
    category: '',
    stock: '',
    sku: '',
    tags: '',
    available: true,
    featured: false,
  });

  // Check feature access
  useEffect(() => {
    const checkAccess = async () => {
      if (user?.id) {
        const hasAccess = await checkFeatureAccess(user.id, 'ecommerce-storefront');
        if (!hasAccess.eligible) {
          showToast('This feature requires a Pro plan or higher');
        }
      }
    };
    checkAccess();
  }, [user]);

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'products') {
      loadStoreProducts();
    } else {
      loadOrders();
    }
  }, [activeTab, user?.businessId]);

  const loadStoreProducts = async () => {
    try {
      if (!user?.businessId) return;
      
      const storeCollection = collection(firestore, 'businesses', user.businessId, 'storeProducts');
      const snapshot = await getDocs(storeCollection);
      
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as StoreProduct[];
      
      setStoreProducts(products);
    } catch (error) {
      console.error('Failed to load store products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      if (!user?.businessId) return;
      
      const ordersCollection = collection(firestore, 'businesses', user.businessId, 'storeOrders');
      const snapshot = await getDocs(ordersCollection);
      
      const orderData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        shippedAt: doc.data().shippedAt?.toDate(),
        deliveredAt: doc.data().deliveredAt?.toDate(),
      })) as StoreOrder[];
      
      // Sort by date (descending)
      orderData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setOrders(orderData);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProduct = async () => {
    try {
      if (!user?.businessId) return;
      
      const storeCollection = collection(firestore, 'businesses', user.businessId, 'storeProducts');
      
      const productData = {
        productId: formData.productId,
        productName: formData.productName,
        description: formData.description,
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
        category: formData.category,
        stock: parseInt(formData.stock),
        sku: formData.sku,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        available: formData.available,
        featured: formData.featured,
        createdAt: new Date(),
      };

      if (editingProduct) {
        await updateDoc(doc(storeCollection, editingProduct.id), productData);
        showToast('Product updated successfully');
      } else {
        await addDoc(storeCollection, productData);
        showToast('Product added to store successfully');
      }

      setShowAddModal(false);
      setEditingProduct(null);
      resetForm();
      loadStoreProducts();
    } catch (error) {
      console.error('Failed to save product:', error);
      showToast('Failed to save product');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to remove this product from your store?')) return;
    
    try {
      if (!user?.businessId) return;
      
      const { firestore } = initializeFirebase();
      await deleteDoc(doc(firestore, 'businesses', user.businessId, 'storeProducts', productId));
      
      showToast('Product removed successfully');
      loadStoreProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      showToast('Failed to delete product');
    }
  };

  const handleToggleAvailability = async (product: StoreProduct) => {
    try {
      if (!user?.businessId) return;
      
      const { firestore } = initializeFirebase();
      await updateDoc(doc(firestore, 'businesses', user.businessId, 'storeProducts', product.id), {
        available: !product.available,
      });
      
      showToast(`Product ${product.available ? 'hidden' : 'visible'} in store`);
      loadStoreProducts();
    } catch (error) {
      console.error('Failed to toggle availability:', error);
      showToast('Failed to update product');
    }
  };

  const handleEditProduct = (product: StoreProduct) => {
    setEditingProduct(product);
    setFormData({
      productId: product.productId,
      productName: product.productName,
      description: product.description || '',
      price: product.price.toString(),
      compareAtPrice: product.compareAtPrice?.toString() || '',
      category: product.category,
      stock: product.stock.toString(),
      sku: product.sku || '',
      tags: product.tags.join(', '),
      available: product.available,
      featured: product.featured,
    });
    setShowAddModal(true);
  };

  const handleOrderStatusChange = async (order: StoreOrder, newStatus: StoreOrder['status']) => {
    try {
      if (!user?.businessId) return;
      
      const { firestore } = initializeFirebase();
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'shipped') {
        updateData.shippedAt = new Date();
        const trackingNumber = prompt('Enter tracking number:');
        if (trackingNumber) {
          updateData.trackingNumber = trackingNumber;
        }
      }
      
      if (newStatus === 'delivered') {
        updateData.deliveredAt = new Date();
      }
      
      await updateDoc(doc(firestore, 'businesses', user.businessId, 'storeOrders', order.id), updateData);
      
      showToast(`Order status updated to ${newStatus}`);
      loadOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
      showToast('Failed to update order status');
    }
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      productName: '',
      description: '',
      price: '',
      compareAtPrice: '',
      category: '',
      stock: '',
      sku: '',
      tags: '',
      available: true,
      featured: false,
    });
  };

  const filteredProducts = storeProducts.filter(product => {
    return product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           product.category.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredOrders = orders.filter(order => {
    return order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
           order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const calculateTotalRevenue = () => {
    return orders
      .filter(o => o.status === 'delivered' && o.paymentStatus === 'paid')
      .reduce((total, order) => total + order.total, 0);
  };

  const getPendingOrdersCount = () => {
    return orders.filter(o => o.status === 'pending').length;
  };

  const getOutOfStockCount = () => {
    return storeProducts.filter(p => p.stock === 0 && p.available).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading e-commerce data...</p>
        </div>
      </div>
    );
  }

  const pendingOrdersCount = getPendingOrdersCount();
  const outOfStockCount = getOutOfStockCount();
  const totalRevenue = calculateTotalRevenue();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">E-commerce Storefront</h1>
          <p className="text-gray-600">Manage your online store and orders</p>
        </div>
        {activeTab === 'products' && (
          <button
            onClick={() => {
              resetForm();
              setEditingProduct(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Add Product to Store
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-500">Store Products</p>
              <p className="text-2xl font-bold">{storeProducts.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <Package className={`w-8 h-8 ${outOfStockCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            <div>
              <p className="text-sm text-gray-500">Out of Stock</p>
              <p className="text-2xl font-bold">{outOfStockCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold">{formatMoney(totalRevenue)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <Eye className={`w-8 h-8 ${pendingOrdersCount > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
            <div>
              <p className="text-sm text-gray-500">Pending Orders</p>
              <p className="text-2xl font-bold">{pendingOrdersCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'products' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Products
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'orders' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Orders
        </button>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <>
          {/* Search */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{product.productName}</h3>
                      {product.featured && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Featured</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleAvailability(product)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title={product.available ? 'Hide from store' : 'Show in store'}
                    >
                      {product.available ? <ToggleRight size={16} className="text-green-600" /> : <ToggleLeft size={16} className="text-gray-400" />}
                    </button>
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-1 hover:bg-red-100 rounded text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {product.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                )}
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Price:</span>
                    <span className="font-semibold">{formatMoney(product.price)}</span>
                  </div>
                  {product.compareAtPrice && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 line-through">{formatMoney(product.compareAtPrice)}</span>
                      <span className="text-red-600">Save {Math.round((1 - product.price / product.compareAtPrice) * 100)}%</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Stock:</span>
                    <span className={product.stock === 0 ? 'text-red-600 font-medium' : ''}>
                      {product.stock} {product.stock === 0 ? '(Out of stock)' : ''}
                    </span>
                  </div>
                  {product.sku && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">SKU:</span>
                      <span>{product.sku}</span>
                    </div>
                  )}
                </div>
                
                {product.tags.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex flex-wrap gap-1">
                      {product.tags.map((tag, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No products in your store</p>
              <button
                onClick={() => {
                  resetForm();
                  setEditingProduct(null);
                  setShowAddModal(true);
                }}
                className="mt-4 text-blue-600 hover:underline"
              >
                Add your first product
              </button>
            </div>
          )}
        </>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <>
          {/* Search */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Order #</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Items</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Total</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Payment</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-sm text-gray-500">{order.customerEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">{order.items.length} items</td>
                    <td className="px-4 py-3 font-semibold">{formatMoney(order.total)}</td>
                    <td className="px-4 py-3 text-sm">{order.createdAt.toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                        order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                        order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleOrderStatusChange(order, 'processing')}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Process
                          </button>
                        )}
                        {order.status === 'processing' && (
                          <button
                            onClick={() => handleOrderStatusChange(order, 'shipped')}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Ship
                          </button>
                        )}
                        {order.status === 'shipped' && (
                          <button
                            onClick={() => handleOrderStatusChange(order, 'delivered')}
                            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            Deliver
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredOrders.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No orders found</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add/Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? 'Edit Store Product' : 'Add Product to Store'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product ID (from inventory)</label>
                <input
                  type="text"
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Link to existing product"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Display Name</label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
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
                  rows={3}
                />
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
                  <label className="block text-sm font-medium mb-1">Compare At Price</label>
                  <input
                    type="number"
                    value={formData.compareAtPrice}
                    onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Original price"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Stock</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., new, sale, featured"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Available in store</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Featured product</span>
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProduct(null);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingProduct ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { checkFeatureAccess } from '@/lib/featureRestrictions';
import { Plus, Edit2, Trash2, Search, Factory, Package, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import styles from './ProductionPage.module.css';

interface ProductionOrder {
  id: string;
  orderNumber: string;
  productName: string;
  productId?: string;
  quantity: number;
  unit: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  startDate?: Date;
  targetDate: Date;
  completedDate?: Date;
  assignedTo?: string;
  assignedToName?: string;
  materials: Array<{
    materialId: string;
    materialName: string;
    quantity: number;
    unit: string;
    cost: number;
  }>;
  totalMaterialCost: number;
  estimatedLaborCost: number;
  totalCost: number;
  notes?: string;
  createdAt: Date;
}

interface Material {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  unitCost: number;
}

let firestoreInstance: ReturnType<typeof initializeFirebase>['firestore'] | null = null;

export default function ProductionPage() {
  const { user, showToast } = useApp();
  const { formatMoney } = useCurrency();
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ProductionOrder | null>(null);
  const [formData, setFormData] = useState({
    productName: '',
    quantity: '',
    unit: '',
    targetDate: '',
    priority: 'medium',
    assignedTo: '',
    notes: '',
  });

  // Check feature access
  useEffect(() => {
    const checkAccess = async () => {
      if (user?.id) {
        const hasAccess = await checkFeatureAccess(user.id, 'production-tracking');
        if (!hasAccess.eligible) {
          showToast('This feature requires a Pro plan or higher');
        }
      }
    };
    checkAccess();
  }, [user]);

  // Load production orders
  useEffect(() => {
    loadProductionOrders();
    loadMaterials();
  }, [user?.businessId]);

  const loadProductionOrders = async () => {
    try {
      if (!user?.businessId) return;
      
      const { firestore } = initializeFirebase();
      const ordersCollection = collection(firestore, 'businesses', user.businessId, 'productionOrders');
      const snapshot = await getDocs(ordersCollection);
      
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        startDate: doc.data().startDate?.toDate(),
        targetDate: doc.data().targetDate?.toDate(),
        completedDate: doc.data().completedDate?.toDate(),
      })) as ProductionOrder[];
      
      // Sort by target date (ascending)
      orders.sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime());
      
      setProductionOrders(orders);
    } catch (error) {
      console.error('Failed to load production orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMaterials = async () => {
    try {
      if (!user?.businessId) return;
      
      const { firestore } = initializeFirebase();
      const materialsCollection = collection(firestore, 'businesses', user.businessId, 'materials');
      const snapshot = await getDocs(materialsCollection);
      
      const mats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Material[];
      
      setMaterials(mats);
    } catch (error) {
      console.error('Failed to load materials:', error);
    }
  };

  const handleSave = async () => {
    try {
      if (!user?.businessId) return;
      
      const { firestore } = initializeFirebase();
      const ordersCollection = collection(firestore, 'businesses', user.businessId, 'productionOrders');
      
      const orderData = {
        orderNumber: `PROD-${Date.now().toString().slice(-6)}`,
        productName: formData.productName,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        status: 'pending',
        priority: formData.priority,
        targetDate: new Date(formData.targetDate),
        assignedTo: formData.assignedTo,
        notes: formData.notes,
        materials: [],
        totalMaterialCost: 0,
        estimatedLaborCost: 0,
        totalCost: 0,
        createdAt: new Date(),
      };

      if (editingOrder) {
        await updateDoc(doc(ordersCollection, editingOrder.id), orderData);
        showToast('Production order updated successfully');
      } else {
        await addDoc(ordersCollection, orderData);
        showToast('Production order created successfully');
      }

      setShowAddModal(false);
      setEditingOrder(null);
      resetForm();
      loadProductionOrders();
    } catch (error) {
      console.error('Failed to save production order:', error);
      showToast('Failed to save production order');
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this production order?')) return;
    
    try {
      if (!user?.businessId) return;
      
      const { firestore } = initializeFirebase();
      await deleteDoc(doc(firestore, 'businesses', user.businessId, 'productionOrders', orderId));
      
      showToast('Production order deleted successfully');
      loadProductionOrders();
    } catch (error) {
      console.error('Failed to delete production order:', error);
      showToast('Failed to delete production order');
    }
  };

  const handleStatusChange = async (order: ProductionOrder, newStatus: ProductionOrder['status']) => {
    try {
      if (!user?.businessId) return;
      
      const { firestore } = initializeFirebase();
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'in-progress' && !order.startDate) {
        updateData.startDate = new Date();
      }
      
      if (newStatus === 'completed') {
        updateData.completedDate = new Date();
      }
      
      await updateDoc(doc(firestore, 'businesses', user.businessId, 'productionOrders', order.id), updateData);
      
      showToast(`Order status updated to ${newStatus}`);
      loadProductionOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
      showToast('Failed to update order status');
    }
  };

  const handleEdit = (order: ProductionOrder) => {
    setEditingOrder(order);
    setFormData({
      productName: order.productName,
      quantity: order.quantity.toString(),
      unit: order.unit,
      targetDate: order.targetDate.toISOString().split('T')[0],
      priority: order.priority,
      assignedTo: order.assignedTo || '',
      notes: order.notes || '',
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      productName: '',
      quantity: '',
      unit: '',
      targetDate: '',
      priority: 'medium',
      assignedTo: '',
      notes: '',
    });
  };

  const filteredOrders = productionOrders.filter(order => {
    const matchesSearch = order.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || order.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: ProductionOrder['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: ProductionOrder['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-orange-100 text-orange-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getOverdueCount = () => {
    const now = new Date();
    return productionOrders.filter(order => 
      order.status !== 'completed' && 
      order.status !== 'cancelled' && 
      order.targetDate < now
    ).length;
  };

  const getInProgressCount = () => {
    return productionOrders.filter(order => order.status === 'in-progress').length;
  };

  const getPendingCount = () => {
    return productionOrders.filter(order => order.status === 'pending').length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading production orders...</p>
        </div>
      </div>
    );
  }

  const overdueCount = getOverdueCount();
  const inProgressCount = getInProgressCount();
  const pendingCount = getPendingCount();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Production Tracking</h1>
          <p className="text-gray-600">Manage manufacturing production orders</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingOrder(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          New Production Order
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <Factory className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold">{productionOrders.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <Clock className={`w-8 h-8 ${pendingCount > 0 ? 'text-yellow-600' : 'text-gray-400'}`} />
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className={`w-8 h-8 ${inProgressCount > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-2xl font-bold">{inProgressCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className={`w-8 h-8 ${overdueCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            <div>
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-2xl font-bold">{overdueCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Alert */}
      {overdueCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-800">Overdue Orders</h3>
              <p className="text-sm text-red-700">
                {overdueCount} production orders are overdue. Please review and update their status.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Production Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Order #</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Product</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Quantity</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Target Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Priority</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Assigned To</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredOrders.map(order => {
              const isOverdue = order.status !== 'completed' && 
                              order.status !== 'cancelled' && 
                              order.targetDate < new Date();
              
              return (
                <tr key={order.id} className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{order.productName}</div>
                    <div className="text-sm text-gray-500">{order.unit}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{order.quantity}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className={`flex items-center gap-2 ${isOverdue ? 'text-red-600' : ''}`}>
                      <Clock className="w-4 h-4" />
                      {order.targetDate.toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${getPriorityColor(order.priority)}`}>
                      {order.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{order.assignedToName || order.assignedTo || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(order, 'in-progress')}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          title="Start production"
                        >
                          Start
                        </button>
                      )}
                      {order.status === 'in-progress' && (
                        <button
                          onClick={() => handleStatusChange(order, 'completed')}
                          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                          title="Complete"
                        >
                          Complete
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(order)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
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
        
        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Factory className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No production orders found</p>
            <button
              onClick={() => {
                resetForm();
                setEditingOrder(null);
                setShowAddModal(true);
              }}
              className="mt-4 text-blue-600 hover:underline"
            >
              Create your first production order
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingOrder ? 'Edit Production Order' : 'New Production Order'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name</label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unit</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., pieces, kg, liters"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Target Date</label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Assigned To</label>
                <input
                  type="text"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Staff name or ID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Additional instructions or notes..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingOrder(null);
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
                {editingOrder ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { initializeFirebase } from '@/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { checkFeatureAccess } from '@/lib/featureRestrictions';
import { Plus, Edit2, Trash2, Search, Factory, Package, TrendingUp, Clock, AlertCircle, DollarSign, X } from 'lucide-react';
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
  actualYield?: number;
  yieldPercentage?: number;
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
    materials: [] as Array<{ materialId: string; materialName: string; quantity: number; unit: string; cost: number }>,
    estimatedLaborCost: '',
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
        materials: formData.materials,
        totalMaterialCost: formData.materials.reduce((sum, m) => sum + (m.quantity * m.cost), 0),
        estimatedLaborCost: parseFloat(formData.estimatedLaborCost) || 0,
        totalCost: formData.materials.reduce((sum, m) => sum + (m.quantity * m.cost), 0) + (parseFloat(formData.estimatedLaborCost) || 0),
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
      materials: order.materials || [],
      estimatedLaborCost: order.estimatedLaborCost?.toString() || '',
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
      materials: [],
      estimatedLaborCost: '',
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
      <div className={styles.page}>
        <div className="text-center">
          <div className={styles.spinner}></div>
          <p>Loading production orders...</p>
        </div>
      </div>
    );
  }

  const overdueCount = getOverdueCount();
  const inProgressCount = getInProgressCount();
  const pendingCount = getPendingCount();

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.heading}>Production Tracking</h1>
          <p className={styles.sub}>Manage manufacturing production orders</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingOrder(null);
            setShowAddModal(true);
          }}
          className={styles.primaryButton}
        >
          <Plus size={20} />
          New Production Order
        </button>
      </div>

      {/* Summary Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Factory size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Active Orders</p>
            <p className={styles.statValue}>{productionOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <DollarSign size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Total Cost</p>
            <p className={styles.statValue}>{formatMoney(productionOrders.reduce((sum, o) => sum + o.totalCost, 0))}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Avg Yield</p>
            <p className={styles.statValue}>
              {productionOrders.filter(o => o.yieldPercentage).length > 0 
                ? (productionOrders.filter(o => o.yieldPercentage).reduce((sum, o) => sum + (o.yieldPercentage || 0), 0) / productionOrders.filter(o => o.yieldPercentage).length).toFixed(1) + '%'
                : '-'}
            </p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Package size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Total Units</p>
            <p className={styles.statValue}>{productionOrders.reduce((sum, o) => sum + o.quantity, 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Overdue Alert */}
      {overdueCount > 0 && (
        <div className={`${styles.alertBox} ${styles.warning}`}>
          <AlertCircle className={styles.alertIcon} size={24} />
          <div className={styles.alertContent}>
            <h3>Overdue Orders</h3>
            <p>
              {overdueCount} production orders are overdue. Please review and update their status.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={styles.section}>
        <div className={styles.filters}>
          <div className={`${styles.filterGroup} ${styles.inputWithIcon}`}>
            <Search className={styles.inputIcon} size={16} />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.filterInput}
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={styles.filterSelect}
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
            className={styles.filterSelect}
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Production Orders Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Target Date</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Total Cost</th>
              <th>Yield</th>
              <th>Assigned To</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => {
              const isOverdue = order.status !== 'completed' && 
                              order.status !== 'cancelled' && 
                              order.targetDate < new Date();
              
              return (
                <tr key={order.id} className={isOverdue ? styles.overdue : ''}>
                  <td>{order.orderNumber}</td>
                  <td>
                    <div className="font-medium">{order.productName}</div>
                    <div className="text-sm text-gray-500">{order.unit}</div>
                  </td>
                  <td>
                    <span className="font-medium">{order.quantity}</span>
                  </td>
                  <td>
                    <div className={`flex items-center gap-2 ${isOverdue ? 'text-red-600' : ''}`}>
                      <Clock size={16} />
                      {order.targetDate.toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles[order.priority]}`}>
                      {order.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles[order.status.replace('-', '')]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="font-medium">{formatMoney(order.totalCost)}</td>
                  <td>
                    {order.yieldPercentage ? (
                      <span className={`font-medium ${order.yieldPercentage >= 90 ? 'text-green-600' : order.yieldPercentage >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {order.yieldPercentage.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td>{order.assignedToName || order.assignedTo || '-'}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(order, 'in-progress')}
                          className={`${styles.iconButton} ${styles.iconButtonStart}`}
                          title="Start production"
                        >
                          Start
                        </button>
                      )}
                      {order.status === 'in-progress' && (
                        <button
                          onClick={() => handleStatusChange(order, 'completed')}
                          className={`${styles.iconButton} ${styles.iconButtonComplete}`}
                          title="Complete"
                        >
                          Complete
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(order)}
                        className={`${styles.iconButton} ${styles.iconButtonEdit}`}
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
                        className={`${styles.iconButton} ${styles.iconButtonDelete}`}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredOrders.length === 0 && (
          <div className={styles.emptyState}>
            <Factory size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No production orders found</p>
            <p className="text-sm">Create your first production order to get started</p>
            <button
              onClick={() => {
                resetForm();
                setEditingOrder(null);
                setShowAddModal(true);
              }}
              className="mt-4 text-purple-600 hover:underline"
            >
              Create your first production order
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingOrder ? 'Edit Production Order' : 'New Production Order'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingOrder(null);
                  resetForm();
                }}
                className={styles.closeButton}
              >
                <X size={18} />
              </button>
            </div>
            
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Product Name</label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  className={styles.formInput}
                  required
                />
              </div>
              
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className={styles.formInput}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Unit</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className={styles.formInput}
                    placeholder="e.g., pieces, kg, liters"
                    required
                  />
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Target Date</label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  className={styles.formInput}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className={styles.formSelect}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Assigned To</label>
                <input
                  type="text"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className={styles.formInput}
                  placeholder="Staff name or ID"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className={styles.formTextarea}
                  rows={3}
                  placeholder="Additional instructions or notes..."
                />
              </div>

              {/* Bill of Materials */}
              <div className={styles.materialsSection}>
                <div className={styles.materialsHeader}>
                  <label className={styles.formLabel}>Bill of Materials</label>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        materials: [...formData.materials, { materialId: '', materialName: '', quantity: 0, unit: '', cost: 0 }]
                      });
                    }}
                    className={styles.addMaterialButton}
                  >
                    + Add Material
                  </button>
                </div>
                
                {formData.materials.map((material, index) => (
                  <div key={index} className={styles.materialRow}>
                    <input
                      type="text"
                      placeholder="Material name"
                      value={material.materialName}
                      onChange={(e) => {
                        const newMaterials = [...formData.materials];
                        newMaterials[index].materialName = e.target.value;
                        setFormData({ ...formData, materials: newMaterials });
                      }}
                      className={styles.formInput}
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={material.quantity || ''}
                      onChange={(e) => {
                        const newMaterials = [...formData.materials];
                        newMaterials[index].quantity = parseFloat(e.target.value) || 0;
                        setFormData({ ...formData, materials: newMaterials });
                      }}
                      className={styles.formInput}
                    />
                    <input
                      type="text"
                      placeholder="Unit"
                      value={material.unit}
                      onChange={(e) => {
                        const newMaterials = [...formData.materials];
                        newMaterials[index].unit = e.target.value;
                        setFormData({ ...formData, materials: newMaterials });
                      }}
                      className={styles.formInput}
                    />
                    <input
                      type="number"
                      placeholder="Cost"
                      value={material.cost || ''}
                      onChange={(e) => {
                        const newMaterials = [...formData.materials];
                        newMaterials[index].cost = parseFloat(e.target.value) || 0;
                        setFormData({ ...formData, materials: newMaterials });
                      }}
                      className={styles.formInput}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newMaterials = formData.materials.filter((_, i) => i !== index);
                        setFormData({ ...formData, materials: newMaterials });
                      }}
                      className={styles.removeMaterialButton}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                
                {formData.materials.length > 0 && (
                  <div className={styles.materialsSummary}>
                    <span>Total Material Cost:</span>
                    <span className="font-medium">{formatMoney(formData.materials.reduce((sum, m) => sum + (m.quantity * m.cost), 0))}</span>
                  </div>
                )}
              </div>

              {/* Labor Cost */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Estimated Labor Cost</label>
                <div className={`${styles.inputWithIcon}`}>
                  <DollarSign className={styles.inputIcon} size={16} />
                  <input
                    type="number"
                    value={formData.estimatedLaborCost}
                    onChange={(e) => setFormData({ ...formData, estimatedLaborCost: e.target.value })}
                    className={styles.formInput}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Total Cost Summary */}
              {formData.materials.length > 0 || formData.estimatedLaborCost && (
                <div className={styles.costSummary}>
                  <div className={styles.costSummaryRow}>
                    <span className={styles.costSummaryLabel}>Total Production Cost:</span>
                    <span className={styles.costSummaryValue}>
                      {formatMoney(
                        formData.materials.reduce((sum, m) => sum + (m.quantity * m.cost), 0) + 
                        (parseFloat(formData.estimatedLaborCost) || 0)
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className={styles.modalActions}>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingOrder(null);
                  resetForm();
                }}
                className={styles.modalButton}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className={styles.modalButtonPrimary}
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


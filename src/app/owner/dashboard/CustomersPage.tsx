'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { checkFeatureAccess } from '@/lib/featureRestrictions';
import { Plus, Edit2, Trash2, Search, Users, DollarSign, TrendingUp, Phone, Mail, MapPin, Calendar, Filter } from 'lucide-react';
import styles from './CustomersPage.module.css';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  totalPurchases: number;
  totalSpent: number;
  lastPurchaseDate?: Date;
  lastPurchaseAmount?: number;
  creditBalance: number;
  loyaltyPoints?: number;
  notes?: string;
  active: boolean;
  createdAt: Date;
}

interface CustomerTransaction {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  type: 'purchase' | 'payment' | 'credit';
  description?: string;
  createdAt: Date;
}

export default function CustomersPage() {
  const { user, showToast } = useApp();
  const { formatMoney } = useCurrency();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'spent' | 'purchases' | 'recent'>('recent');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    notes: '',
  });

  // Check feature access
  useEffect(() => {
    const checkAccess = async () => {
      if (user?.id) {
        const hasAccess = await checkFeatureAccess(user.id, 'customer-management');
        if (!hasAccess.eligible) {
          showToast('This feature requires a Standard plan or higher');
        }
      }
    };
    checkAccess();
  }, [user]);

  // Load customers
  useEffect(() => {
    loadCustomers();
  }, [user?.businessId]);

  const loadCustomers = async () => {
    try {
      if (!user?.businessId) return;
      
      const { firestore } = initializeFirebase();
      const customersCollection = collection(firestore, 'businesses', user.businessId, 'customers');
      const snapshot = await getDocs(customersCollection);
      
      const customerData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastPurchaseDate: doc.data().lastPurchaseDate?.toDate(),
      })) as Customer[];
      
      // Sort based on selected sort option
      sortCustomers(customerData);
      
      setCustomers(customerData);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sortCustomers = (customerList: Customer[]) => {
    switch (sortBy) {
      case 'name':
        customerList.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'spent':
        customerList.sort((a, b) => b.totalSpent - a.totalSpent);
        break;
      case 'purchases':
        customerList.sort((a, b) => b.totalPurchases - a.totalPurchases);
        break;
      case 'recent':
      default:
        customerList.sort((a, b) => {
          const dateA = a.lastPurchaseDate || a.createdAt;
          const dateB = b.lastPurchaseDate || b.createdAt;
          return dateB.getTime() - dateA.getTime();
        });
        break;
    }
  };

  const loadCustomerTransactions = async (customerId: string) => {
    try {
      if (!user?.businessId) return;
      
      const { firestore } = initializeFirebase();
      const transactionsCollection = collection(firestore, 'businesses', user.businessId, 'customerTransactions');
      const q = query(transactionsCollection, where('customerId', '==', customerId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const transactionData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as CustomerTransaction[];
      
      setTransactions(transactionData);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const handleSave = async () => {
    try {
      if (!user?.businessId) return;
      
      const { firestore } = initializeFirebase();
      const customersCollection = collection(firestore, 'businesses', user.businessId, 'customers');
      
      const customerData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        notes: formData.notes,
        totalPurchases: 0,
        totalSpent: 0,
        creditBalance: 0,
        loyaltyPoints: 0,
        active: true,
        createdAt: new Date(),
      };

      if (editingCustomer) {
        await updateDoc(doc(customersCollection, editingCustomer.id), customerData);
        showToast('Customer updated successfully');
      } else {
        await addDoc(customersCollection, customerData);
        showToast('Customer added successfully');
      }

      setShowAddModal(false);
      setEditingCustomer(null);
      resetForm();
      loadCustomers();
    } catch (error) {
      console.error('Failed to save customer:', error);
      showToast('Failed to save customer');
    }
  };

  const handleDelete = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      if (!user?.businessId) return;
      
      const { firestore } = initializeFirebase();
      await deleteDoc(doc(firestore, 'businesses', user.businessId, 'customers', customerId));
      
      showToast('Customer deleted successfully');
      loadCustomers();
    } catch (error) {
      console.error('Failed to delete customer:', error);
      showToast('Failed to delete customer');
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      notes: customer.notes || '',
    });
    setShowAddModal(true);
  };

  const handleViewTransactions = (customer: Customer) => {
    setSelectedCustomer(customer);
    loadCustomerTransactions(customer.id);
    setShowTransactionsModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      notes: '',
    });
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.phone?.includes(searchQuery);
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && customer.active) ||
                         (filterStatus === 'inactive' && !customer.active);
    return matchesSearch && matchesStatus;
  });

  const calculateTotalRevenue = () => {
    return customers.reduce((total, customer) => total + customer.totalSpent, 0);
  };

  const calculateTotalCredit = () => {
    return customers.reduce((total, customer) => total + customer.creditBalance, 0);
  };

  const getTopCustomers = () => {
    return [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading customers...</p>
        </div>
      </div>
    );
  }

  const totalRevenue = calculateTotalRevenue();
  const totalCredit = calculateTotalCredit();
  const topCustomers = getTopCustomers();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Customer Management</h1>
          <p className="text-gray-600">Manage your customer relationships and history</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingCustomer(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Customer
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-500">Total Customers</p>
              <p className="text-2xl font-bold">{customers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold">{formatMoney(totalRevenue)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-500">Avg. Spend</p>
              <p className="text-2xl font-bold">
                {customers.length > 0 ? formatMoney(totalRevenue / customers.length) : formatMoney(0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <DollarSign className={`w-8 h-8 ${totalCredit > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
            <div>
              <p className="text-sm text-gray-500">Total Credit</p>
              <p className="text-2xl font-bold">{formatMoney(totalCredit)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Customers */}
      {topCustomers.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="font-semibold mb-3">Top Customers by Spend</h3>
          <div className="space-y-2">
            {topCustomers.map((customer, idx) => (
              <div key={customer.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500">#{idx + 1}</span>
                  <span className="font-medium">{customer.name}</span>
                </div>
                <span className="font-semibold text-green-600">{formatMoney(customer.totalSpent)}</span>
              </div>
            ))}
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
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as any);
              const sorted = [...customers];
              sortCustomers(sorted);
              setCustomers(sorted);
            }}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="recent">Most Recent</option>
            <option value="name">Name A-Z</option>
            <option value="spent">Highest Spent</option>
            <option value="purchases">Most Purchases</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Customer</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Contact</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Total Spent</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Purchases</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Credit Balance</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Last Purchase</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredCustomers.map(customer => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{customer.name}</div>
                  {customer.city && (
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin size={12} />
                      {customer.city}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1 text-sm">
                    {customer.email && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Mail size={12} />
                        {customer.email}
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Phone size={12} />
                        {customer.phone}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold text-green-600">{formatMoney(customer.totalSpent)}</td>
                <td className="px-4 py-3 text-sm">{customer.totalPurchases}</td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${customer.creditBalance > 0 ? 'text-orange-600' : ''}`}>
                    {formatMoney(customer.creditBalance)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {customer.lastPurchaseDate ? (
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {customer.lastPurchaseDate.toLocaleDateString()}
                    </div>
                  ) : (
                    <span className="text-gray-400">Never</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                    customer.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {customer.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewTransactions(customer)}
                      className="p-1 hover:bg-blue-100 rounded text-blue-600"
                      title="View transactions"
                    >
                      <Filter size={16} />
                    </button>
                    <button
                      onClick={() => handleEdit(customer)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="p-1 hover:bg-red-100 rounded text-red-600"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredCustomers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No customers found</p>
            <button
              onClick={() => {
                resetForm();
                setEditingCustomer(null);
                setShowAddModal(true);
              }}
              className="mt-4 text-blue-600 hover:underline"
            >
              Add your first customer
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingCustomer ? 'Edit Customer' : 'Add Customer'}
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
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Any additional notes about this customer..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCustomer(null);
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
                {editingCustomer ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Modal */}
      {showTransactionsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Transaction History</h2>
              <button
                onClick={() => {
                  setShowTransactionsModal(false);
                  setSelectedCustomer(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="font-medium">{selectedCustomer.name}</p>
              <p className="text-sm text-gray-500">Total Spent: {formatMoney(selectedCustomer.totalSpent)}</p>
              <p className="text-sm text-gray-500">Credit Balance: {formatMoney(selectedCustomer.creditBalance)}</p>
            </div>
            
            <div className="space-y-2">
              {transactions.length > 0 ? (
                transactions.map(transaction => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium capitalize">{transaction.type}</div>
                      <div className="text-sm text-gray-500">{transaction.description || transaction.createdAt.toLocaleDateString()}</div>
                    </div>
                    <span className={`font-semibold ${
                      transaction.type === 'purchase' ? 'text-green-600' :
                      transaction.type === 'payment' ? 'text-blue-600' :
                      'text-orange-600'
                    }`}>
                      {transaction.type === 'purchase' ? '+' : transaction.type === 'payment' ? '-' : ''}{formatMoney(transaction.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No transactions found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

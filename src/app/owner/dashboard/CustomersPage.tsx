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

let firestoreInstance: ReturnType<typeof initializeFirebase>['firestore'] | null = null;

export function CustomersPage() {
  const { user, showToast } = useApp();
  const { formatMoney } = useCurrency();
  const { firestore } = React.useMemo(() => {
    if (!firestoreInstance) {
      const initialized = initializeFirebase();
      firestoreInstance = initialized.firestore;
    }
    return { firestore: firestoreInstance };
  }, []);

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
      
      setCustomers(customerData);
      
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
      <div className={styles.loadingState}>
        <div className="text-center">
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Loading customers...</p>
        </div>
      </div>
    );
  }

  const totalRevenue = calculateTotalRevenue();
  const totalCredit = calculateTotalCredit();
  const topCustomers = getTopCustomers();

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Customer Management</h1>
          <p className={styles.pageDesc}>Manage your customer relationships and history</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingCustomer(null);
            setShowAddModal(true);
          }}
          className={styles.addButton}
        >
          <Plus size={20} />
          Add Customer
        </button>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <Users className={styles.summaryIcon} />
          <div>
            <p className={styles.summaryLabel}>Total Customers</p>
            <p className={styles.summaryValue}>{customers.length}</p>
          </div>
        </div>
        
        <div className={styles.summaryCard}>
          <DollarSign className={styles.summaryIcon} style={{ color: 'var(--green)' }} />
          <div>
            <p className={styles.summaryLabel}>Total Revenue</p>
            <p className={styles.summaryValue}>{formatMoney(totalRevenue)}</p>
          </div>
        </div>
        
        <div className={styles.summaryCard}>
          <TrendingUp className={styles.summaryIcon} style={{ color: 'var(--purple)' }} />
          <div>
            <p className={styles.summaryLabel}>Avg. Spend</p>
            <p className={styles.summaryValue}>
              {customers.length > 0 ? formatMoney(totalRevenue / customers.length) : formatMoney(0)}
            </p>
          </div>
        </div>
        
        <div className={styles.summaryCard}>
          <DollarSign className={styles.summaryIcon} style={{ color: totalCredit > 0 ? 'var(--amber)' : 'var(--text-3)' }} />
          <div>
            <p className={styles.summaryLabel}>Total Credit</p>
            <p className={styles.summaryValue}>{formatMoney(totalCredit)}</p>
          </div>
        </div>
      </div>

      {/* Top Customers */}
      {topCustomers.length > 0 && (
        <div className={styles.topCustomers}>
          <h3 className={styles.topCustomersTitle}>Top Customers by Spend</h3>
          <div>
            {topCustomers.map((customer, idx) => (
              <div key={customer.id} className={styles.topCustomerItem}>
                <div className="flex items-center gap-3">
                  <span className={styles.topCustomerRank}>#{idx + 1}</span>
                  <span className={styles.topCustomerName}>{customer.name}</span>
                </div>
                <span className={styles.topCustomerSpend}>{formatMoney(customer.totalSpent)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className={styles.searchIcon} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={styles.filterSelect}
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
          className={styles.filterSelect}
        >
          <option value="recent">Most Recent</option>
          <option value="name">Name A-Z</option>
          <option value="spent">Highest Spent</option>
          <option value="purchases">Most Purchases</option>
        </select>
      </div>

      {/* Customers Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th className={styles.tableHeader}>Customer</th>
              <th className={styles.tableHeader}>Contact</th>
              <th className={styles.tableHeader}>Total Spent</th>
              <th className={styles.tableHeader}>Purchases</th>
              <th className={styles.tableHeader}>Credit Balance</th>
              <th className={styles.tableHeader}>Last Purchase</th>
              <th className={styles.tableHeader}>Status</th>
              <th className={styles.tableHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(customer => (
              <tr key={customer.id} className={styles.tableRow}>
                <td className={styles.tableCell}>
                  <div className={styles.customerName}>{customer.name}</div>
                  {customer.city && (
                    <div className={styles.customerCity}>
                      <MapPin size={12} />
                      {customer.city}
                    </div>
                  )}
                </td>
                <td className={styles.tableCell}>
                  <div className={styles.contactInfo}>
                    {customer.email && (
                      <div className={styles.contactItem}>
                        <Mail size={12} />
                        {customer.email}
                      </div>
                    )}
                    {customer.phone && (
                      <div className={styles.contactItem}>
                        <Phone size={12} />
                        {customer.phone}
                      </div>
                    )}
                  </div>
                </td>
                <td className={styles.tableCell}><span className={styles.moneyValue}>{formatMoney(customer.totalSpent)}</span></td>
                <td className={styles.tableCell}>{customer.totalPurchases}</td>
                <td className={styles.tableCell}>
                  <span className={`${styles.creditValue} ${customer.creditBalance > 0 ? styles.positive : ''}`}>
                    {formatMoney(customer.creditBalance)}
                  </span>
                </td>
                <td className={styles.tableCell}>
                  {customer.lastPurchaseDate ? (
                    <div className={styles.dateCell}>
                      <Calendar size={12} />
                      {customer.lastPurchaseDate.toLocaleDateString()}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-3)' }}>Never</span>
                  )}
                </td>
                <td className={styles.tableCell}>
                  <span className={`${styles.statusBadge} ${customer.active ? styles.active : styles.inactive}`}>
                    {customer.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className={styles.tableCell}>
                  <div className={styles.actionButtons}>
                    <button
                      onClick={() => handleViewTransactions(customer)}
                      className={styles.actionButton}
                      title="View transactions"
                    >
                      <Filter size={16} />
                    </button>
                    <button
                      onClick={() => handleEdit(customer)}
                      className={styles.actionButton}
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id)}
                      className={`${styles.actionButton} ${styles.danger}`}
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
          <div className={styles.emptyState}>
            <Users className={styles.emptyStateIcon} />
            <p>No customers found</p>
            <button
              onClick={() => {
                resetForm();
                setEditingCustomer(null);
                setShowAddModal(true);
              }}
              className={styles.emptyStateButton}
            >
              Add your first customer
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>
              {editingCustomer ? 'Edit Customer' : 'Add Customer'}
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
                <label className={styles.formLabel}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={styles.formInput}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={styles.formInput}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={styles.formInput}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className={styles.formInput}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className={styles.formTextarea}
                  rows={3}
                  placeholder="Any additional notes about this customer..."
                />
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCustomer(null);
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
                {editingCustomer ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Modal */}
      {showTransactionsModal && selectedCustomer && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '640px' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={styles.modalTitle}>Transaction History</h2>
              <button
                onClick={() => {
                  setShowTransactionsModal(false);
                  setSelectedCustomer(null);
                }}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-3)' }}
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4 p-3" style={{ background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)' }}>
              <p className="font-medium" style={{ color: 'var(--text-1)' }}>{selectedCustomer.name}</p>
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>Total Spent: {formatMoney(selectedCustomer.totalSpent)}</p>
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>Credit Balance: {formatMoney(selectedCustomer.creditBalance)}</p>
            </div>
            
            <div className="space-y-2">
              {transactions.length > 0 ? (
                transactions.map(transaction => (
                  <div key={transaction.id} className="flex items-center justify-between p-3" style={{ background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <div className="font-medium capitalize" style={{ color: 'var(--text-1)' }}>{transaction.type}</div>
                      <div className="text-sm" style={{ color: 'var(--text-3)' }}>{transaction.description || transaction.createdAt.toLocaleDateString()}</div>
                    </div>
                    <span className="font-semibold" style={{
                      color: transaction.type === 'purchase' ? 'var(--green)' :
                             transaction.type === 'payment' ? 'var(--purple)' :
                             'var(--amber)'
                    }}>
                      {transaction.type === 'purchase' ? '+' : transaction.type === 'payment' ? '-' : ''}{formatMoney(transaction.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8" style={{ color: 'var(--text-3)' }}>
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


'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { fetchDocs, addDoc, updateDoc, deleteDoc as sbDeleteDoc } from '@/lib/supabase-client-data';
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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [user?.businessId]);

  const loadCustomers = async () => {
    try {
      if (!user?.businessId) return;
      const data = await fetchDocs<Customer>(`businesses/${user.businessId}/customers`);
      const customerData = data.map(c => ({
        ...c,
        createdAt: c.createdAt ? new Date(c.createdAt as unknown as string) : new Date(),
        lastPurchaseDate: c.lastPurchaseDate ? new Date(c.lastPurchaseDate as unknown as string) : undefined,
        totalPurchases: Number((c as any).totalPurchases) || 0,
        totalSpent: Number((c as any).totalSpent) || 0,
        creditBalance: Number((c as any).creditBalance) || 0,
        active: (c as any).active !== false,
      })) as Customer[];
      setCustomers(customerData);
      sortCustomers(customerData);
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
      const data = await fetchDocs<CustomerTransaction>(
        `businesses/${user.businessId}/customerTransactions`,
        {
          filters: [{ field: 'customer_id', op: '=', value: customerId }],
          orderBy: { field: 'created_at', ascending: false },
        }
      );
      const transactionData = data.map(t => ({
        ...t,
        createdAt: t.createdAt ? new Date(t.createdAt as unknown as string) : new Date(),
      })) as CustomerTransaction[];
      setTransactions(transactionData);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      if (!user?.businessId) {
        showToast('Business not found — please refresh');
        return;
      }
      if (!formData.name.trim()) {
        showToast('Customer name is required');
        return;
      }
      const customerData: Record<string, unknown> = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        notes: formData.notes.trim() || null,
        city: formData.city.trim() || null,
        active: true,
      };
      if (editingCustomer) {
        await updateDoc(`businesses/${user.businessId}/customers`, editingCustomer.id, customerData);
        showToast('Customer updated successfully');
      } else {
        await addDoc(`businesses/${user.businessId}/customers`, {
          ...customerData,
          id: crypto.randomUUID(),
          totalPurchases: 0,
          totalSpent: 0,
          creditBalance: 0,
          loyaltyPoints: 0,
        });
        showToast('Customer added successfully');
      }
      setShowAddModal(false);
      setEditingCustomer(null);
      resetForm();
      loadCustomers();
    } catch (error) {
      console.error('Failed to save customer:', error);
      const msg = error instanceof Error ? error.message : 'Failed to save customer';
      showToast(msg.includes('Failed') ? msg : `Failed to save customer: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
      if (!user?.businessId) return;
      await sbDeleteDoc(`businesses/${user.businessId}/customers`, customerId);
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

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', address: '', city: '', notes: '' });
  };

  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q);
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && c.active) ||
      (filterStatus === 'inactive' && !c.active);
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <div className={styles.page}><div className={styles.loading}>Loading customers...</div></div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Customers</h1>
          <p className={styles.subtitle}>Manage your customer directory</p>
        </div>
        <button className={styles.primaryBtn} onClick={() => { resetForm(); setEditingCustomer(null); setShowAddModal(true); }}>
          <Plus size={18} /> Add Customer
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={styles.select}>
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className={styles.select}>
          <option value="recent">Most recent</option>
          <option value="name">Name</option>
          <option value="spent">Total spent</option>
          <option value="purchases">Purchases</option>
        </select>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className={styles.empty}>
          <Users size={40} />
          <p>No customers yet</p>
          <button className={styles.primaryBtn} onClick={() => setShowAddModal(true)}>Add your first customer</button>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Total spent</th>
                <th>Purchases</th>
                <th>Credit</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.phone || '—'}</td>
                  <td>{c.email || '—'}</td>
                  <td>{formatMoney(c.totalSpent || 0)}</td>
                  <td>{c.totalPurchases || 0}</td>
                  <td>{formatMoney(c.creditBalance || 0)}</td>
                  <td className={styles.actions}>
                    <button type="button" onClick={() => handleEdit(c)} title="Edit"><Edit2 size={16} /></button>
                    <button type="button" onClick={() => handleDelete(c.id)} title="Delete"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{editingCustomer ? 'Edit customer' : 'Add customer'}</h2>
            <div className={styles.form}>
              <label>Name *
                <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Customer name" />
              </label>
              <label>Phone
                <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone" />
              </label>
              <label>Email
                <input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Email" />
              </label>
              <label>Address
                <input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Address" />
              </label>
              <label>City
                <input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="City" />
              </label>
              <label>Notes
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Notes" rows={3} />
              </label>
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.secondaryBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
              <button type="button" className={styles.primaryBtn} onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : editingCustomer ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

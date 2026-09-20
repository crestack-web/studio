'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { Card, CardHeader, CardIcon } from './Card';
import { Button } from './Button';
import { Supplier, SupplierStatus, PaymentTerms, SupplierCategory, BusinessCategory, CategorySupplierFeatures } from './types';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, addDoc, updateDoc, doc, deleteDoc, getDoc, Timestamp } from 'firebase/firestore';
import { Building2, Phone, Mail, MapPin, DollarSign, Calendar, Plus, Edit, Trash2, Search, Filter, AlertTriangle, TrendingUp, CreditCard, User } from 'lucide-react';
import styles from './SupplierManagementPage.module.css';

export function SupplierManagementPage() {
  const { user, showToast, navigateTo } = useApp();
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<SupplierStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<SupplierCategory | 'all'>('all');
  const [businessCategory, setBusinessCategory] = useState<BusinessCategory>('retail');
  const [categoryFeatures, setCategoryFeatures] = useState<CategorySupplierFeatures | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    supplierName: '',
    businessName: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    paymentTerms: 'net_30' as PaymentTerms,
    customPaymentDays: 30,
    creditLimit: 0,
    openingBalance: 0,
    category: 'general' as SupplierCategory,
    status: 'active' as SupplierStatus,
    taxId: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
    contactPersonName: '',
    contactPersonPhone: '',
    contactPersonEmail: '',
  });

  useEffect(() => {
    loadSuppliers();
    loadBusinessCategory();
  }, [user?.businessId]);

  const loadBusinessCategory = async () => {
    try {
      if (!user?.businessId) return;
      
      const { firestore } = initializeFirebase();
      const businessDoc = await getDoc(doc(firestore, 'businesses', user.businessId));
      
      if (businessDoc.exists()) {
        const data = businessDoc.data();
        const category = data.category || 'retail';
        setBusinessCategory(category);
        
        // Set category-specific features
        const features = getCategoryFeatures(category);
        setCategoryFeatures(features);
      }
    } catch (error) {
      console.error('Failed to load business category:', error);
      // Default to retail if loading fails
      setBusinessCategory('retail');
      setCategoryFeatures(getCategoryFeatures('retail'));
    }
  };

  const getCategoryFeatures = (category: BusinessCategory): CategorySupplierFeatures => {
    const featuresMap: Record<BusinessCategory, CategorySupplierFeatures> = {
      retail: {
        category: 'retail',
        enabledFeatures: ['inventory_tracking', 'credit_management', 'multi_supplier'],
        customFields: [
          { name: 'minimum_order_quantity', type: 'number', required: false },
          { name: 'lead_time_days', type: 'number', required: false },
        ],
        analytics: ['inventory_turnover', 'supplier_reliability', 'cost_analysis'],
        insights: ['seasonal_demand', 'stock_optimization', 'supplier_comparison'],
      },
      wholesale: {
        category: 'wholesale',
        enabledFeatures: ['bulk_pricing', 'volume_discounts', 'credit_management'],
        customFields: [
          { name: 'bulk_discount_tiers', type: 'text', required: false },
          { name: 'minimum_order_value', type: 'number', required: true },
        ],
        analytics: ['volume_trends', 'margin_analysis', 'supplier_performance'],
        insights: ['bulk_optimization', 'price_negotiation', 'inventory_efficiency'],
      },
      restaurant: {
        category: 'restaurant',
        enabledFeatures: ['expiry_tracking', 'perishable_management', 'daily_delivery'],
        customFields: [
          { name: 'delivery_schedule', type: 'select', required: true, options: ['daily', 'weekly', 'bi-weekly'] },
          { name: 'storage_requirements', type: 'text', required: false },
        ],
        analytics: ['food_cost_percentage', 'waste_tracking', 'supplier_timeliness'],
        insights: ['menu_cost_optimization', 'seasonal_ingredients', 'supplier_reliability'],
      },
      pharmacy: {
        category: 'pharmacy',
        enabledFeatures: ['expiry_tracking', 'regulatory_compliance', 'batch_tracking'],
        customFields: [
          { name: 'license_number', type: 'text', required: true },
          { name: 'regulatory_certifications', type: 'text', required: true },
        ],
        analytics: ['expiry_alerts', 'regulatory_compliance', 'supplier_certifications'],
        insights: ['expiry_management', 'compliance_status', 'supplier_audit'],
      },
      fashion: {
        category: 'fashion',
        enabledFeatures: ['seasonal_collections', 'trend_tracking', 'sample_management'],
        customFields: [
          { name: 'season', type: 'select', required: true, options: ['spring', 'summer', 'fall', 'winter'] },
          { name: 'collection_year', type: 'number', required: true },
        ],
        analytics: ['seasonal_sales', 'trend_performance', 'inventory_velocity'],
        insights: ['trend_forecasting', 'collection_planning', 'supplier_trends'],
      },
      manufacturing: {
        category: 'manufacturing',
        enabledFeatures: ['raw_material_tracking', 'quality_control', 'production_planning'],
        customFields: [
          { name: 'material_specifications', type: 'text', required: true },
          { name: 'quality_standards', type: 'text', required: true },
        ],
        analytics: ['material_efficiency', 'quality_metrics', 'production_costs'],
        insights: ['cost_optimization', 'quality_improvement', 'supply_chain_efficiency'],
      },
      services: {
        category: 'services',
        enabledFeatures: ['service_level_tracking', 'contract_management', 'renewal_tracking'],
        customFields: [
          { name: 'service_level_agreement', type: 'text', required: true },
          { name: 'contract_end_date', type: 'date', required: true },
        ],
        analytics: ['service_performance', 'contract_compliance', 'cost_per_service'],
        insights: ['service_optimization', 'contract_negotiation', 'vendor_comparison'],
      },
      supermarket: {
        category: 'supermarket',
        enabledFeatures: ['multi_category', 'shelf_management', 'promotion_tracking'],
        customFields: [
          { name: 'product_categories', type: 'text', required: true },
          { name: 'shelf_space_allocation', type: 'number', required: false },
        ],
        analytics: ['category_performance', 'shelf_efficiency', 'promotion_impact'],
        insights: ['category_optimization', 'shelf_planning', 'promotion_strategy'],
      },
      cafe: {
        category: 'cafe',
        enabledFeatures: ['ingredient_tracking', 'recipe_management', 'daily_delivery'],
        customFields: [
          { name: 'delivery_frequency', type: 'select', required: true, options: ['daily', 'twice_weekly', 'weekly'] },
          { name: 'quality_grade', type: 'select', required: false, options: ['premium', 'standard', 'economy'] },
        ],
        analytics: ['ingredient_costs', 'recipe_efficiency', 'supplier_consistency'],
        insights: ['cost_optimization', 'quality_consistency', 'supplier_reliability'],
      },
      distributor: {
        category: 'distributor',
        enabledFeatures: ['logistics_tracking', 'warehouse_management', 'route_optimization'],
        customFields: [
          { name: 'delivery_zones', type: 'text', required: true },
          { name: 'warehouse_location', type: 'text', required: true },
        ],
        analytics: ['delivery_efficiency', 'warehouse_utilization', 'route_performance'],
        insights: ['logistics_optimization', 'warehouse_planning', 'route_efficiency'],
      },
      grocery: {
        category: 'grocery',
        enabledFeatures: ['expiry_tracking', 'perishable_management', 'bulk_purchasing'],
        customFields: [
          { name: 'storage_type', type: 'select', required: true, options: ['dry', 'refrigerated', 'frozen'] },
          { name: 'shelf_life_days', type: 'number', required: true },
        ],
        analytics: ['waste_tracking', 'expiry_management', 'cost_per_unit'],
        insights: ['waste_reduction', 'expiry_optimization', 'bulk_purchasing'],
      },
      electronics: {
        category: 'electronics',
        enabledFeatures: ['warranty_tracking', 'serial_number_tracking', 'technical_support'],
        customFields: [
          { name: 'warranty_period_months', type: 'number', required: true },
          { name: 'technical_support_level', type: 'select', required: true, options: ['basic', 'standard', 'premium'] },
        ],
        analytics: ['warranty_claims', 'defect_rates', 'support_response_time'],
        insights: ['quality_metrics', 'warranty_optimization', 'support_efficiency'],
      },
      jobs: {
        category: 'jobs',
        enabledFeatures: ['project_tracking', 'material_procurement', 'credit_management'],
        customFields: [
          { name: 'trade_type', type: 'text', required: false },
          { name: 'lead_time_days', type: 'number', required: false },
        ],
        analytics: ['project_spend', 'supplier_reliability', 'material_cost'],
        insights: ['cost_optimization', 'supplier_comparison', 'material_planning'],
      },
      recycling_material_collection: {
        category: 'recycling_material_collection',
        enabledFeatures: ['weigh_in_procurement', 'price_per_kg', 'credit_management'],
        customFields: [
          { name: 'material_type', type: 'text', required: false },
          { name: 'price_per_kg', type: 'number', required: false },
        ],
        analytics: ['volume_by_material', 'supplier_spend', 'price_trends'],
        insights: ['price_negotiation', 'volume_optimization', 'supplier_reliability'],
      },
    };
    
    return featuresMap[category] || featuresMap.retail;
  };

  const loadSuppliers = async () => {
    try {
      if (!user?.businessId) return;
      
      const { firestore } = initializeFirebase();
      const suppliersRef = collection(firestore, 'businesses', user.businessId, 'suppliers');
      const snapshot = await getDocs(suppliersRef);

      
      const suppliersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          businessId: data.businessId || '',
          supplierName: data.supplierName || '',
          businessName: data.businessName || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          notes: data.notes || '',
          paymentTerms: data.paymentTerms || 'net_30',
          customPaymentDays: data.customPaymentDays || 30,
          creditLimit: data.creditLimit || 0,
          openingBalance: data.openingBalance || 0,
          currentBalance: data.currentBalance || 0,
          category: data.category || 'general',
          status: data.status || 'active',
          taxId: data.taxId || '',
          bankAccount: data.bankAccount || null,
          contactPerson: data.contactPerson || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastPurchaseDate: data.lastPurchaseDate?.toDate(),
          lastPaymentDate: data.lastPaymentDate?.toDate(),
          totalPurchases: data.totalPurchases || 0,
          totalPayments: data.totalPayments || 0,
          purchaseCount: data.purchaseCount || 0,
          paymentCount: data.paymentCount || 0,
          averagePaymentDays: data.averagePaymentDays || 0,
          creditUtilization: data.creditUtilization || 0,
        } as Supplier;
      });
      
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
      showToast('Failed to load suppliers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSupplier = async () => {
    try {
      if (!user?.businessId) return;
      
      const { firestore } = initializeFirebase();
      const suppliersRef = collection(firestore, 'businesses', user.businessId, 'suppliers');
      
      const newSupplier = {
        businessId: user.businessId,
        supplierName: formData.supplierName,
        businessName: formData.businessName,
        phone: formData.phone,
        email: formData.email || null,
        address: formData.address || null,
        notes: formData.notes || null,
        paymentTerms: formData.paymentTerms,
        customPaymentDays: formData.paymentTerms === 'custom' ? formData.customPaymentDays : null,
        creditLimit: formData.creditLimit,
        openingBalance: formData.openingBalance,
        currentBalance: formData.openingBalance,
        category: formData.category,
        status: formData.status,
        taxId: formData.taxId || null,
        bankAccount: (formData.bankName || formData.bankAccountNumber || formData.bankAccountName) ? {
          bankName: formData.bankName,
          accountNumber: formData.bankAccountNumber,
          accountName: formData.bankAccountName,
        } : null,
        contactPerson: (formData.contactPersonName || formData.contactPersonPhone) ? {
          name: formData.contactPersonName,
          phone: formData.contactPersonPhone,
          email: formData.contactPersonEmail || null,
        } : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastPurchaseDate: null,
        lastPaymentDate: null,
        totalPurchases: 0,
        totalPayments: 0,
        purchaseCount: 0,
        paymentCount: 0,
        averagePaymentDays: 0,
        creditUtilization: formData.creditLimit > 0 ? (formData.openingBalance / formData.creditLimit) * 100 : 0,
      };
      
      await addDoc(suppliersRef, newSupplier);
      
      // Create opening balance ledger entry if opening balance > 0
      if (formData.openingBalance > 0) {
        const ledgerRef = collection(firestore, 'businesses', user.businessId, 'supplierLedger');
        await addDoc(ledgerRef, {
          supplierId: 'temp', // Will be updated with actual ID
          businessId: user.businessId,
          type: 'opening_balance',
          amount: formData.openingBalance,
          balanceAfter: formData.openingBalance,
          description: 'Opening balance',
          date: Timestamp.now(),
          createdAt: Timestamp.now(),
          createdBy: user.id,
          createdByName: user.name,
        });
      }
      
      showToast('Supplier created successfully');
      setShowForm(false);
      resetForm();
      loadSuppliers();
    } catch (error) {
      console.error('Failed to create supplier:', error);
      showToast('Failed to create supplier');
    }
  };

  const handleUpdateSupplier = async () => {
    try {
      if (!user?.businessId || !editingSupplier) return;
      
      const { firestore } = initializeFirebase();
      const supplierRef = doc(firestore, 'businesses', user.businessId, 'suppliers', editingSupplier.id);
      
      await updateDoc(supplierRef, {
        supplierName: formData.supplierName,
        businessName: formData.businessName,
        phone: formData.phone,
        email: formData.email || null,
        address: formData.address || null,
        notes: formData.notes || null,
        paymentTerms: formData.paymentTerms,
        customPaymentDays: formData.paymentTerms === 'custom' ? formData.customPaymentDays : null,
        creditLimit: formData.creditLimit,
        category: formData.category,
        status: formData.status,
        taxId: formData.taxId || null,
        bankAccount: (formData.bankName || formData.bankAccountNumber || formData.bankAccountName) ? {
          bankName: formData.bankName,
          accountNumber: formData.bankAccountNumber,
          accountName: formData.bankAccountName,
        } : null,
        contactPerson: (formData.contactPersonName || formData.contactPersonPhone) ? {
          name: formData.contactPersonName,
          phone: formData.contactPersonPhone,
          email: formData.contactPersonEmail || null,
        } : null,
        updatedAt: Timestamp.now(),
        creditUtilization: formData.creditLimit > 0 ? (editingSupplier.currentBalance / formData.creditLimit) * 100 : 0,
      });
      
      showToast('Supplier updated successfully');
      setShowForm(false);
      setEditingSupplier(null);
      resetForm();
      loadSuppliers();
    } catch (error) {
      console.error('Failed to update supplier:', error);
      showToast('Failed to update supplier');
    }
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    if (!confirm('Are you sure you want to delete this supplier? This action cannot be undone.')) return;
    
    try {
      if (!user?.businessId) return;
      
      const { firestore } = initializeFirebase();
      await deleteDoc(doc(firestore, 'businesses', user.businessId, 'suppliers', supplierId));
      
      showToast('Supplier deleted successfully');
      loadSuppliers();
    } catch (error) {
      console.error('Failed to delete supplier:', error);
      showToast('Failed to delete supplier');
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      supplierName: supplier.supplierName,
      businessName: supplier.businessName,
      phone: supplier.phone,
      email: supplier.email || '',
      address: supplier.address || '',
      notes: supplier.notes || '',
      paymentTerms: supplier.paymentTerms,
      customPaymentDays: supplier.customPaymentDays || 30,
      creditLimit: supplier.creditLimit,
      openingBalance: supplier.openingBalance,
      category: supplier.category,
      status: supplier.status,
      taxId: supplier.taxId || '',
      bankName: supplier.bankAccount?.bankName || '',
      bankAccountNumber: supplier.bankAccount?.accountNumber || '',
      bankAccountName: supplier.bankAccount?.accountName || '',
      contactPersonName: supplier.contactPerson?.name || '',
      contactPersonPhone: supplier.contactPerson?.phone || '',
      contactPersonEmail: supplier.contactPerson?.email || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      supplierName: '',
      businessName: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
      paymentTerms: 'net_30',
      customPaymentDays: 30,
      creditLimit: 0,
      openingBalance: 0,
      category: 'general',
      status: 'active',
      taxId: '',
      bankName: '',
      bankAccountNumber: '',
      bankAccountName: '',
      contactPersonName: '',
      contactPersonPhone: '',
      contactPersonEmail: '',
    });
    setEditingSupplier(null);
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (supplier.phone && supplier.phone.includes(searchQuery));
    const matchesStatus = filterStatus === 'all' || supplier.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || supplier.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading suppliers...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Supplier Management</h1>
          <p className={styles.subtitle}>Manage suppliers, credit limits, and payment terms</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={16} /> Add Supplier
        </Button>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as SupplierStatus | 'all')}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blocked">Blocked</option>
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as SupplierCategory | 'all')}>
          <option value="all">All Categories</option>
          <option value="general">General</option>
          <option value="food">Food</option>
          <option value="beverages">Beverages</option>
          <option value="dairy">Dairy</option>
          <option value="pharmaceutical">Pharmaceutical</option>
          <option value="cosmetics">Cosmetics</option>
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
          <option value="raw_materials">Raw Materials</option>
          <option value="equipment">Equipment</option>
          <option value="services">Services</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className={styles.list}>
        {filteredSuppliers.length === 0 ? (
          <div className={styles.empty}>
            <Building2 size={48} />
            <p>No suppliers found</p>
            <Button onClick={() => { resetForm(); setShowForm(true); }}>Add your first supplier</Button>
          </div>
        ) : (
          filteredSuppliers.map(supplier => (
            <Card key={supplier.id} className={styles.supplierCard}>
              <div className={styles.supplierHeader}>
                <div>
                  <h3>{supplier.supplierName}</h3>
                  <p className={styles.businessName}>{supplier.businessName}</p>
                </div>
                <div className={styles.actions}>
                  <button onClick={() => handleEdit(supplier)} title="Edit"><Edit size={16} /></button>
                  <button onClick={() => handleDeleteSupplier(supplier.id)} title="Delete"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className={styles.supplierMeta}>
                {supplier.phone && <span><Phone size={14} /> {supplier.phone}</span>}
                {supplier.email && <span><Mail size={14} /> {supplier.email}</span>}
                <span className={styles.badge}>{supplier.status}</span>
                <span className={styles.badge}>{supplier.category}</span>
              </div>
              <div className={styles.financials}>
                <div>
                  <span className={styles.label}>Balance</span>
                  <span className={styles.value}>{formatMoney(supplier.currentBalance)}</span>
                </div>
                <div>
                  <span className={styles.label}>Credit Limit</span>
                  <span className={styles.value}>{formatMoney(supplier.creditLimit)}</span>
                </div>
                <div>
                  <span className={styles.label}>Terms</span>
                  <span className={styles.value}>{supplier.paymentTerms}</span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {showForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</h2>
            <div className={styles.formGrid}>
              <label>Supplier Name *
                <input value={formData.supplierName} onChange={e => setFormData({...formData, supplierName: e.target.value})} />
              </label>
              <label>Business Name *
                <input value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} />
              </label>
              <label>Phone *
                <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </label>
              <label>Email
                <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </label>
              <label>Address
                <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </label>
              <label>Category
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as SupplierCategory})}>
                  <option value="general">General</option>
                  <option value="food">Food</option>
                  <option value="beverages">Beverages</option>
                  <option value="dairy">Dairy</option>
                  <option value="pharmaceutical">Pharmaceutical</option>
                  <option value="cosmetics">Cosmetics</option>
                  <option value="electronics">Electronics</option>
                  <option value="clothing">Clothing</option>
                  <option value="raw_materials">Raw Materials</option>
                  <option value="equipment">Equipment</option>
                  <option value="services">Services</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>Payment Terms
                <select value={formData.paymentTerms} onChange={e => setFormData({...formData, paymentTerms: e.target.value as PaymentTerms})}>
                  <option value="cash">Cash</option>
                  <option value="net_7">Net 7</option>
                  <option value="net_14">Net 14</option>
                  <option value="net_30">Net 30</option>
                  <option value="net_60">Net 60</option>
                  <option value="net_90">Net 90</option>
                  <option value="custom">Custom</option>
                </select>
              </label>
              <label>Credit Limit
                <input type="number" value={formData.creditLimit} onChange={e => setFormData({...formData, creditLimit: Number(e.target.value)})} />
              </label>
              {!editingSupplier && (
                <label>Opening Balance
                  <input type="number" value={formData.openingBalance} onChange={e => setFormData({...formData, openingBalance: Number(e.target.value)})} />
                </label>
              )}
              <label>Status
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as SupplierStatus})}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="blocked">Blocked</option>
                </select>
              </label>
              <label>Notes
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
              </label>
            </div>
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
              <Button onClick={editingSupplier ? handleUpdateSupplier : handleCreateSupplier}>
                {editingSupplier ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

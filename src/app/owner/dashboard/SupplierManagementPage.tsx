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
                         supplier.phone.includes(searchQuery);
    const matchesStatus = filterStatus === 'all' || supplier.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || supplier.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getPaymentTermsLabel = (terms: PaymentTerms, customDays?: number) => {
    const labels: Record<PaymentTerms, string> = {
      cash: 'Cash on Delivery',
      net_7: 'Net 7 days',
      net_14: 'Net 14 days',
      net_30: 'Net 30 days',
      net_60: 'Net 60 days',
      net_90: 'Net 90 days',
      custom: customDays ? `Net ${customDays} days` : 'Custom',
    };
    return labels[terms];
  };

  const getCreditUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'red';
    if (utilization >= 70) return 'orange';
    return 'green';
  };

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <div className="text-center">
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Loading suppliers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Supplier Management</h1>
          <p className={styles.pageDesc}>Manage your suppliers, credit limits, and payment terms</p>
        </div>
        <Button onClick={() => { setShowForm(true); resetForm(); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <Building2 className={styles.summaryIcon} />
          <div>
            <p className={styles.summaryLabel}>Total Suppliers</p>
            <p className={styles.summaryValue}>{suppliers.length}</p>
          </div>
        </div>
        
        <div className={styles.summaryCard}>
          <TrendingUp className={styles.summaryIcon} style={{ color: 'var(--green)' }} />
          <div>
            <p className={styles.summaryLabel}>Active Suppliers</p>
            <p className={styles.summaryValue}>{suppliers.filter(s => s.status === 'active').length}</p>
          </div>
        </div>
        
        <div className={styles.summaryCard}>
          <DollarSign className={styles.summaryIcon} style={{ color: 'var(--purple)' }} />
          <div>
            <p className={styles.summaryLabel}>Total Outstanding</p>
            <p className={styles.summaryValue}>{formatMoney(suppliers.reduce((sum, s) => sum + s.currentBalance, 0))}</p>
          </div>
        </div>
        
        <div className={styles.summaryCard}>
          <AlertTriangle className={styles.summaryIcon} style={{ color: suppliers.filter(s => s.creditUtilization >= 90).length > 0 ? 'var(--red)' : 'var(--text-3)' }} />
          <div>
            <p className={styles.summaryLabel}>High Credit Utilization</p>
            <p className={styles.summaryValue}>{suppliers.filter(s => s.creditUtilization >= 90).length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as SupplierStatus | 'all')}
          className={styles.filterSelect}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blocked">Blocked</option>
        </select>
        
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as SupplierCategory | 'all')}
          className={styles.filterSelect}
        >
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

      {/* Supplier Form Modal */}
      {showForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className={styles.closeButton}>✕</button>
            </div>
            
            <div className={styles.form}>
              <div className={styles.formSection}>
                <h3 className={styles.formSectionTitle}>Basic Information</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Supplier Name *</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={formData.supplierName}
                      onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                      placeholder="Contact person name"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Business Name *</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      placeholder="Company name"
                    />
                  </div>
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Phone *</label>
                    <input
                      type="tel"
                      className={styles.formInput}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+234 XXX XXX XXXX"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Email</label>
                    <input
                      type="email"
                      className={styles.formInput}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Address</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Full address"
                  />
                </div>
              </div>
              
              <div className={styles.formSection}>
                <h3 className={styles.formSectionTitle}>Payment & Credit</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Payment Terms</label>
                    <select
                      className={styles.formInput}
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value as PaymentTerms })}
                    >
                      <option value="cash">Cash on Delivery</option>
                      <option value="net_7">Net 7 days</option>
                      <option value="net_14">Net 14 days</option>
                      <option value="net_30">Net 30 days</option>
                      <option value="net_60">Net 60 days</option>
                      <option value="net_90">Net 90 days</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  {formData.paymentTerms === 'custom' && (
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Custom Days</label>
                      <input
                        type="number"
                        className={styles.formInput}
                        value={formData.customPaymentDays}
                        onChange={(e) => setFormData({ ...formData, customPaymentDays: parseInt(e.target.value) })}
                        placeholder="30"
                      />
                    </div>
                  )}
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Credit Limit</label>
                    <input
                      type="number"
                      className={styles.formInput}
                      value={formData.creditLimit}
                      onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>
                  {!editingSupplier && (
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Opening Balance</label>
                      <input
                        type="number"
                        className={styles.formInput}
                        value={formData.openingBalance}
                        onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) })}
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className={styles.formSection}>
                <h3 className={styles.formSectionTitle}>Classification</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Category</label>
                    <select
                      className={styles.formInput}
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as SupplierCategory })}
                    >
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
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Status</label>
                    <select
                      className={styles.formInput}
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as SupplierStatus })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className={styles.formSection}>
                <h3 className={styles.formSectionTitle}>Bank Information (Optional)</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Bank Name</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      placeholder="Bank name"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Account Number</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={formData.bankAccountNumber}
                      onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                      placeholder="Account number"
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Account Name</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formData.bankAccountName}
                    onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                    placeholder="Account holder name"
                  />
                </div>
              </div>
              
              <div className={styles.formSection}>
                <h3 className={styles.formSectionTitle}>Contact Person (Optional)</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Name</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={formData.contactPersonName}
                      onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
                      placeholder="Contact person name"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Phone</label>
                    <input
                      type="tel"
                      className={styles.formInput}
                      value={formData.contactPersonPhone}
                      onChange={(e) => setFormData({ ...formData, contactPersonPhone: e.target.value })}
                      placeholder="Contact person phone"
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email</label>
                  <input
                    type="email"
                    className={styles.formInput}
                    value={formData.contactPersonEmail}
                    onChange={(e) => setFormData({ ...formData, contactPersonEmail: e.target.value })}
                    placeholder="Contact person email"
                  />
                </div>
              </div>
              
              <div className={styles.formSection}>
                <h3 className={styles.formSectionTitle}>Additional Information</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Tax ID</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      placeholder="Tax identification number"
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Notes</label>
                  <textarea
                    className={styles.formTextarea}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about this supplier..."
                    rows={3}
                  />
                </div>
              </div>
              
              <div className={styles.formActions}>
                <Button variant="subtle" onClick={() => { setShowForm(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={editingSupplier ? handleUpdateSupplier : handleCreateSupplier}>
                  {editingSupplier ? 'Update Supplier' : 'Create Supplier'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suppliers Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th className={styles.tableHeader}>Supplier</th>
              <th className={styles.tableHeader}>Contact</th>
              <th className={styles.tableHeader}>Category</th>
              <th className={styles.tableHeader}>Payment Terms</th>
              <th className={styles.tableHeader}>Credit Limit</th>
              <th className={styles.tableHeader}>Current Balance</th>
              <th className={styles.tableHeader}>Credit Utilization</th>
              <th className={styles.tableHeader}>Status</th>
              <th className={styles.tableHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.map(supplier => (
              <tr key={supplier.id} className={styles.tableRow}>
                <td className={styles.tableCell}>
                  <div className={styles.supplierName}>{supplier.supplierName}</div>
                  <div className={styles.businessName}>{supplier.businessName}</div>
                </td>
                <td className={styles.tableCell}>
                  <div className={styles.contactInfo}>
                    <Phone className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
                    <span>{supplier.phone}</span>
                  </div>
                  {supplier.email && (
                    <div className={styles.contactInfo}>
                      <Mail className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
                      <span>{supplier.email}</span>
                    </div>
                  )}
                </td>
                <td className={styles.tableCell} style={{ textTransform: 'capitalize' }}>{supplier.category.replace('_', ' ')}</td>
                <td className={styles.tableCell}>{getPaymentTermsLabel(supplier.paymentTerms, supplier.customPaymentDays)}</td>
                <td className={styles.tableCell}>{formatMoney(supplier.creditLimit)}</td>
                <td className={styles.tableCell}>{formatMoney(supplier.currentBalance)}</td>
                <td className={styles.tableCell}>
                  <span className={`${styles.utilizationBadge} ${styles[getCreditUtilizationColor(supplier.creditUtilization)]}`}>
                    {supplier.creditUtilization.toFixed(1)}%
                  </span>
                </td>
                <td className={styles.tableCell}>
                  <span className={`${styles.statusBadge} ${styles[supplier.status]}`}>
                    {supplier.status}
                  </span>
                </td>
                <td className={styles.tableCell}>
                  <div className={styles.actionButtons}>
                    <button
                      onClick={() => handleEdit(supplier)}
                      className={styles.actionButton}
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSupplier(supplier.id)}
                      className={styles.actionButton}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredSuppliers.length === 0 && (
          <div className={styles.emptyState}>
            <Building2 className={styles.emptyStateIcon} />
            <p>No suppliers found</p>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>
              {suppliers.length === 0 
                ? 'Add your first supplier to get started' 
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


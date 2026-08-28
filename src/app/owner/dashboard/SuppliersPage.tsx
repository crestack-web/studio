'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useTranslation } from './LangContext';
import { fetchDocs, fetchDoc, addDoc } from '@/lib/supabase-client-data';
import { getSupabase } from '@/lib/supabase';
import { getAuthCurrentUser } from '@/lib/supabase-auth';
import { resolveOwnerScopeBusinessId } from '@/lib/resolve-business-scope';
import { checkFeatureAccess, Plan, BusinessCategory } from '@/lib/featureRegistry';
import { Supplier } from './types';
import {
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  X,
  Loader2,
  RefreshCw,
  Package,
  Receipt,
  Wallet,
  Users,
  AlertCircle,
} from 'lucide-react';
import styles from './SuppliersPage.module.css';

interface StockReceipt {
  id: string;
  businessId: string;
  receiptNumber: string;
  supplierId: string;
  supplierName: string;
  purchaseOrderId?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
    location?: string;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  receivedDate: Date;
  notes?: string;
  receivedBy: string;
  receivedByName: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Product {
  id: string;
  name: string;
  sku?: string;
  imageUrl?: string;
}

function paymentTermsLabel(terms?: string) {
  const map: Record<string, string> = {
    cash: 'Cash on delivery',
    net_7: 'Net 7 days',
    net_14: 'Net 14 days',
    net_30: 'Net 30 days',
    net_60: 'Net 60 days',
    net_90: 'Net 90 days',
  };
  return map[terms || ''] || terms || '—';
}

export default function SuppliersPage() {
  const { showToast, user } = useApp();
  const { formatMoney } = useCurrency();
  const { t } = useTranslation();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierReceipts, setSupplierReceipts] = useState<StockReceipt[]>([]);
  const [supplierProducts, setSupplierProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);
  const [accessReason, setAccessReason] = useState('');
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(user?.businessId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'owing' | 'clear'>('all');

  const resolveBusinessId = useCallback(async (): Promise<string | null> => {
    if (businessId) return businessId;
    if (user?.businessId) {
      setBusinessId(user.businessId);
      return user.businessId;
    }
    try {
      let authId: string | undefined = user?.id;
      if (!authId) {
        const {
          data: { session },
        } = await getSupabase().auth.getSession();
        authId = session?.user?.id ?? undefined;
      }
      if (!authId) return null;
      const bid = await resolveOwnerScopeBusinessId(authId, user?.businessId);
      if (bid) {
        setBusinessId(bid);
        return bid;
      }
      const { data: profile } = await getSupabase()
        .from('users')
        .select('business_id, businessId')
        .eq('id', authId)
        .maybeSingle();
      const fromProfile =
        (profile as any)?.business_id || (profile as any)?.businessId || null;
      if (fromProfile && fromProfile !== authId) {
        setBusinessId(String(fromProfile));
        return String(fromProfile);
      }
    } catch (e) {
      console.error('resolveBusinessId failed', e);
    }
    return null;
  }, [businessId, user?.businessId, user?.id]);

  useEffect(() => {
    if (user?.businessId && user.businessId !== businessId) {
      setBusinessId(user.businessId);
    }
  }, [user?.businessId]);

  useEffect(() => {
    checkSupplierAccess();
  }, [user?.id]);

  const loadSuppliers = useCallback(async () => {
    const bid = await resolveBusinessId();
    if (!bid) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const suppliersData = await fetchDocs<Record<string, unknown>>(
        `businesses/${bid}/suppliers`
      );
      const suppliersList: Supplier[] = [];

      suppliersData.forEach((data: Record<string, unknown>) => {
        const status = String(data.status || 'active').toLowerCase();
        if (status !== 'active' && status !== '') return;
        suppliersList.push({
          id: data.id as string,
          businessId: (data.businessId as string) || bid,
          supplierName:
            (data.supplierName as string) ||
            (data.businessName as string) ||
            (data.name as string) ||
            'Unnamed Supplier',
          businessName:
            (data.businessName as string) ||
            (data.supplierName as string) ||
            (data.name as string) ||
            'Unnamed Supplier',
          phone: (data.phone as string) || '',
          email: data.email as string,
          address: data.address as string,
          notes: data.notes as string,
          paymentTerms: ((data.paymentTerms as string) || 'net_30') as any,
          customPaymentDays: data.customPaymentDays as number,
          creditLimit: (data.creditLimit as number) || 0,
          openingBalance: (data.openingBalance as number) || 0,
          currentBalance: (data.currentBalance as number) || 0,
          category: ((data.category as string) || 'general') as any,
          status: ((data.status as string) || 'active') as any,
          taxId: data.taxId as string,
          bankAccount: data.bankAccount as any,
          contactPerson: data.contactPerson as any,
          createdAt: data.createdAt ? new Date(data.createdAt as string) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt as string) : new Date(),
          lastPurchaseDate: data.lastPurchaseDate
            ? new Date(data.lastPurchaseDate as string)
            : undefined,
          lastPaymentDate: data.lastPaymentDate
            ? new Date(data.lastPaymentDate as string)
            : undefined,
          totalPurchases: (data.totalPurchases as number) || 0,
          totalPayments: (data.totalPayments as number) || 0,
          purchaseCount: (data.purchaseCount as number) || 0,
          paymentCount: (data.paymentCount as number) || 0,
          averagePaymentDays: (data.averagePaymentDays as number) || 0,
          creditUtilization: (data.creditUtilization as number) || 0,
        });
      });

      suppliersList.sort((a, b) => (b.totalPurchases || 0) - (a.totalPurchases || 0));
      setSuppliers(suppliersList);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      showToast(t('toast.suppliersLoadFailed') || 'Failed to load suppliers');
    } finally {
      setIsLoading(false);
    }
  }, [resolveBusinessId, showToast, t]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const checkSupplierAccess = async () => {
    if (!user?.id) return;
    try {
      const currentUserId = getAuthCurrentUser()?.uid || user.id;
      if (!currentUserId) return;

      const { data: ownerData } = await getSupabase()
        .from('users')
        .select('*')
        .eq('id', currentUserId)
        .maybeSingle();

      const category = String(
        ownerData?.category ||
          ownerData?.selectedCategory ||
          ownerData?.selected_category ||
          ownerData?.businessType ||
          ownerData?.business_type ||
          'retail'
      );
      const features =
        ownerData?.selectedFeatures ||
        ownerData?.selected_features ||
        [];
      const prefs =
        ownerData?.featurePreferences ||
        ownerData?.feature_preferences ||
        {};
      const plan = String(ownerData?.plan || 'starter').toLowerCase();
      const subscriptionStatus = String(
        ownerData?.subscriptionStatus ||
          ownerData?.subscription_status ||
          ''
      ).toLowerCase();
      const trialEndRaw =
        ownerData?.trialEndDate || ownerData?.trial_end_date;
      const trialEndDate = trialEndRaw ? new Date(trialEndRaw) : undefined;
      const lifetimeAccess =
        ownerData?.lifetimeAccess === true ||
        ownerData?.lifetime_access === true;

      if (lifetimeAccess) {
        setHasAccess(true);
        setAccessReason('');
        return;
      }

      const now = new Date();
      const inTrial =
        (subscriptionStatus === 'trial' || subscriptionStatus === 'trialing') &&
        (!trialEndDate || !Number.isFinite(trialEndDate.getTime()) || trialEndDate > now);

      const normalizeFeatureName = (name: string): string => {
        const nameMap: Record<string, string> = {
          'Supplier Management': 'supplier-management',
          supplierManagement: 'supplier-management',
          supplier_management: 'supplier-management',
          Suppliers: 'supplier-management',
          suppliers: 'supplier-management',
        };
        const raw = String(name || '').trim();
        if (nameMap[raw]) return nameMap[raw];
        return raw.toLowerCase().replace(/\s+/g, '-');
      };

      const enabledFeaturesSet = new Set<string>();

      // Onboarding selections
      if (Array.isArray(features)) {
        for (const f of features) {
          enabledFeaturesSet.add(normalizeFeatureName(String(f)));
        }
      }

      // Settings toggles (true = on). Normalize keys so labels and ids match.
      const prefEntries = prefs && typeof prefs === 'object' ? Object.entries(prefs) : [];
      for (const [key, value] of prefEntries) {
        if (value) enabledFeaturesSet.add(normalizeFeatureName(String(key)));
      }

      const featureId = 'supplier-management';
      const explicitlyDisabled = prefEntries.some(
        ([key, value]) =>
          normalizeFeatureName(String(key)) === featureId && value === false
      );

      // Trial: unlock plan-allowed optional features (same approach as Sidebar).
      // No preferences configured yet: do not treat missing toggle as "off".
      if (!explicitlyDisabled && (inTrial || prefEntries.length === 0)) {
        enabledFeaturesSet.add(featureId);
      }

      const effectivePlan = (
        inTrial ? (plan === 'pro' ? 'pro' : 'standard') : plan
      ) as Plan;

      const accessResult = checkFeatureAccess(
        featureId,
        effectivePlan,
        category.toLowerCase() as BusinessCategory,
        enabledFeaturesSet
      );

      if (!accessResult.eligible) {
        setHasAccess(false);
        setAccessReason(
          accessResult.reason || 'This feature is not available for your plan'
        );
      } else {
        setHasAccess(true);
        setAccessReason('');
      }
    } catch (error) {
      console.error('Error checking supplier access:', error);
      setHasAccess(true);
    }
  };

  const handleSupplierClick = async (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsLoadingDetails(true);

    try {
      const bid = await resolveBusinessId();
      if (!bid) {
        showToast(t('toast.businessIdNotFound') || 'Business not found');
        setIsLoadingDetails(false);
        return;
      }

      const receiptsData = await fetchDocs<Record<string, unknown>>(
        `businesses/${bid}/stockReceipts`,
        {
          filters: [{ field: 'supplierId', op: '=', value: supplier.id }],
          orderBy: { field: 'created_at', ascending: false },
        }
      );
      const receiptsList: StockReceipt[] = [];

      receiptsData.forEach((data: Record<string, unknown>) => {
        const createdAtDate = data.createdAt
          ? new Date(data.createdAt as string)
          : new Date();
        const receivedDate = data.receivedAt
          ? new Date(data.receivedAt as string)
          : createdAtDate;

        receiptsList.push({
          id: data.id as string,
          businessId: bid,
          supplierId: data.supplierId as string,
          supplierName:
            (data.supplierName as string) ||
            supplier.businessName ||
            'Unknown Supplier',
          purchaseOrderId: data.purchaseOrderId as string,
          receiptNumber: (data.receiptNumber as string) || (data.id as string),
          items: (data.items as StockReceipt['items']) || [],
          subtotal: (data.subtotal as number) || 0,
          tax: (data.tax as number) || 0,
          total: (data.total as number) || 0,
          receivedDate,
          notes: data.notes as string,
          receivedBy: (data.receivedBy as string) || user?.id || '',
          receivedByName: (data.receivedByName as string) || 'Unknown',
          createdAt: createdAtDate,
          updatedAt: data.updatedAt
            ? new Date(data.updatedAt as string)
            : createdAtDate,
        });
      });

      setSupplierReceipts(receiptsList);

      const productIds = new Set<string>();
      receiptsList.forEach((receipt) => {
        receipt.items.forEach((item) => {
          if (item.productId) productIds.add(item.productId);
        });
      });

      const productsList: Product[] = [];
      for (const productId of Array.from(productIds).slice(0, 24)) {
        try {
          const productData = await fetchDoc<Record<string, unknown>>(
            `businesses/${bid}/products`,
            productId
          );
          if (productData) {
            productsList.push({
              id: productData.id as string,
              name: (productData.name as string) || '',
              sku: productData.sku as string,
              imageUrl: productData.imageUrl as string,
            });
          }
        } catch (error) {
          console.error('Error loading product:', productId, error);
        }
      }

      setSupplierProducts(productsList);
    } catch (error) {
      console.error('Error loading supplier details:', error);
      showToast(t('toast.supplierDetailsFailed') || 'Failed to load details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const formatDate = (timestamp: Date | string | undefined) => {
    if (!timestamp) return '—';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString();
  };

  const handleCreateSupplier = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const bid = await resolveBusinessId();
    if (!bid) {
      showToast(t('toast.businessIdNotFound') || 'Business not found');
      return;
    }

    setIsCreatingSupplier(true);
    try {
      const formData = new FormData(e.currentTarget);
      const supplierName = (formData.get('supplierName') as string)?.trim();
      const businessName = (formData.get('businessName') as string)?.trim();
      const phone = (formData.get('phone') as string)?.trim();
      const email = (formData.get('email') as string)?.trim();
      const address = (formData.get('address') as string)?.trim();
      const paymentTerms = formData.get('paymentTerms') as string;

      if (!supplierName || !businessName || !phone) {
        showToast('Name, business name, and phone are required');
        return;
      }

      const newSupplier = {
        id: crypto.randomUUID(),
        businessId: bid,
        supplierName,
        businessName,
        phone,
        email: email || null,
        address: address || null,
        paymentTerms,
        customPaymentDays: null,
        creditLimit: 0,
        openingBalance: 0,
        currentBalance: 0,
        category: 'general',
        status: 'active',
        taxId: null,
        bankAccount: null,
        contactPerson: null,
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastPurchaseDate: null,
        lastPaymentDate: null,
        totalPurchases: 0,
        totalPayments: 0,
        purchaseCount: 0,
        paymentCount: 0,
        averagePaymentDays: 0,
        creditUtilization: 0,
      };

      await addDoc(`businesses/${bid}/suppliers`, newSupplier);
      showToast(t('toast.supplierCreated') || 'Supplier created');
      setShowAddSupplierModal(false);
      await loadSuppliers();
    } catch (error) {
      console.error('Error creating supplier:', error);
      showToast(t('toast.supplierCreateFailed') || 'Failed to create supplier');
    } finally {
      setIsCreatingSupplier(false);
    }
  };

  const filteredSuppliers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return suppliers.filter((s) => {
      const name = (s.businessName || s.supplierName || '').toLowerCase();
      const phone = (s.phone || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      const matchesSearch =
        !q || name.includes(q) || phone.includes(q) || email.includes(q);
      const bal = s.currentBalance || 0;
      const matchesBalance =
        balanceFilter === 'all' ||
        (balanceFilter === 'owing' && bal > 0) ||
        (balanceFilter === 'clear' && bal <= 0);
      return matchesSearch && matchesBalance;
    });
  }, [suppliers, searchQuery, balanceFilter]);

  const totalOwed = suppliers.reduce((s, x) => s + (x.currentBalance || 0), 0);
  const totalPurchases = suppliers.reduce(
    (s, x) => s + (x.totalPurchases || 0),
    0
  );
  const owingCount = suppliers.filter((x) => (x.currentBalance || 0) > 0).length;

  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Loading suppliers…</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.emptyState}>
          <AlertCircle size={40} className={styles.emptyIconLucide} />
          <h3>Suppliers locked</h3>
          <p>{accessReason || 'Upgrade your plan to manage suppliers'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Suppliers</h1>
          <p className={styles.pageDesc}>
            Contacts, balances, and purchase history
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.iconButton}
            title="Refresh"
            onClick={() => loadSuppliers()}
          >
            <RefreshCw size={18} />
          </button>
          <button
            type="button"
            className={styles.addButton}
            onClick={() => setShowAddSupplierModal(true)}
          >
            <Plus size={18} />
            Add supplier
          </button>
        </div>
      </div>

      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <Users className={styles.summaryIcon} />
          <div>
            <p className={styles.summaryLabel}>Suppliers</p>
            <p className={styles.summaryValue}>{suppliers.length}</p>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <Wallet className={styles.summaryIcon} />
          <div>
            <p className={styles.summaryLabel}>Total purchased</p>
            <p className={styles.summaryValue}>{formatMoney(totalPurchases)}</p>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <AlertCircle
            className={styles.summaryIcon}
            style={{ color: owingCount > 0 ? 'var(--amber, #d97706)' : undefined }}
          />
          <div>
            <p className={styles.summaryLabel}>With balance</p>
            <p className={styles.summaryValue}>{owingCount}</p>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <Receipt className={styles.summaryIcon} />
          <div>
            <p className={styles.summaryLabel}>You owe</p>
            <p
              className={styles.summaryValue}
              style={{ color: totalOwed > 0 ? 'var(--red, #dc2626)' : undefined }}
            >
              {formatMoney(totalOwed)}
            </p>
          </div>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={16} />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search name, phone, email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={balanceFilter}
          onChange={(e) =>
            setBalanceFilter(e.target.value as 'all' | 'owing' | 'clear')
          }
        >
          <option value="all">All balances</option>
          <option value="owing">Outstanding</option>
          <option value="clear">No balance</option>
        </select>
      </div>

      {filteredSuppliers.length === 0 ? (
        <div className={styles.emptyState}>
          <Building2 size={40} className={styles.emptyIconLucide} />
          <h3>{suppliers.length === 0 ? 'No suppliers yet' : 'No matches'}</h3>
          <p>
            {suppliers.length === 0
              ? 'Add a supplier when receiving stock, or create one here'
              : 'Try a different search or filter'}
          </p>
          {suppliers.length === 0 && (
            <button
              type="button"
              className={styles.addButton}
              onClick={() => setShowAddSupplierModal(true)}
            >
              <Plus size={18} />
              Add supplier
            </button>
          )}
        </div>
      ) : (
        <div
          className={`${styles.layout} ${
            selectedSupplier ? styles.layoutWithDetail : ''
          }`}
        >
          <div className={styles.cardsGrid}>
            {filteredSuppliers.map((supplier) => {
              const name = supplier.businessName || supplier.supplierName;
              const owing = (supplier.currentBalance || 0) > 0;
              const selected = selectedSupplier?.id === supplier.id;

              return (
                <button
                  type="button"
                  key={supplier.id}
                  className={`${styles.supplierCard} ${
                    selected ? styles.supplierCardActive : ''
                  } ${owing ? styles.supplierCardOwing : ''}`}
                  onClick={() => handleSupplierClick(supplier)}
                >
                  <div className={styles.cardTop}>
                    <div className={styles.avatar}>
                      <Building2 size={18} />
                    </div>
                    <div className={styles.cardTitleBlock}>
                      <h3 className={styles.supplierName}>{name}</h3>
                      <p className={styles.supplierMeta}>
                        {supplier.purchaseCount || 0} purchases
                        {supplier.lastPurchaseDate
                          ? ` · last ${formatDate(supplier.lastPurchaseDate)}`
                          : ''}
                      </p>
                    </div>
                    {owing && (
                      <span className={styles.owingPill}>Owes</span>
                    )}
                  </div>

                  <div className={styles.cardStats}>
                    <div>
                      <span className={styles.statLabel}>Purchases</span>
                      <span className={styles.statValue}>
                        {formatMoney(supplier.totalPurchases || 0)}
                      </span>
                    </div>
                    <div>
                      <span className={styles.statLabel}>Balance</span>
                      <span
                        className={`${styles.statValue} ${
                          owing ? styles.dangerText : ''
                        }`}
                      >
                        {formatMoney(supplier.currentBalance || 0)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.cardContacts}>
                    {supplier.phone && (
                      <span>
                        <Phone size={12} /> {supplier.phone}
                      </span>
                    )}
                    {supplier.email && (
                      <span>
                        <Mail size={12} /> {supplier.email}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedSupplier && (
            <div className={styles.detailOverlay} role="dialog" aria-modal="true">
              <div
                className={styles.detailBackdrop}
                onClick={() => setSelectedSupplier(null)}
              />
              <aside className={styles.detailPanel}>
                <div className={styles.detailHeader}>
                  <div>
                    <h2 className={styles.detailTitle}>
                      {selectedSupplier.businessName ||
                        selectedSupplier.supplierName}
                    </h2>
                    <p className={styles.detailSub}>
                      {paymentTermsLabel(selectedSupplier.paymentTerms as string)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.closeButton}
                    onClick={() => setSelectedSupplier(null)}
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                {isLoadingDetails ? (
                  <div className={styles.detailLoading}>
                    <Loader2 size={24} className={styles.spin} />
                    <span>Loading details…</span>
                  </div>
                ) : (
                  <>
                    <div className={styles.detailMetrics}>
                      <div className={styles.metric}>
                        <span className={styles.metricLabel}>Total purchases</span>
                        <span className={styles.metricValue}>
                          {formatMoney(selectedSupplier.totalPurchases || 0)}
                        </span>
                      </div>
                      <div className={styles.metric}>
                        <span className={styles.metricLabel}>Orders</span>
                        <span className={styles.metricValue}>
                          {selectedSupplier.purchaseCount || 0}
                        </span>
                      </div>
                      <div className={styles.metric}>
                        <span className={styles.metricLabel}>Balance</span>
                        <span
                          className={`${styles.metricValue} ${
                            (selectedSupplier.currentBalance || 0) > 0
                              ? styles.dangerText
                              : ''
                          }`}
                        >
                          {formatMoney(selectedSupplier.currentBalance || 0)}
                        </span>
                      </div>
                      <div className={styles.metric}>
                        <span className={styles.metricLabel}>Last purchase</span>
                        <span className={styles.metricValue}>
                          {formatDate(selectedSupplier.lastPurchaseDate)}
                        </span>
                      </div>
                    </div>

                    <div className={styles.detailSection}>
                      <h4 className={styles.sectionTitle}>Contact</h4>
                      <ul className={styles.contactList}>
                        {selectedSupplier.phone && (
                          <li>
                            <Phone size={14} /> {selectedSupplier.phone}
                          </li>
                        )}
                        {selectedSupplier.email && (
                          <li>
                            <Mail size={14} /> {selectedSupplier.email}
                          </li>
                        )}
                        {selectedSupplier.address && (
                          <li>
                            <MapPin size={14} /> {selectedSupplier.address}
                          </li>
                        )}
                        {!selectedSupplier.phone &&
                          !selectedSupplier.email &&
                          !selectedSupplier.address && (
                            <li className={styles.muted}>No contact details</li>
                          )}
                      </ul>
                    </div>

                    {supplierProducts.length > 0 && (
                      <div className={styles.detailSection}>
                        <h4 className={styles.sectionTitle}>
                          <Package size={14} /> Products ({supplierProducts.length})
                        </h4>
                        <div className={styles.productsGrid}>
                          {supplierProducts.map((product) => (
                            <div key={product.id} className={styles.productChip}>
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt=""
                                  className={styles.productImage}
                                />
                              ) : (
                                <span className={styles.productPlaceholder}>
                                  <Package size={12} />
                                </span>
                              )}
                              <span className={styles.productName}>
                                {product.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className={styles.detailSection}>
                      <h4 className={styles.sectionTitle}>
                        <Receipt size={14} /> History ({supplierReceipts.length})
                      </h4>
                      {supplierReceipts.length === 0 ? (
                        <p className={styles.muted}>No receipts yet</p>
                      ) : (
                        <div className={styles.receiptsList}>
                          {supplierReceipts.map((receipt) => (
                            <div key={receipt.id} className={styles.receiptCard}>
                              <div className={styles.receiptHeader}>
                                <span className={styles.receiptNumber}>
                                  {receipt.receiptNumber}
                                </span>
                                <span className={styles.receiptDate}>
                                  {formatDate(receipt.receivedDate)}
                                </span>
                              </div>
                              <div className={styles.receiptTotal}>
                                {formatMoney(receipt.total)}
                              </div>
                              <div className={styles.receiptItems}>
                                {receipt.items.slice(0, 3).map((item, index) => (
                                  <div key={index} className={styles.receiptItemLine}>
                                    {item.productName} × {item.quantity}
                                  </div>
                                ))}
                                {receipt.items.length > 3 && (
                                  <div className={styles.receiptItemLine}>
                                    +{receipt.items.length - 3} more
                                  </div>
                                )}
                              </div>
                              {receipt.notes && (
                                <p className={styles.receiptNotes}>{receipt.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </aside>
            </div>
          )}
        </div>
      )}

      {showAddSupplierModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Add supplier</h2>
              <button
                type="button"
                onClick={() => setShowAddSupplierModal(false)}
                className={styles.closeButton}
                disabled={isCreatingSupplier}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier}>
              <div className={styles.form}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Contact name *</label>
                    <input
                      type="text"
                      name="supplierName"
                      className={styles.formInput}
                      required
                      placeholder="Person you deal with"
                      disabled={isCreatingSupplier}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Business name *</label>
                    <input
                      type="text"
                      name="businessName"
                      className={styles.formInput}
                      required
                      placeholder="Company name"
                      disabled={isCreatingSupplier}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      className={styles.formInput}
                      required
                      placeholder="+234…"
                      disabled={isCreatingSupplier}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Email</label>
                    <input
                      type="email"
                      name="email"
                      className={styles.formInput}
                      placeholder="email@example.com"
                      disabled={isCreatingSupplier}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Address</label>
                  <input
                    type="text"
                    name="address"
                    className={styles.formInput}
                    placeholder="Street, city"
                    disabled={isCreatingSupplier}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Payment terms</label>
                  <select
                    name="paymentTerms"
                    className={styles.formInput}
                    defaultValue="net_30"
                    disabled={isCreatingSupplier}
                  >
                    <option value="cash">Cash on delivery</option>
                    <option value="net_7">Net 7 days</option>
                    <option value="net_14">Net 14 days</option>
                    <option value="net_30">Net 30 days</option>
                    <option value="net_60">Net 60 days</option>
                    <option value="net_90">Net 90 days</option>
                  </select>
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    onClick={() => setShowAddSupplierModal(false)}
                    className={styles.cancelButton}
                    disabled={isCreatingSupplier}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingSupplier}
                    className={styles.submitButton}
                  >
                    {isCreatingSupplier ? (
                      <>
                        <Loader2 size={16} className={styles.spin} />
                        Creating…
                      </>
                    ) : (
                      'Create supplier'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

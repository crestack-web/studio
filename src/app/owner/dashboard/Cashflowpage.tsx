'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { fetchDocs, addDoc as sbAddDoc, updateDoc as sbUpdateDoc, runBatch, toISOString } from '@/lib/supabase-client-data';
import { Building2, Package, TrendingDown, Wallet, ArrowUpRight, X, Plus, ShoppingCart, TrendingUp, Banknote } from 'lucide-react';
import styles from './Cashflowpage.module.css';
import CashflowModals from './CashflowModals';

type ActionId = 'add-purchase' | 'reduce-stock' | 'add-money' | 'take-money' | 'add-account' | 'pay-supplier' | null;
type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom';

interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  currentBalance: number;
  isActive: boolean;
  isDefault: boolean;
  isPosDefault?: boolean;
}

interface Supplier {
  id: string;
  supplierName: string;
  businessName: string;
  phone?: string;
  email?: string;
  currentBalance?: number;
}

interface Transaction {
  id: string;
  date: string;
  sortAt: number;
  type: string;
  description: string;
  amount: number;
  credit: boolean;
  accountName?: string;
}

export default function Cashflowpage() {
  const { showToast, user } = useApp();
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();
  const { businessId } = useBranch();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [activeAction, setActiveAction] = useState<ActionId>(null);
  const [stats, setStats] = useState({ cashBalance: 0, stockValue: 0, monthIn: 0, monthOut: 0 });
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [transactionLimit, setTransactionLimit] = useState<number | 'all'>(50);
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>('all');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isAddingPurchase, setIsAddingPurchase] = useState(false);

  const [newAccount, setNewAccount] = useState({ accountName: '', bankName: '', initialBalance: 0, isPosDefault: false });
  const [moneyTransaction, setMoneyTransaction] = useState({ accountId: '', amount: 0, description: '', category: '' });
  const [stockReduction, setStockReduction] = useState({ productId: '', quantity: 0, reason: '' });
  const [stockAddition, setStockAddition] = useState({
    productId: '', quantity: 0, costPrice: 0, description: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    referenceNumber: `PUR-${Date.now().toString().slice(-8)}`,
    warehouse: '', bankAccountId: '', supplierId: '', paymentAmount: 0,
    paymentMethod: 'credit' as 'cash' | 'credit' | 'partial', notes: '',
  });
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', costPrice: 0, sellingPrice: 0, category: '', unit: 'piece' });
  const [supplierPayment, setSupplierPayment] = useState({
    supplierId: '', amount: 0, paymentMethod: 'cash' as 'cash' | 'transfer' | 'pos', bankAccountId: '', description: '',
  });

  useEffect(() => {
    loadProducts();
    loadSuppliers();
    loadPurchases();
  }, [businessId]);

  useEffect(() => {
    loadData();
  }, [businessId, dateFilter, customStartDate, customEndDate, products]);

  const loadProducts = async () => {
    if (!businessId) return;
    try {
      const productsList = await fetchDocs(`businesses/${businessId}/products`, {
        filters: [{ field: 'status', op: '=', value: 'active' }],
      });
      setProducts(productsList.map((data: any) => ({
        id: data.id, ...data, costPrice: data.cost || data.costPrice || 0,
      })));
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadSuppliers = async () => {
    if (!businessId) return;
    try {
      const allSuppliers = await fetchDocs(`businesses/${businessId}/suppliers`);
      setSuppliers(
        allSuppliers
          .filter((data: any) => data.status === 'active')
          .map((data: any) => ({
            id: data.id,
            supplierName: data.supplierName || data.businessName || 'Unnamed Supplier',
            businessName: data.businessName || data.supplierName || 'Unnamed Supplier',
            phone: data.phone || '',
            email: data.email,
            currentBalance: data.currentBalance || 0,
          }))
      );
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const loadPurchases = async () => {
    if (!businessId) return;
    try {
      const rows = await fetchDocs(`businesses/${businessId}/purchases`, {
        orderBy: { field: 'created_at', ascending: false }, limit: 50,
      });
      setPurchases(rows.map((data: any) => {
        const items = Array.isArray(data.items) ? data.items : [];
        const totalCost = Number(data.total ?? data.totalCost ?? data.totalAmount ?? 0) || 0;
        const paidAmount = Number(data.paid ?? data.paidAmount ?? 0) || 0;
        const creditAmount = Number(data.balance ?? data.creditAmount ?? Math.max(0, totalCost - paidAmount)) || 0;
        const paymentMethod =
          creditAmount <= 0 ? 'cash' : paidAmount > 0 ? 'partial' : 'credit';
        return {
          id: data.id,
          receiptNumber: data.receiptNumber || data.note || data.id?.slice?.(-8) || data.id,
          supplierId: data.supplierId || data.supplier_id || null,
          supplierName:
            data.supplierName ||
            suppliers.find((s: any) => s.id === (data.supplierId || data.supplier_id))?.supplierName ||
            'No Supplier',
          items,
          totalQuantity: items.reduce((s: number, i: any) => s + (Number(i.quantity) || 0), 0),
          totalCost,
          paymentMethod: data.paymentMethod || paymentMethod,
          paidAmount,
          creditAmount,
          createdAt: toISOString(data.createdAt || data.created_at) || new Date().toISOString(),
        };
      }));
    } catch (error) {
      console.error('Error loading purchases:', error);
    }
  };

  const handleCreateProduct = async () => {
    if (!businessId) return;
    if (!newProduct.name || !newProduct.costPrice) {
      showToast('Please fill in product name and cost price');
      return;
    }
    try {
      await sbAddDoc(`businesses/${businessId}/products`, {
        name: newProduct.name, cost: newProduct.costPrice,
        sellingPrice: newProduct.sellingPrice || newProduct.costPrice * 1.2,
        category: newProduct.category || 'General', unit: newProduct.unit, stock: 0, active: true,
        createdAt: new Date().toISOString(), createdBy: user?.id || 'system',
        createdByName: user?.name || 'System',
      });
      await loadProducts();
      setStockAddition({ ...stockAddition, costPrice: newProduct.costPrice });
      setNewProduct({ name: '', costPrice: 0, sellingPrice: 0, category: '', unit: 'piece' });
      setShowNewProductForm(false);
      showToast('Product created successfully');
    } catch (error) {
      console.error(error);
      showToast('Failed to create product');
    }
  };

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    switch (dateFilter) {
      case 'today': startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
      case 'week': startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7); break;
      case 'month': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
      case 'custom':
        if (customStartDate && customEndDate) {
          const endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
          return { startDate: new Date(customStartDate), endDate };
        }
        return null;
      default: return null;
    }
    return { startDate, endDate: now };
  };

  const loadData = async () => {
    let resolvedBusinessId = businessId || user?.businessId || '';
    if (!resolvedBusinessId && user?.id) {
      try {
        const { resolveOwnerScopeBusinessId } = await import('@/lib/resolve-business-scope');
        resolvedBusinessId = (await resolveOwnerScopeBusinessId(user.id, user.businessId)) || '';
      } catch (e) {
        console.warn('Cashflow businessId lookup failed', e);
      }
    }
    if (!resolvedBusinessId) { setLoading(false); return; }

    try {
      setLoading(true);
      // FIXED: do not filter is_active column (not in schema — lives in metadata)
      const accountsRaw: any[] = await fetchDocs(`businesses/${resolvedBusinessId}/bankAccounts`);
      const accountsList: BankAccount[] = accountsRaw
        .filter((a) => a.isActive !== false)
        .map((a) => ({
          id: a.id,
          accountName: a.accountName || a.name || 'Account',
          bankName: a.bankName || '',
          currentBalance: Number(a.currentBalance) || 0,
          isActive: a.isActive !== false,
          isDefault: Boolean(a.isDefault || a.isPrimary),
          isPosDefault: Boolean(a.isPosDefault),
        }));
      setBankAccounts(accountsList);

      const dateRange = getDateRange();
      const txFilters: any[] = [];
      if (dateRange && dateFilter !== 'all') {
        txFilters.push(
          { field: 'created_at', op: '>=', value: dateRange.startDate.toISOString() },
          { field: 'created_at', op: '<=', value: dateRange.endDate.toISOString() }
        );
      }

      const expenseFilters: any[] = [];
      if (dateRange && dateFilter !== 'all') {
        expenseFilters.push(
          { field: 'created_at', op: '>=', value: dateRange.startDate.toISOString() },
          { field: 'created_at', op: '<=', value: dateRange.endDate.toISOString() }
        );
      }

      const listLimit = 200;
      const [bankTxDocs, salesDocs, expenseDocs, purchaseDocs, cashFlowDocs] = await Promise.all([
        fetchDocs(`businesses/${resolvedBusinessId}/bankTransactions`, {
          filters: txFilters.length > 0 ? txFilters : undefined,
          orderBy: { field: 'created_at', ascending: false }, limit: listLimit,
        }),
        fetchDocs(`businesses/${resolvedBusinessId}/sales`, {
          filters: dateRange && dateFilter !== 'all'
            ? [
                { field: 'created_at', op: '>=', value: dateRange.startDate.toISOString() },
                { field: 'created_at', op: '<=', value: dateRange.endDate.toISOString() },
              ]
            : undefined,
          orderBy: { field: 'created_at', ascending: false }, limit: listLimit,
        }),
        fetchDocs(`businesses/${resolvedBusinessId}/expenses`, {
          filters: expenseFilters.length > 0 ? expenseFilters : undefined,
          orderBy: { field: 'created_at', ascending: false }, limit: listLimit,
        }),
        fetchDocs(`businesses/${resolvedBusinessId}/purchases`, {
          orderBy: { field: 'created_at', ascending: false }, limit: listLimit,
        }),
        fetchDocs(`businesses/${resolvedBusinessId}/cashFlow`, {
          filters: dateRange && dateFilter !== 'all'
            ? [
                { field: 'created_at', op: '>=', value: dateRange.startDate.toISOString() },
                { field: 'created_at', op: '<=', value: dateRange.endDate.toISOString() },
              ]
            : undefined,
          orderBy: { field: 'created_at', ascending: false }, limit: listLimit,
        }),
      ]);

      const transactionMap = new Map<string, Transaction>();
      const saleIdsInBankTx = new Set<string>();
      let monthIn = 0;
      let monthOut = 0;
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const toTxDate = (raw: unknown): Date => {
        const iso = toISOString(raw);
        if (iso) {
          const d = new Date(iso);
          if (!Number.isNaN(d.getTime())) return d;
        }
        return new Date();
      };
      const fmtTxDate = (d: Date) =>
        d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });

      for (const data of bankTxDocs) {
        const amount = Number(data.amount) || 0;
        const isCredit = data.type === 'money_in' || data.type === 'in' || data.type === 'inflow';
        const date = toTxDate(data.createdAt || data.created_at);
        transactionMap.set(data.id, {
          id: data.id,
          date: fmtTxDate(date),
          sortAt: date.getTime(),
          type: data.category || (isCredit ? 'Money In' : 'Money Out'),
          description: data.description || '',
          amount,
          credit: isCredit,
          accountName: data.accountName || data.account_name || '',
        });
        if (data.saleId) saleIdsInBankTx.add(String(data.saleId));
        if (isCredit) {
          if (date >= monthStart) monthIn += amount;
        } else if (date >= monthStart) {
          monthOut += amount;
        }
      }

      for (const data of salesDocs) {
        const amount = Number(data.totalRevenue ?? data.total ?? data.totalAmount ?? data.total_amount ?? 0) || 0;
        const date = toTxDate(data.createdAt || data.created_at);
        const paymentBreakdown =
          data.paymentBreakdown || data.payment_breakdown || data.metadata?.paymentBreakdown || [];
        let bankPayment = paymentBreakdown
          .filter((p: any) => ['transfer', 'card', 'pos'].includes(p.method))
          .reduce((s: number, p: any) => s + (p.amount || 0), 0);
        let cashPayment = paymentBreakdown
          .filter((p: any) => p.method === 'cash')
          .reduce((s: number, p: any) => s + (p.amount || 0), 0);
        let creditPayment = paymentBreakdown
          .filter((p: any) => p.method === 'credit')
          .reduce((s: number, p: any) => s + (p.amount || 0), 0);
        if (!paymentBreakdown.length && amount > 0) {
          const primary = String(data.paymentMethod || data.payment_method || 'cash').toLowerCase();
          if (['transfer', 'card', 'pos'].includes(primary)) bankPayment = amount;
          else if (primary === 'credit') creditPayment = amount;
          else cashPayment = amount;
        }
        if (bankPayment > 0) {
          transactionMap.set(`sale-${data.id}`, {
            id: `sale-${data.id}`,
            date: fmtTxDate(date),
            sortAt: date.getTime(),
            type: 'Sale',
            description: `Sale #${String(data.id).slice(-6)}`,
            amount: bankPayment,
            credit: true,
            accountName: data.bankAccountId
              ? accountsList.find((a) => a.id === data.bankAccountId)?.accountName
              : 'Default Account',
          });
          if (!saleIdsInBankTx.has(data.id) && date >= monthStart) monthIn += bankPayment;
        }
        if (cashPayment > 0) {
          transactionMap.set(`sale-cash-${data.id}`, {
            id: `sale-cash-${data.id}`,
            date: fmtTxDate(date),
            sortAt: date.getTime(),
            type: 'Cash Sale',
            description: `Sale #${String(data.id).slice(-6)}`,
            amount: cashPayment,
            credit: true,
            accountName: 'Cash',
          });
          if (date >= monthStart) monthIn += cashPayment;
        }
        if (creditPayment > 0 && date >= monthStart) monthIn += creditPayment;
      }

      // Expenses → money out
      for (const data of expenseDocs as any[]) {
        const amount = Number(data.amount) || 0;
        if (amount <= 0) continue;
        const date = toTxDate(data.createdAt || data.created_at || data.date);
        const category = data.category || 'Expense';
        transactionMap.set(`expense-${data.id}`, {
          id: `expense-${data.id}`,
          date: fmtTxDate(date),
          sortAt: date.getTime(),
          type: 'Expense',
          description: data.description || category,
          amount,
          credit: false,
          accountName: data.paymentMethod || data.payment_method || 'Expense',
        });
        if (date >= monthStart) monthOut += amount;
      }

      // cash_flow ledger rows not already covered by expense/purchase sources
      for (const data of cashFlowDocs as any[]) {
        const amount = Number(data.amount) || 0;
        if (amount <= 0) continue;
        const category = String(data.category || '').toLowerCase();
        // Skip duplicates already listed from expenses / purchases tables
        if (category === 'expense' || category === 'purchase' || category === 'purchases') continue;
        const typeRaw = String(data.type || '').toLowerCase();
        const isCredit =
          typeRaw === 'in' ||
          typeRaw === 'inflow' ||
          typeRaw === 'money_in' ||
          typeRaw === 'income';
        const date = toTxDate(data.entryDate || data.entry_date || data.createdAt || data.created_at);
        const id = `cf-${data.id}`;
        if (transactionMap.has(id)) continue;
        transactionMap.set(id, {
          id,
          date: fmtTxDate(date),
          sortAt: date.getTime(),
          type: data.category || (isCredit ? 'Cash In' : 'Cash Out'),
          description: data.description || data.category || 'Cash flow',
          amount,
          credit: isCredit,
          accountName: 'Cash flow',
        });
        if (isCredit) {
          if (date >= monthStart) monthIn += amount;
        } else if (date >= monthStart) {
          monthOut += amount;
        }
      }

      // Purchases from purchases table
      const mappedPurchases = (purchaseDocs as any[]).map((data: any) => {
        const items = Array.isArray(data.items) ? data.items : [];
        const totalCost = Number(data.total ?? data.totalCost ?? data.totalAmount ?? 0) || 0;
        const paidAmount = Number(data.paid ?? data.paidAmount ?? 0) || 0;
        const creditAmount =
          Number(data.balance ?? data.creditAmount ?? Math.max(0, totalCost - paidAmount)) || 0;
        const paymentMethod =
          creditAmount <= 0 ? 'cash' : paidAmount > 0 ? 'partial' : 'credit';
        return {
          id: data.id,
          receiptNumber: data.note || data.id?.slice?.(-8) || data.id,
          supplierId: data.supplierId || data.supplier_id || null,
          supplierName:
            suppliers.find((s: any) => s.id === (data.supplierId || data.supplier_id))?.supplierName ||
            'No Supplier',
          items,
          totalQuantity: items.reduce((s: number, i: any) => s + (Number(i.quantity) || 0), 0),
          totalCost,
          paymentMethod,
          paidAmount,
          creditAmount,
          createdAt: toISOString(data.createdAt || data.created_at) || new Date().toISOString(),
        };
      });
      setPurchases(mappedPurchases);

      for (const purchase of mappedPurchases) {
        if (!purchase.totalCost) continue;
        const purchaseDate = toISOString(purchase.createdAt)
          ? new Date(toISOString(purchase.createdAt)!)
          : new Date();
        const displayAmount =
          purchase.paymentMethod === 'credit'
            ? purchase.totalCost
            : purchase.creditAmount > 0
              ? purchase.creditAmount
              : 0;
        transactionMap.set(`purchase-${purchase.id}`, {
          id: `purchase-${purchase.id}`,
          date: purchaseDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }),
          sortAt: purchaseDate.getTime(),
          type: 'Purchase',
          description: `Purchase ${purchase.receiptNumber} | ${purchase.supplierName}${
            purchase.paymentMethod === 'credit'
              ? ' (credit)'
              : purchase.paymentMethod === 'partial'
                ? ' (partial)'
                : ''
          }`,
          amount: purchase.totalCost,
          credit: false,
          accountName:
            purchase.paymentMethod === 'cash'
              ? 'Cash'
              : purchase.paymentMethod === 'credit'
                ? 'Supplier credit'
                : 'Partial',
        });
        if (displayAmount > 0 && purchaseDate >= monthStart) {
          monthOut += displayAmount;
        }
      }

      const sortedTransactions = Array.from(transactionMap.values()).sort(
        (a, b) => (b.sortAt || 0) - (a.sortAt || 0)
      );
      setTransactions(sortedTransactions);

      const stockValue = products.reduce((sum: number, product: any) => {
        return sum + ((product.stock || 0) * (product.costPrice || product.cost || 0));
      }, 0);
      const totalBankBalance = accountsList.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
      setStats({ cashBalance: totalBankBalance, stockValue, monthIn, monthOut });
    } catch (error) {
      console.error('Error fetching cashflow data:', error);
      showToast('Failed to load cashflow data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async () => {
    if (!businessId) return;
    const duplicate = bankAccounts.find(
      acc => acc.accountName.toLowerCase() === newAccount.accountName.toLowerCase() &&
             acc.bankName.toLowerCase() === newAccount.bankName.toLowerCase()
    );
    if (duplicate) { showToast('An account with this name and bank already exists'); return; }
    if (!newAccount.accountName.trim() || !newAccount.bankName.trim()) {
      showToast('Please fill in all required fields'); return;
    }
    setIsAddingAccount(true);
    try {
      await sbAddDoc(`businesses/${businessId}/bankAccounts`, {
        accountName: newAccount.accountName.trim(), bankName: newAccount.bankName.trim(),
        currentBalance: newAccount.initialBalance, isActive: true,
        isDefault: bankAccounts.length === 0,
        isPosDefault: newAccount.isPosDefault || bankAccounts.length === 0,
        createdAt: new Date().toISOString(),
      });
      showToast('Account added successfully');
      setActiveAction(null);
      setNewAccount({ accountName: '', bankName: '', initialBalance: 0, isPosDefault: false });
      loadData();
    } catch (error) {
      console.error(error);
      showToast('Failed to add account');
    } finally {
      setIsAddingAccount(false);
    }
  };

  const handleAddMoney = async () => {
    if (!businessId) return;
    try {
      const account = bankAccounts.find(a => a.id === moneyTransaction.accountId);
      if (!account) { showToast('Please select an account'); return; }
      const newBalance = account.currentBalance + moneyTransaction.amount;
      await sbUpdateDoc(`businesses/${businessId}/bankAccounts`, moneyTransaction.accountId, { currentBalance: newBalance });
      await sbAddDoc(`businesses/${businessId}/bankTransactions`, {
        transactionNumber: `TXN-${Date.now()}`, bankAccountId: moneyTransaction.accountId,
        accountName: account.accountName, type: 'money_in',
        category: moneyTransaction.category || 'Deposit', amount: moneyTransaction.amount,
        balanceAfter: newBalance, description: moneyTransaction.description, createdAt: new Date().toISOString(),
      });
      showToast('Money added successfully');
      setActiveAction(null);
      setMoneyTransaction({ accountId: '', amount: 0, description: '', category: '' });
      loadData();
    } catch (error) {
      console.error(error);
      showToast('Failed to add money');
    }
  };

  const handleTakeMoney = async () => {
    if (!businessId) return;
    try {
      const account = bankAccounts.find(a => a.id === moneyTransaction.accountId);
      if (!account) { showToast('Please select an account'); return; }
      if (account.currentBalance < moneyTransaction.amount) { showToast('Insufficient balance'); return; }
      const newBalance = account.currentBalance - moneyTransaction.amount;
      await sbUpdateDoc(`businesses/${businessId}/bankAccounts`, moneyTransaction.accountId, { currentBalance: newBalance });
      await sbAddDoc(`businesses/${businessId}/bankTransactions`, {
        transactionNumber: `TXN-${Date.now()}`, bankAccountId: moneyTransaction.accountId,
        accountName: account.accountName, type: 'money_out',
        category: moneyTransaction.category || 'Withdrawal', amount: moneyTransaction.amount,
        balanceAfter: newBalance, description: moneyTransaction.description, createdAt: new Date().toISOString(),
      });
      showToast('Money taken successfully');
      setActiveAction(null);
      setMoneyTransaction({ accountId: '', amount: 0, description: '', category: '' });
      loadData();
    } catch (error) {
      console.error(error);
      showToast('Failed to take money');
    }
  };

  const handleReduceStock = async () => {
    if (!businessId) return;
    try {
      const product = products.find(p => p.id === stockReduction.productId);
      if (!product) { showToast('Please select a product'); return; }
      if (product.stock < stockReduction.quantity) { showToast('Insufficient stock'); return; }
      await sbUpdateDoc(`businesses/${businessId}/products`, stockReduction.productId, {
        stock: product.stock - stockReduction.quantity,
      });
      showToast('Stock reduced successfully');
      setActiveAction(null);
      setStockReduction({ productId: '', quantity: 0, reason: '' });
      loadProducts(); loadData();
    } catch (error) {
      console.error(error);
      showToast('Failed to reduce stock');
    }
  };

  const handleAddPurchase = async () => {
    if (!businessId) return;
    setIsAddingPurchase(true);
    try {
      const product = products.find((p) => p.id === stockAddition.productId);
      if (!product) {
        showToast('Please select a product');
        setIsAddingPurchase(false);
        return;
      }
      if (!stockAddition.quantity || stockAddition.quantity <= 0) {
        showToast('Enter a valid quantity');
        setIsAddingPurchase(false);
        return;
      }
      if (stockAddition.costPrice < 0) {
        showToast('Enter a valid cost price');
        setIsAddingPurchase(false);
        return;
      }

      const purchaseAmount = Number(stockAddition.costPrice) * Number(stockAddition.quantity);
      let paidAmount = 0;
      let creditAmount = 0;
      if (stockAddition.paymentMethod === 'cash') paidAmount = purchaseAmount;
      else if (stockAddition.paymentMethod === 'credit') creditAmount = purchaseAmount;
      else {
        paidAmount = Math.min(Number(stockAddition.paymentAmount) || 0, purchaseAmount);
        creditAmount = Math.max(0, purchaseAmount - paidAmount);
      }

      const supplier = stockAddition.supplierId
        ? suppliers.find((s) => s.id === stockAddition.supplierId)
        : null;
      const supplierName = supplier?.supplierName || supplier?.businessName || 'No Supplier';

      if (creditAmount > 0 && !stockAddition.supplierId) {
        showToast('Select a supplier for credit purchases');
        setIsAddingPurchase(false);
        return;
      }
      if (
        (stockAddition.paymentMethod === 'cash' || stockAddition.paymentMethod === 'partial') &&
        paidAmount > 0 &&
        !stockAddition.bankAccountId
      ) {
        showToast('Select a bank/cash account for the payment');
        setIsAddingPurchase(false);
        return;
      }

      const purchaseItems = [
        {
          productId: product.id,
          productName: product.name,
          quantity: stockAddition.quantity,
          unitCost: stockAddition.costPrice,
          totalCost: purchaseAmount,
        },
      ];
      const purchaseNote = [
        stockAddition.referenceNumber && `Ref: ${stockAddition.referenceNumber}`,
        stockAddition.notes,
        `Payment: ${stockAddition.paymentMethod}`,
        supplierName !== 'No Supplier' ? `Supplier: ${supplierName}` : null,
      ]
        .filter(Boolean)
        .join(' · ');

      // Canonical purchases row
      const purchaseId = await sbAddDoc(`businesses/${businessId}/purchases`, {
        supplierId: stockAddition.supplierId || null,
        items: purchaseItems,
        total: purchaseAmount,
        paid: paidAmount,
        balance: creditAmount,
        status: creditAmount <= 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'open',
        note: purchaseNote || null,
        createdBy: user?.id || null,
        createdAt: new Date().toISOString(),
      });

      // Linked stock receipt (schema: purchase_id, items, note only)
      await sbAddDoc(`businesses/${businessId}/stockReceipts`, {
        purchaseId,
        items: purchaseItems,
        note: purchaseNote || `Stock in: ${product.name} x${stockAddition.quantity}`,
        createdBy: user?.id || null,
        createdAt: new Date().toISOString(),
      });

      // Update product stock + cost
      const currentProduct = await fetchDocs(`businesses/${businessId}/products`, {
        filters: [{ field: 'id', op: '=', value: stockAddition.productId }],
        limit: 1,
      });
      if (currentProduct.length > 0) {
        const currentStock =
          Number(
            (currentProduct[0] as any).stock ??
              (currentProduct[0] as any).stockLevel ??
              (currentProduct[0] as any).stock_level ??
              0
          ) || 0;
        await sbUpdateDoc(`businesses/${businessId}/products`, stockAddition.productId, {
          stock: currentStock + stockAddition.quantity,
          costPrice: stockAddition.costPrice,
        });
      }

      // Cash / partial payment against bank account
      if (paidAmount > 0 && stockAddition.bankAccountId) {
        const accounts = await fetchDocs(`businesses/${businessId}/bankAccounts`, {
          filters: [{ field: 'id', op: '=', value: stockAddition.bankAccountId }],
          limit: 1,
        });
        if (!accounts[0]) throw new Error('Bank account not found');
        const bal = Number((accounts[0] as any).currentBalance) || 0;
        if (bal < paidAmount) throw new Error('Insufficient bank balance');
        await sbUpdateDoc(`businesses/${businessId}/bankAccounts`, stockAddition.bankAccountId, {
          currentBalance: bal - paidAmount,
        });
        await sbAddDoc(`businesses/${businessId}/bankTransactions`, {
          bankAccountId: stockAddition.bankAccountId,
          type: 'money_out',
          amount: paidAmount,
          balanceAfter: bal - paidAmount,
          description: `Purchase: ${product.name} x${stockAddition.quantity}`,
          reference: purchaseId,
          createdAt: new Date().toISOString(),
        });
      }

      // Credit tied to supplier
      if (creditAmount > 0 && stockAddition.supplierId) {
        const currentBal = Number(supplier?.currentBalance) || 0;
        const totalPurchases = Number((supplier as any)?.totalPurchases) || 0;
        const purchaseCount = Number((supplier as any)?.purchaseCount) || 0;
        await sbUpdateDoc(`businesses/${businessId}/suppliers`, stockAddition.supplierId, {
          currentBalance: currentBal + creditAmount,
          totalPurchases: totalPurchases + purchaseAmount,
          purchaseCount: purchaseCount + 1,
          lastPurchaseDate: new Date().toISOString(),
        });
        await sbAddDoc(`businesses/${businessId}/supplierCredit`, {
          supplierId: stockAddition.supplierId,
          amount: creditAmount,
          paid: 0,
          balance: creditAmount,
          status: 'open',
          dueDate: null,
          createdAt: new Date().toISOString(),
        });
      } else if (stockAddition.supplierId) {
        const totalPurchases = Number((supplier as any)?.totalPurchases) || 0;
        const purchaseCount = Number((supplier as any)?.purchaseCount) || 0;
        await sbUpdateDoc(`businesses/${businessId}/suppliers`, stockAddition.supplierId, {
          totalPurchases: totalPurchases + purchaseAmount,
          purchaseCount: purchaseCount + 1,
          lastPurchaseDate: new Date().toISOString(),
        });
      }

      // Cashflow activity (schema-safe)
      await sbAddDoc(`businesses/${businessId}/cashFlow`, {
        type: 'out',
        amount: purchaseAmount,
        category: 'Purchase',
        description: `Purchase: ${product.name} x${stockAddition.quantity}${
          supplierName !== 'No Supplier' ? ` from ${supplierName}` : ''
        }`,
        entryDate: stockAddition.purchaseDate || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      });

      showToast('Purchase recorded successfully');
      setActiveAction(null);
      setStockAddition({
        productId: '',
        quantity: 0,
        costPrice: 0,
        description: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        referenceNumber: `PUR-${Date.now().toString().slice(-8)}`,
        warehouse: '',
        bankAccountId: '',
        supplierId: '',
        paymentAmount: 0,
        paymentMethod: 'credit',
        notes: '',
      });
      loadProducts();
      loadData();
      loadSuppliers();
      loadPurchases();
    } catch (error: any) {
      console.error(error);
      showToast(`Failed to record purchase: ${error.message || 'Unknown error'}`);
    } finally {
      setIsAddingPurchase(false);
    }
  };

  const handlePaySupplier = async () => {
    if (!businessId) return;
    try {
      if (!supplierPayment.supplierId || supplierPayment.amount <= 0) {
        showToast('Please select a supplier and enter a valid amount'); return;
      }
      const supplier = suppliers.find(s => s.id === supplierPayment.supplierId);
      if (!supplier) { showToast('Supplier not found'); return; }
      const paymentAmount = supplierPayment.amount;
      const newBalance = (supplier.currentBalance || 0) - paymentAmount;
      const operations: any[] = [];
      operations.push({
        type: 'update', path: `businesses/${businessId}/suppliers`, id: supplierPayment.supplierId,
        data: { currentBalance: newBalance, lastPaymentDate: new Date().toISOString() },
      });
      if (supplierPayment.bankAccountId) {
        const accounts = await fetchDocs(`businesses/${businessId}/bankAccounts`, {
          filters: [{ field: 'id', op: '=', value: supplierPayment.bankAccountId }], limit: 1,
        });
        if (accounts[0]) {
          const bal = (accounts[0] as any).currentBalance || 0;
          if (bal < paymentAmount) throw new Error('Insufficient bank balance');
          operations.push({
            type: 'update', path: `businesses/${businessId}/bankAccounts`, id: supplierPayment.bankAccountId,
            data: { currentBalance: bal - paymentAmount },
          });
          operations.push({
            type: 'add', path: `businesses/${businessId}/bankTransactions`,
            data: {
              transactionNumber: `TXN-${Date.now()}`, bankAccountId: supplierPayment.bankAccountId,
              accountName: (accounts[0] as any).accountName, type: 'money_out', category: 'Supplier Payment',
              amount: paymentAmount, balanceAfter: bal - paymentAmount,
              description: `Payment to ${supplier.supplierName || supplier.businessName}`,
              createdAt: new Date().toISOString(),
            },
          });
        }
      }
      await runBatch(operations);
      showToast(`Payment of ${formatMoney(paymentAmount)} recorded`);
      setActiveAction(null);
      setSupplierPayment({ supplierId: '', amount: 0, paymentMethod: 'cash', bankAccountId: '', description: '' });
      loadData(); loadSuppliers();
    } catch (error: any) {
      console.error(error);
      showToast(`Failed to pay supplier: ${error.message || 'Unknown error'}`);
    }
  };

  const getTransactionTypes = (): string[] => {
    const types = new Set<string>();
    transactions.forEach(t => types.add(t.type));
    return Array.from(types).sort();
  };

  const getFilteredTransactions = () => {
    if (transactionTypeFilter === 'all') return transactions;
    return transactions.filter(t => t.type === transactionTypeFilter);
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const content = `Cashflow Statement\nGenerated: ${new Date().toLocaleString()}\nCash: ${formatMoney(stats.cashBalance)}\nStock: ${formatMoney(stats.stockValue)}\nIn: ${formatMoney(stats.monthIn)}\nOut: ${formatMoney(stats.monthOut)}\n`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cashflow-statement-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast('Cashflow statement downloaded');
    } catch (error) {
      showToast('Failed to download statement');
    } finally {
      setIsDownloading(false);
    }
  };

  const transactionTypes = getTransactionTypes();

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.heading}>{t('cashflow.title')}</h1>
          <p className={styles.sub}>{t('cashflow.subtitle')}</p>
        </div>
        <button className={styles.downloadBtn} onClick={handleDownloadPDF} disabled={isDownloading || loading || transactions.length === 0}>
          {isDownloading ? 'Downloading...' : 'Download Statement'}
        </button>
      </div>

      <div className={styles.dateFilterBar}>
        {(['all', 'today', 'week', 'month'] as DateFilter[]).map(f => (
          <button key={f} className={`${styles.filterChip} ${dateFilter === f ? styles.filterChipActive : ''}`} onClick={() => setDateFilter(f)}>
            {f === 'all' ? 'All Time' : f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
        <button className={`${styles.filterChip} ${dateFilter === 'custom' ? styles.filterChipActive : ''}`} onClick={() => setDateFilter('custom')}>Custom</button>
        {dateFilter === 'custom' && (
          <div className={styles.customDateRange}>
            <input type="date" className={styles.dateInput} value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} />
            <span>to</span>
            <input type="date" className={styles.dateInput} value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} />
          </div>
        )}
      </div>

      <div className={styles.statsRow}>
        {loading ? (
          <div className={styles.loadingState}>Loading...</div>
        ) : (
          <>
            <div className={styles.statCard}>
              <div className={styles.statTop}>
                <span className={styles.statLabel}>{t('cashflow.cashBalance')}</span>
                <span className={`${styles.statIcon} ${styles.statIconGreen}`}><Banknote size={16} /></span>
              </div>
              <div className={styles.statValue} style={{ color: 'var(--green,#10B981)' }}>{formatMoney(stats.cashBalance)}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statTop}>
                <span className={styles.statLabel}>{t('cashflow.stockValue')}</span>
                <span className={`${styles.statIcon} ${styles.statIconBlue}`}><Package size={16} /></span>
              </div>
              <div className={styles.statValue}>{formatMoney(stats.stockValue)}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statTop}>
                <span className={styles.statLabel}>{t('cashflow.monthIn')}</span>
                <span className={`${styles.statIcon} ${styles.statIconPurple}`}><TrendingUp size={16} /></span>
              </div>
              <div className={styles.statValue} style={{ color: '#10B981' }}>+{formatMoney(stats.monthIn)}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statTop}>
                <span className={styles.statLabel}>{t('cashflow.monthOut')}</span>
                <span className={`${styles.statIcon} ${styles.statIconRed}`}><TrendingDown size={16} /></span>
              </div>
              <div className={styles.statValue} style={{ color: '#EF4444' }}>-{formatMoney(stats.monthOut)}</div>
            </div>
          </>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Bank Accounts</h2>
          <button className={styles.modalButtonPrimary} onClick={() => setActiveAction('add-account')}>
            <Plus size={14} /> Add Account
          </button>
        </div>
        {bankAccounts.length === 0 ? (
          <div className={styles.emptyState}><p>No bank accounts added yet</p></div>
        ) : (
          <div className={styles.accountsList}>
            {bankAccounts.map(account => (
              <div key={account.id} className={styles.accountCard}>
                <div className={styles.accountIcon}><Building2 size={18} /></div>
                <div className={styles.accountInfo}>
                  <h4 className={styles.accountName}>{account.accountName}</h4>
                  <span className={styles.accountBank}>{account.bankName}</span>
                  {account.isDefault && <span className={styles.defaultBadge}>Default</span>}
                  {account.isPosDefault && <span className={styles.posDefaultBadge}>POS</span>}
                </div>
                <div className={styles.accountBalance}>{formatMoney(account.currentBalance)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.actionButtons}>
        <button className={styles.actionButton} onClick={() => setActiveAction('add-purchase')}>
          <span className={styles.actionIcon}><ShoppingCart size={18} /></span><span>Add Purchase</span>
        </button>
        <button className={styles.actionButton} onClick={() => setActiveAction('reduce-stock')}>
          <span className={styles.actionIcon}><TrendingDown size={18} /></span><span>Reduce Stock</span>
        </button>
        <button className={styles.actionButton} onClick={() => setActiveAction('add-money')}>
          <span className={styles.actionIcon}><Wallet size={18} /></span><span>Add Money</span>
        </button>
        <button className={styles.actionButton} onClick={() => setActiveAction('take-money')}>
          <span className={styles.actionIcon}><ArrowUpRight size={18} className={styles.rotateIcon} /></span><span>Take Money</span>
        </button>
        {suppliers.length > 0 && (
          <button className={styles.actionButton} onClick={() => setActiveAction('pay-supplier')}>
            <span className={styles.actionIcon}><Building2 size={18} /></span><span>Pay Supplier</span>
          </button>
        )}
      </div>

      <CashflowModals
        activeAction={activeAction}
        setActiveAction={setActiveAction}
        newAccount={newAccount}
        setNewAccount={setNewAccount}
        handleAddAccount={handleAddAccount}
        isAddingAccount={isAddingAccount}
        moneyTransaction={moneyTransaction}
        setMoneyTransaction={setMoneyTransaction}
        handleAddMoney={handleAddMoney}
        handleTakeMoney={handleTakeMoney}
        bankAccounts={bankAccounts}
        products={products}
        suppliers={suppliers}
        stockAddition={stockAddition}
        setStockAddition={setStockAddition}
        handleAddPurchase={handleAddPurchase}
        isAddingPurchase={isAddingPurchase}
        handleReduceStock={handleReduceStock}
        stockReduction={stockReduction}
        setStockReduction={setStockReduction}
        supplierPayment={supplierPayment}
        setSupplierPayment={setSupplierPayment}
        handlePaySupplier={handlePaySupplier}
        newProduct={newProduct}
        setNewProduct={setNewProduct}
        handleCreateProduct={handleCreateProduct}
        showNewProductForm={showNewProductForm}
        setShowNewProductForm={setShowNewProductForm}
        formatMoney={formatMoney}
        t={t}
        styles={styles}
      />

      <div className={styles.transactionsSection}>
        <div className={styles.txHeader}>
          <h2 className={styles.sectionTitle}>{t('cashflow.recentTransactions')}</h2>
          <div className={styles.txFilters}>
            <span className={styles.txFilterLabel}>Type:</span>
            <div className={styles.chipGroup}>
              <button className={`${styles.chip} ${transactionTypeFilter === 'all' ? styles.chipActive : ''}`} onClick={() => setTransactionTypeFilter('all')}>All</button>
              {transactionTypes.map(type => (
                <button key={type} className={`${styles.chip} ${transactionTypeFilter === type ? styles.chipActive : ''}`} onClick={() => setTransactionTypeFilter(type)}>{type}</button>
              ))}
            </div>
            <span className={styles.txFilterLabel}>Show:</span>
            <div className={styles.chipGroup}>
              {([20, 50, 100, 'all'] as const).map((limitCount) => (
                <button
                  key={String(limitCount)}
                  type="button"
                  className={`${styles.chip} ${transactionLimit === limitCount ? styles.chipActive : ''}`}
                  onClick={() => setTransactionLimit(limitCount)}
                >
                  {limitCount === 'all' ? 'All' : limitCount}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className={styles.txEmpty}>Loading...</div>
        ) : transactions.length === 0 ? (
          <div className={styles.txEmpty}>
            <div className={styles.txEmptyTitle}>{t('cashflow.noTransactions')}</div>
            <div className={styles.txEmptyDesc}>{t('cashflow.addTransactionsFirst')}</div>
          </div>
        ) : (
          <div className={styles.transactionList}>
            {(transactionLimit === 'all'
              ? getFilteredTransactions()
              : getFilteredTransactions().slice(0, transactionLimit)
            ).map((tx) => {
              const isExpanded = expandedTransaction === tx.id;
              return (
                <div key={tx.id} className={styles.transactionCard} onClick={() => setExpandedTransaction(isExpanded ? null : tx.id)}>
                  <div className={styles.txLeft}>
                    <div className={styles.txTop}>
                      <span className={styles.txDate}>{tx.date}</span>
                      <span className={`${styles.txBadge} ${tx.credit ? styles.txIn : styles.txOut}`}>{tx.credit ? 'IN' : 'OUT'}</span>
                    </div>
                    <div className={styles.txBody}>
                      <span className={styles.txAccount}>{tx.type}</span>
                      <span className={styles.txDesc}>{tx.accountName ? `${tx.accountName} — ` : ''}{tx.description || tx.type}</span>
                    </div>
                  </div>
                  <div className={`${styles.txAmount} ${tx.credit ? styles.moneyIn : styles.moneyOut}`}>
                    {tx.credit ? '+' : '-'}{formatMoney(tx.amount)}
                  </div>
                  {isExpanded && (
                    <div className={styles.expandedDetails} onClick={e => e.stopPropagation()}>
                      <div className={styles.expRow}><span className={styles.expLabel}>Type:</span><span className={styles.expValue}>{tx.type}</span></div>
                      <div className={styles.expRow}><span className={styles.expLabel}>Amount:</span><span className={styles.expValue}>{formatMoney(tx.amount)}</span></div>
                      <div className={styles.expRow}><span className={styles.expLabel}>Description:</span><span className={styles.expValue}>{tx.description || 'No description'}</span></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && (() => {
          const filtered = getFilteredTransactions();
          const shown = transactionLimit === 'all' ? filtered.length : Math.min(transactionLimit, filtered.length);
          if (filtered.length <= shown) return null;
          return (
            <div className={styles.txCounter}>
              Showing {shown} of {filtered.length} transactions.
              <button
                type="button"
                className={styles.chip}
                style={{ marginLeft: 8 }}
                onClick={() => setTransactionLimit('all')}
              >
                Show all
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

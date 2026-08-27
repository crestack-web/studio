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
  const [transactionLimit, setTransactionLimit] = useState(5);
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
      const receipts = await fetchDocs(`businesses/${businessId}/stockReceipts`, {
        orderBy: { field: 'created_at', ascending: false }, limit: 50,
      });
      setPurchases(receipts.map((data: any) => ({
        id: data.id, receiptNumber: data.receiptNumber, supplierId: data.supplierId,
        supplierName: data.supplierName, items: data.items || [], totalQuantity: data.totalQuantity,
        totalCost: data.totalCost, paymentMethod: data.paymentMethod, paidAmount: data.paidAmount,
        creditAmount: data.creditAmount, createdAt: toISOString(data.createdAt) || new Date().toISOString(),
      })));
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

      const bankTxDocs = await fetchDocs(`businesses/${resolvedBusinessId}/bankTransactions`, {
        filters: txFilters.length > 0 ? txFilters : undefined,
        orderBy: { field: 'created_at', ascending: false }, limit: 50,
      });

      const transactionMap = new Map<string, Transaction>();
      const saleIdsInBankTx = new Set<string>();
      let monthIn = 0;
      let monthOut = 0;
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      for (const data of bankTxDocs) {
        const amount = data.amount || 0;
        const isCredit = data.type === 'money_in';
        const date = toISOString(data.createdAt) ? new Date(toISOString(data.createdAt)!) : new Date();
        transactionMap.set(data.id, {
          id: data.id,
          date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          type: data.category || 'Other',
          description: data.description || '',
          amount, credit: isCredit, accountName: data.accountName,
        });
        if (data.saleId) saleIdsInBankTx.add(data.saleId);
        if (isCredit) { if (date >= monthStart) monthIn += amount; }
        else { if (date >= monthStart) monthOut += amount; }
      }

      const salesFilters: any[] = [];
      if (dateRange && dateFilter !== 'all') {
        salesFilters.push(
          { field: 'created_at', op: '>=', value: dateRange.startDate.toISOString() },
          { field: 'created_at', op: '<=', value: dateRange.endDate.toISOString() }
        );
      }
      const salesDocs = await fetchDocs(`businesses/${resolvedBusinessId}/sales`, {
        filters: salesFilters.length > 0 ? salesFilters : undefined,
        orderBy: { field: 'created_at', ascending: false }, limit: 50,
      });

      for (const data of salesDocs) {
        const amount = Number(data.totalRevenue ?? data.total ?? data.totalAmount ?? data.total_amount ?? 0) || 0;
        const date = toISOString(data.createdAt || data.created_at)
          ? new Date(toISOString(data.createdAt || data.created_at)!)
          : new Date();
        const paymentBreakdown = data.paymentBreakdown || data.payment_breakdown || data.metadata?.paymentBreakdown || [];
        let bankPayment = paymentBreakdown.filter((p: any) => ['transfer', 'card', 'pos'].includes(p.method)).reduce((s: number, p: any) => s + (p.amount || 0), 0);
        let cashPayment = paymentBreakdown.filter((p: any) => p.method === 'cash').reduce((s: number, p: any) => s + (p.amount || 0), 0);
        let creditPayment = paymentBreakdown.filter((p: any) => p.method === 'credit').reduce((s: number, p: any) => s + (p.amount || 0), 0);
        if (!paymentBreakdown.length && amount > 0) {
          const primary = String(data.paymentMethod || data.payment_method || 'cash').toLowerCase();
          if (['transfer', 'card', 'pos'].includes(primary)) bankPayment = amount;
          else if (primary === 'credit') creditPayment = amount;
          else cashPayment = amount;
        }
        if (bankPayment > 0) {
          transactionMap.set(`sale-${data.id}`, {
            id: `sale-${data.id}`,
            date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            type: 'Sale', description: `Sale #${data.id.slice(-6)}`, amount: bankPayment, credit: true,
            accountName: data.bankAccountId ? accountsList.find(a => a.id === data.bankAccountId)?.accountName : 'Default Account',
          });
          if (!saleIdsInBankTx.has(data.id) && date >= monthStart) monthIn += bankPayment;
        }
        if (cashPayment > 0) {
          transactionMap.set(`sale-cash-${data.id}`, {
            id: `sale-cash-${data.id}`,
            date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            type: 'Cash Sale', description: `Sale #${data.id.slice(-6)}`, amount: cashPayment, credit: true, accountName: 'Cash',
          });
          if (date >= monthStart) monthIn += cashPayment;
        }
        if (creditPayment > 0 && date >= monthStart) monthIn += creditPayment;
      }

      purchases.forEach(purchase => {
        const purchaseDate = toISOString(purchase.createdAt) ? new Date(toISOString(purchase.createdAt)!) : new Date();
        transactionMap.set(`purchase-${purchase.id}`, {
          id: `purchase-${purchase.id}`,
          date: purchaseDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          type: 'Purchase',
          description: `Receipt: ${purchase.receiptNumber} | Supplier: ${purchase.supplierName || 'No supplier'}`,
          amount: purchase.totalCost, credit: false,
          accountName: purchase.paymentMethod === 'cash' ? 'Cash' : 'Bank',
        });
      });

      const sortedTransactions = Array.from(transactionMap.values()).sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
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
      const product = products.find(p => p.id === stockAddition.productId);
      if (!product) { showToast('Please select a product'); setIsAddingPurchase(false); return; }
      const purchaseAmount = stockAddition.costPrice * stockAddition.quantity;
      let paidAmount = 0, creditAmount = 0;
      if (stockAddition.paymentMethod === 'cash') paidAmount = purchaseAmount;
      else if (stockAddition.paymentMethod === 'credit') creditAmount = purchaseAmount;
      else { paidAmount = stockAddition.paymentAmount; creditAmount = purchaseAmount - stockAddition.paymentAmount; }

      const operations: any[] = [];
      const currentProduct = await fetchDocs(`businesses/${businessId}/products`, {
        filters: [{ field: 'id', op: '=', value: stockAddition.productId }], limit: 1,
      });
      if (currentProduct.length > 0) {
        const currentStock = (currentProduct[0] as any).stock || 0;
        operations.push({
          type: 'update', path: `businesses/${businessId}/products`, id: stockAddition.productId,
          data: { stock: currentStock + stockAddition.quantity },
        });
      }
      if ((stockAddition.paymentMethod === 'cash' || stockAddition.paymentMethod === 'partial') && stockAddition.bankAccountId) {
        const accounts = await fetchDocs(`businesses/${businessId}/bankAccounts`, {
          filters: [{ field: 'id', op: '=', value: stockAddition.bankAccountId }], limit: 1,
        });
        if (accounts[0]) {
          const bal = (accounts[0] as any).currentBalance || 0;
          if (bal < paidAmount) throw new Error('Insufficient bank balance');
          operations.push({
            type: 'update', path: `businesses/${businessId}/bankAccounts`, id: stockAddition.bankAccountId,
            data: { currentBalance: bal - paidAmount },
          });
          operations.push({
            type: 'add', path: `businesses/${businessId}/bankTransactions`,
            data: {
              transactionNumber: `TXN-${Date.now()}`, bankAccountId: stockAddition.bankAccountId,
              accountName: (accounts[0] as any).accountName, type: 'money_out',
              category: 'Purchase', amount: paidAmount, balanceAfter: bal - paidAmount,
              description: `Purchase: ${product.name} - ${stockAddition.quantity} units`,
              createdAt: new Date().toISOString(),
            },
          });
        }
      }
      operations.push({
        type: 'add', path: `businesses/${businessId}/stockReceipts`,
        data: {
          receiptNumber: stockAddition.referenceNumber, supplierId: stockAddition.supplierId || null,
          supplierName: suppliers.find(s => s.id === stockAddition.supplierId)?.supplierName || 'No Supplier',
          items: [{ productId: product.id, productName: product.name, quantity: stockAddition.quantity, unitCost: stockAddition.costPrice, totalCost: purchaseAmount }],
          totalQuantity: stockAddition.quantity, totalCost: purchaseAmount,
          paymentMethod: stockAddition.paymentMethod, paidAmount, creditAmount,
          receivedAt: new Date().toISOString(), receivedBy: user?.id || 'system',
          notes: stockAddition.notes, createdAt: new Date().toISOString(),
        },
      });
      await runBatch(operations);
      showToast('Purchase recorded successfully');
      setActiveAction(null);
      setStockAddition({
        productId: '', quantity: 0, costPrice: 0, description: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        referenceNumber: `PUR-${Date.now().toString().slice(-8)}`,
        warehouse: '', bankAccountId: '', supplierId: '', paymentAmount: 0, paymentMethod: 'credit', notes: '',
      });
      loadProducts(); loadData(); loadSuppliers(); loadPurchases();
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
              {[2, 5, 10, 20].map(limitCount => (
                <button key={limitCount} className={`${styles.chip} ${transactionLimit === limitCount ? styles.chipActive : ''}`} onClick={() => setTransactionLimit(limitCount)}>{limitCount}</button>
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
            {getFilteredTransactions().slice(0, transactionLimit).map(tx => {
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

        {!loading && transactions.length > transactionLimit && (
          <div className={styles.txCounter}>
            Showing {transactionLimit} of {transactions.length} transactions. Click a chip to view more.
          </div>
        )}
      </div>
    </div>
  );
}

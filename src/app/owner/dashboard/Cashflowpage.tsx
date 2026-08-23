'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, limit, addDoc, Timestamp, doc, getDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { Building2, Package, TrendingDown, Wallet, ArrowUpRight, X, Plus, ShoppingCart, TrendingUp, Banknote } from 'lucide-react';
import styles from './Cashflowpage.module.css';

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

let firestoreInstance: ReturnType<typeof initializeFirebase>['firestore'] | null = null;

export default function Cashflowpage() {
  const { showToast, user } = useApp();
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();
  const { businessId } = useBranch();
  const { firestore } = React.useMemo(() => {
    if (!firestoreInstance) {
      const initialized = initializeFirebase();
      firestoreInstance = initialized.firestore;
    }
    return { firestore: firestoreInstance };
  }, []);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [activeAction, setActiveAction] = useState<ActionId>(null);
  const [stats, setStats] = useState({
    cashBalance: 0,
    stockValue: 0,
    monthIn: 0,
    monthOut: 0,
  });
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
    paymentMethod: 'credit' as 'cash' | 'credit' | 'partial',
    notes: ''
  });
  
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    costPrice: 0,
    sellingPrice: 0,
    category: '',
    unit: 'piece'
  });
  
  const [supplierPayment, setSupplierPayment] = useState({
    supplierId: '',
    amount: 0,
    paymentMethod: 'cash' as 'cash' | 'transfer' | 'pos',
    bankAccountId: '',
    description: ''
  });

  useEffect(() => {
    loadProducts();
    loadSuppliers();
    loadPurchases();
  }, [businessId, firestore]);

  useEffect(() => {
    loadData();
  }, [businessId, firestore, dateFilter, customStartDate, customEndDate, products]);

  const loadProducts = async () => {
    if (!businessId || !firestore) return;
    try {
      const productsQuery = query(
        collection(firestore, 'businesses', businessId, 'products'),
        where('active', '==', true)
      );
      const productsSnapshot = await getDocs(productsQuery);
      const productsList: any[] = [];
      productsSnapshot.forEach(doc => {
        const data = doc.data();
        productsList.push({
          id: doc.id,
          ...data,
          costPrice: data.cost || data.costPrice || 0,
        });
      });
      setProducts(productsList);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadSuppliers = async () => {
    if (!businessId || !firestore) return;
    try {
      const suppliersSnapshot = await getDocs(collection(firestore, 'businesses', businessId, 'suppliers'));
      const suppliersList: Supplier[] = [];
      suppliersSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.status === 'active') {
          suppliersList.push({
            id: doc.id,
            supplierName: data.supplierName || data.businessName || 'Unnamed Supplier',
            businessName: data.businessName || data.supplierName || 'Unnamed Supplier',
            phone: data.phone || '',
            email: data.email,
            currentBalance: data.currentBalance || 0,
          });
        }
      });
      setSuppliers(suppliersList);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const loadPurchases = async () => {
    if (!businessId || !firestore) return;
    try {
      const receiptsQuery = query(
        collection(firestore, 'businesses', businessId, 'stockReceipts'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const receiptsSnapshot = await getDocs(receiptsQuery);
      const purchasesList: any[] = [];
      receiptsSnapshot.forEach(doc => {
        const data = doc.data();
        purchasesList.push({
          id: doc.id,
          receiptNumber: data.receiptNumber,
          supplierId: data.supplierId,
          supplierName: data.supplierName,
          items: data.items || [],
          totalQuantity: data.totalQuantity,
          totalCost: data.totalCost,
          paymentMethod: data.paymentMethod,
          paidAmount: data.paidAmount,
          creditAmount: data.creditAmount,
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });
      setPurchases(purchasesList);
    } catch (error) {
      console.error('Error loading purchases:', error);
    }
  };

  const handleCreateProduct = async () => {
    if (!businessId || !firestore) return;
    if (!newProduct.name || !newProduct.costPrice) {
      showToast('Please fill in product name and cost price');
      return;
    }

    try {
      const productRef = await addDoc(collection(firestore, 'businesses', businessId, 'products'), {
        name: newProduct.name,
        cost: newProduct.costPrice,
        sellingPrice: newProduct.sellingPrice || newProduct.costPrice * 1.2,
        category: newProduct.category || 'General',
        unit: newProduct.unit,
        stock: 0,
        active: true,
        createdAt: Timestamp.now(),
        createdBy: user?.id || 'system',
        createdByName: user?.name || 'System',
      });

      await loadProducts();
      setStockAddition({ ...stockAddition, productId: productRef.id, costPrice: newProduct.costPrice });
      setNewProduct({ name: '', costPrice: 0, sellingPrice: 0, category: '', unit: 'piece' });
      setShowNewProductForm(false);
      showToast('Product created successfully');
    } catch (error) {
      console.error('Error creating product:', error);
      showToast('Failed to create product');
    }
  };

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;

    switch (dateFilter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
          return { startDate, endDate };
        }
        return null;
      default:
        return null;
    }

    return { startDate, endDate: now };
  };

  const loadData = async () => {
    if (!businessId || !firestore) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const accountsQuery = query(
        collection(firestore, 'businesses', businessId, 'bankAccounts'),
        where('isActive', '==', true)
      );
      
      const accountsSnapshot = await getDocs(accountsQuery);
      const accountsList: BankAccount[] = [];
      
      accountsSnapshot.forEach(doc => {
        const data = doc.data();
        accountsList.push({
          id: doc.id,
          accountName: data.accountName,
          bankName: data.bankName,
          currentBalance: data.currentBalance,
          isActive: data.isActive,
          isDefault: data.isDefault,
          isPosDefault: data.isPosDefault,
        });
      });
      
      setBankAccounts(accountsList);
      
      const dateRange = getDateRange();
      let transactionsQuery = query(
        collection(firestore, 'businesses', businessId, 'bankTransactions'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      if (dateRange && dateFilter !== 'all') {
        transactionsQuery = query(
          collection(firestore, 'businesses', businessId, 'bankTransactions'),
          where('createdAt', '>=', Timestamp.fromDate(dateRange.startDate)),
          where('createdAt', '<=', Timestamp.fromDate(dateRange.endDate)),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
      }

      const snapshot = await getDocs(transactionsQuery);
      
      const transactionMap = new Map<string, Transaction>();
      const saleIdsInBankTx = new Set<string>();
      let cashBalance = 0;
      let monthIn = 0;
      let monthOut = 0;
      
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const amount = data.amount || 0;
        const isCredit = data.type === 'money_in';
        const date = data.createdAt?.toDate() || new Date();

        transactionMap.set(doc.id, {
          id: doc.id,
          date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          type: data.category || 'Other',
          description: data.description || '',
          amount: amount,
          credit: isCredit,
          accountName: data.accountName,
        });

        if (data.saleId) saleIdsInBankTx.add(data.saleId);
        
        if (isCredit) {
          cashBalance += amount;
          if (date >= monthStart) monthIn += amount;
        } else {
          cashBalance -= amount;
          if (date >= monthStart) monthOut += amount;
        }
      });

      let salesQuery = query(
        collection(firestore, 'businesses', businessId, 'sales'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      if (dateRange && dateFilter !== 'all') {
        salesQuery = query(
          collection(firestore, 'businesses', businessId, 'sales'),
          where('createdAt', '>=', Timestamp.fromDate(dateRange.startDate)),
          where('createdAt', '<=', Timestamp.fromDate(dateRange.endDate)),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
      }

      const salesSnapshot = await getDocs(salesQuery);
      
      salesSnapshot.forEach(doc => {
        const data = doc.data();
        const amount = data.totalRevenue || data.totalAmount || 0;
        const date = data.createdAt?.toDate() || new Date();

        const paymentBreakdown = data.paymentBreakdown || [];
        const bankPayment = paymentBreakdown
          .filter((p: any) => ['transfer', 'card', 'pos'].includes(p.method))
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        const cashPayment = paymentBreakdown
          .filter((p: any) => p.method === 'cash')
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        const creditPayment = paymentBreakdown
          .filter((p: any) => p.method === 'credit')
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        
        if (bankPayment > 0) {
          transactionMap.set(`sale-${doc.id}`, {
            id: `sale-${doc.id}`,
            date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            type: 'Sale',
            description: `Sale #${doc.id.slice(-6)}`,
            amount: bankPayment,
            credit: true,
            accountName: data.bankAccountId ? accountsList.find(a => a.id === data.bankAccountId)?.accountName : 'Default Account',
          });
          
          if (!saleIdsInBankTx.has(doc.id)) {
            cashBalance += bankPayment;
            if (date >= monthStart) monthIn += bankPayment;
          }
        }
        
        if (cashPayment > 0) {
          transactionMap.set(`sale-cash-${doc.id}`, {
            id: `sale-cash-${doc.id}`,
            date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            type: 'Cash Sale',
            description: `Sale #${doc.id.slice(-6)}`,
            amount: cashPayment,
            credit: true,
            accountName: 'Cash',
          });
          
          if (date >= monthStart) monthIn += cashPayment;
        }
        
        if (creditPayment > 0 && date >= monthStart) {
          monthIn += creditPayment;
        }
      });
      
      let expensesQuery = query(
        collection(firestore, 'businesses', businessId, 'expenses'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      if (dateRange && dateFilter !== 'all') {
        expensesQuery = query(
          collection(firestore, 'businesses', businessId, 'expenses'),
          where('createdAt', '>=', Timestamp.fromDate(dateRange.startDate)),
          where('createdAt', '<=', Timestamp.fromDate(dateRange.endDate)),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
      }

      const expensesSnapshot = await getDocs(expensesQuery);
      
      for (const expenseDoc of expensesSnapshot.docs) {
        const data = expenseDoc.data();
        const amount = data.amount || 0;
        const date = data.createdAt?.toDate() || new Date();

        const isBankPayment = data.paymentMethod === 'Bank Transfer' || 
                              data.paymentMethod === 'POS / Card';
        
        transactionMap.set(`expense-${expenseDoc.id}`, {
          id: `expense-${expenseDoc.id}`,
          date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          type: data.category || 'Expense',
          description: data.description || `Expense: ${data.category}`,
          amount: amount,
          credit: false,
          accountName: isBankPayment ? accountsList.find(a => a.isDefault || a.isPosDefault)?.accountName : 'Cash',
        });
        
        if (date >= monthStart) monthOut += amount;
        
        if (isBankPayment) {
          const defaultAccount = accountsList.find(a => a.isDefault || a.isPosDefault) || accountsList[0];
          if (defaultAccount && defaultAccount.currentBalance >= amount) {
            const newBalance = defaultAccount.currentBalance - amount;
            await updateDoc(doc(firestore, 'businesses', businessId, 'bankAccounts', defaultAccount.id), {
              currentBalance: newBalance,
            });
            
            const transactionData = {
              transactionNumber: `EXP-${Date.now()}`,
              bankAccountId: defaultAccount.id,
              accountName: defaultAccount.accountName,
              type: 'money_out',
              category: data.category || 'Expense',
              amount: amount,
              balanceAfter: newBalance,
              description: data.description || `Expense: ${data.category}`,
              createdAt: Timestamp.now(),
            };
            await addDoc(collection(firestore, 'businesses', businessId, 'bankTransactions'), transactionData);
          }
        }
      }
      
      purchases.forEach(purchase => {
        const purchaseDate = purchase.createdAt?.toDate() || new Date();
        transactionMap.set(`purchase-${purchase.id}`, {
          id: `purchase-${purchase.id}`,
          date: purchaseDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          type: 'Purchase',
          description: `Receipt: ${purchase.receiptNumber} | Supplier: ${purchase.supplierName || 'No supplier'}`,
          amount: purchase.totalCost,
          credit: false,
          accountName: purchase.paymentMethod === 'cash' ? 'Cash' : 'Bank',
        });
      });

      const sortedTransactions = Array.from(transactionMap.values()).sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });
      
      setTransactions(sortedTransactions);

      const stockValue = products.reduce((sum: number, product: any) => {
        const stock = product.stock || 0;
        const costPrice = product.costPrice || product.cost || 0;
        return sum + (stock * costPrice);
      }, 0);
      
      const totalBankBalance = accountsList.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
      
      setStats({
        cashBalance: totalBankBalance,
        stockValue,
        monthIn,
        monthOut,
      });
    } catch (error) {
      console.error('Error fetching cashflow data:', error);
      showToast('Failed to load cashflow data');
    } finally {
      setLoading(false);
    }
  };

  function toggle(id: ActionId) {
    setActiveAction(prev => prev === id ? null : id);
  }

  function confirm(msg: string) {
    showToast(`✅ ${msg}`);
    setActiveAction(null);
  }

  const handleAddAccount = async () => {
    if (!businessId || !firestore) return;
    
    const duplicate = bankAccounts.find(
      acc => acc.accountName.toLowerCase() === newAccount.accountName.toLowerCase() && 
             acc.bankName.toLowerCase() === newAccount.bankName.toLowerCase()
    );
    
    if (duplicate) {
      showToast('❌ An account with this name and bank already exists');
      return;
    }
    
    if (!newAccount.accountName.trim() || !newAccount.bankName.trim()) {
      showToast('❌ Please fill in all required fields');
      return;
    }
    
    setIsAddingAccount(true);
    try {
      const accountData = {
        accountName: newAccount.accountName.trim(),
        bankName: newAccount.bankName.trim(),
        currentBalance: newAccount.initialBalance,
        isActive: true,
        isDefault: bankAccounts.length === 0,
        isPosDefault: newAccount.isPosDefault || bankAccounts.length === 0,
        createdAt: Timestamp.now(),
      };
      await addDoc(collection(firestore, 'businesses', businessId, 'bankAccounts'), accountData);
      showToast('✅ Account added successfully');
      setActiveAction(null);
      setNewAccount({ accountName: '', bankName: '', initialBalance: 0, isPosDefault: false });
      loadData();
    } catch (error) {
      console.error('Error adding account:', error);
      showToast('❌ Failed to add account');
    } finally {
      setIsAddingAccount(false);
    }
  };

  const handleAddMoney = async () => {
    if (!businessId || !firestore) return;
    try {
      const account = bankAccounts.find(a => a.id === moneyTransaction.accountId);
      if (!account) {
        showToast('❌ Please select an account');
        return;
      }

      const newBalance = account.currentBalance + moneyTransaction.amount;
      await updateDoc(doc(firestore, 'businesses', businessId, 'bankAccounts', moneyTransaction.accountId), {
        currentBalance: newBalance,
      });

      const transactionData = {
        transactionNumber: `TXN-${Date.now()}`,
        bankAccountId: moneyTransaction.accountId,
        accountName: account.accountName,
        type: 'money_in',
        category: moneyTransaction.category || 'Deposit',
        amount: moneyTransaction.amount,
        balanceAfter: newBalance,
        description: moneyTransaction.description,
        createdAt: Timestamp.now(),
      };
      await addDoc(collection(firestore, 'businesses', businessId, 'bankTransactions'), transactionData);
      showToast('✅ Money added successfully');
      setActiveAction(null);
      setMoneyTransaction({ accountId: '', amount: 0, description: '', category: '' });
      loadData();
    } catch (error) {
      console.error('Error adding money:', error);
      showToast('❌ Failed to add money');
    }
  };

  const handleTakeMoney = async () => {
    if (!businessId || !firestore) return;
    try {
      const account = bankAccounts.find(a => a.id === moneyTransaction.accountId);
      if (!account) {
        showToast('❌ Please select an account');
        return;
      }

      if (account.currentBalance < moneyTransaction.amount) {
        showToast('❌ Insufficient balance');
        return;
      }

      const newBalance = account.currentBalance - moneyTransaction.amount;
      await updateDoc(doc(firestore, 'businesses', businessId, 'bankAccounts', moneyTransaction.accountId), {
        currentBalance: newBalance,
      });

      const transactionData = {
        transactionNumber: `TXN-${Date.now()}`,
        bankAccountId: moneyTransaction.accountId,
        accountName: account.accountName,
        type: 'money_out',
        category: moneyTransaction.category || 'Withdrawal',
        amount: moneyTransaction.amount,
        balanceAfter: newBalance,
        description: moneyTransaction.description,
        createdAt: Timestamp.now(),
      };
      await addDoc(collection(firestore, 'businesses', businessId, 'bankTransactions'), transactionData);
      showToast('✅ Money taken successfully');
      setActiveAction(null);
      setMoneyTransaction({ accountId: '', amount: 0, description: '', category: '' });
      loadData();
    } catch (error) {
      console.error('Error taking money:', error);
      showToast('❌ Failed to take money');
    }
  };

  const handleReduceStock = async () => {
    if (!businessId || !firestore) return;
    try {
      const product = products.find(p => p.id === stockReduction.productId);
      if (!product) {
        showToast('❌ Please select a product');
        return;
      }

      if (product.stock < stockReduction.quantity) {
        showToast('❌ Insufficient stock');
        return;
      }

      const newStock = product.stock - stockReduction.quantity;
      await updateDoc(doc(firestore, 'businesses', businessId, 'products', stockReduction.productId), {
        stock: newStock,
      });

      if (bankAccounts.length > 0) {
        const defaultAccount = bankAccounts.find(a => a.isDefault) || bankAccounts[0];
        const transactionData = {
          transactionNumber: `STK-${Date.now()}`,
          bankAccountId: defaultAccount.id,
          accountName: defaultAccount.accountName,
          type: 'money_out',
          category: 'Stock Reduction',
          amount: product.costPrice * stockReduction.quantity,
          balanceAfter: defaultAccount.currentBalance,
          description: `Stock reduction: ${product.name} - ${stockReduction.quantity} units. Reason: ${stockReduction.reason}`,
          createdAt: Timestamp.now(),
        };
        await addDoc(collection(firestore, 'businesses', businessId, 'bankTransactions'), transactionData);
      }

      showToast('✅ Stock reduced successfully');
      setActiveAction(null);
      setStockReduction({ productId: '', quantity: 0, reason: '' });
      loadProducts();
      loadData();
    } catch (error) {
      console.error('Error reducing stock:', error);
      showToast('❌ Failed to reduce stock');
    }
  };

  const handleAddPurchase = async () => {
    if (!businessId || !firestore) return;
    setIsAddingPurchase(true);
    try {
      const product = products.find(p => p.id === stockAddition.productId);
      if (!product) {
        showToast('❌ Please select a product');
        setIsAddingPurchase(false);
        return;
      }

      const purchaseAmount = stockAddition.costPrice * stockAddition.quantity;
      
      let paidAmount = 0;
      let creditAmount = 0;
      let paymentMethod = 'cash';

      if (stockAddition.paymentMethod === 'partial') {
        if (stockAddition.paymentAmount <= 0 || stockAddition.paymentAmount >= purchaseAmount) {
          showToast('❌ Partial payment amount must be greater than 0 and less than total');
          setIsAddingPurchase(false);
          return;
        }
        paidAmount = stockAddition.paymentAmount;
        creditAmount = purchaseAmount - stockAddition.paymentAmount;
        paymentMethod = 'partial';
      } else if (stockAddition.paymentMethod === 'cash') {
        paidAmount = purchaseAmount;
        creditAmount = 0;
        paymentMethod = 'cash';
      } else if (stockAddition.paymentMethod === 'credit') {
        paidAmount = 0;
        creditAmount = purchaseAmount;
        paymentMethod = 'credit';
      }

      await runTransaction(firestore, async (transaction) => {
        const productRef = doc(firestore, 'businesses', businessId, 'products', stockAddition.productId);
        const productDoc = await transaction.get(productRef);
        
        let accountDoc: any = null;
        let accountRef: any = null;
        if (stockAddition.bankAccountId && (stockAddition.paymentMethod === 'cash' || stockAddition.paymentMethod === 'partial')) {
          accountRef = doc(firestore, 'businesses', businessId, 'bankAccounts', stockAddition.bankAccountId);
          accountDoc = await transaction.get(accountRef);
        }
        
        let supplierDoc: any = null;
        let supplierRef: any = null;
        if (stockAddition.supplierId) {
          supplierRef = doc(firestore, 'businesses', businessId, 'suppliers', stockAddition.supplierId);
          supplierDoc = await transaction.get(supplierRef);
        }

        if (productDoc.exists()) {
          const currentStock = productDoc.data().stock || 0;
          transaction.update(productRef, {
            stock: currentStock + stockAddition.quantity,
          });
        }

        if (stockAddition.paymentMethod === 'cash' || stockAddition.paymentMethod === 'partial') {
          if (stockAddition.bankAccountId && accountDoc && accountDoc.exists()) {
            const currentBalance = accountDoc.data().currentBalance || 0;
            if (currentBalance < paidAmount) {
              throw new Error('Insufficient bank balance');
            }
            transaction.update(accountRef, {
              currentBalance: currentBalance - paidAmount,
            });

            const bankTxnRef = doc(collection(firestore, 'businesses', businessId, 'bankTransactions'));
            transaction.set(bankTxnRef, {
              transactionNumber: `TXN-${Date.now()}`,
              bankAccountId: stockAddition.bankAccountId,
              accountName: accountDoc.data().accountName,
              type: 'money_out',
              category: stockAddition.paymentMethod === 'partial' ? 'Purchase Payment' : 'Purchase',
              amount: paidAmount,
              balanceAfter: currentBalance - paidAmount,
              description: stockAddition.paymentMethod === 'partial' 
                ? `Partial payment: ${product.name} - ${stockAddition.quantity} units`
                : `Purchase: ${product.name} - ${stockAddition.quantity} units`,
              createdAt: Timestamp.now(),
            });
          }
        }

        let supplierName = 'No Supplier';
        if (stockAddition.supplierId && supplierDoc && supplierDoc.exists()) {
          const supplierData = supplierDoc.data();
          supplierName = supplierData.supplierName || supplierData.name || 'Unknown Supplier';
          const currentBalance = supplierData.currentBalance || 0;
          const newBalance = currentBalance + creditAmount;

          transaction.update(supplierRef, {
            currentBalance: newBalance,
            totalPurchases: (supplierData.totalPurchases || 0) + purchaseAmount,
            totalPayments: (supplierData.totalPayments || 0) + paidAmount,
            purchaseCount: (supplierData.purchaseCount || 0) + 1,
            paymentCount: paidAmount > 0 ? (supplierData.paymentCount || 0) + 1 : supplierData.paymentCount,
            lastPurchaseDate: Timestamp.now(),
            lastPaymentDate: paidAmount > 0 ? Timestamp.now() : supplierData.lastPaymentDate,
          });

          const ledgerRef = doc(collection(firestore, 'businesses', businessId, 'supplierLedger'));
          transaction.set(ledgerRef, {
            supplierId: stockAddition.supplierId,
            businessId: businessId,
            type: 'purchase',
            amount: purchaseAmount,
            balanceAfter: newBalance,
            description: `Purchase: ${product.name} - ${stockAddition.quantity} units`,
            reference: stockAddition.referenceNumber,
            date: Timestamp.now(),
            createdAt: Timestamp.now(),
            createdBy: user?.id || 'system',
            createdByName: user?.name || 'System',
            metadata: {
              productId: product.id,
              productName: product.name,
              quantity: stockAddition.quantity,
              unitCost: stockAddition.costPrice,
              paidAmount,
              creditAmount,
              paymentMethod,
              purchaseDate: stockAddition.purchaseDate,
              notes: stockAddition.notes,
            },
          });

          if (paidAmount > 0) {
            const paymentLedgerRef = doc(collection(firestore, 'businesses', businessId, 'supplierLedger'));
            transaction.set(paymentLedgerRef, {
              supplierId: stockAddition.supplierId,
              businessId: businessId,
              type: 'payment',
              amount: paidAmount,
              balanceAfter: newBalance,
              description: `Payment for purchase: ${product.name}`,
              reference: `PAY-${Date.now()}`,
              date: Timestamp.now(),
              createdAt: Timestamp.now(),
              createdBy: user?.id || 'system',
              createdByName: user?.name || 'System',
              metadata: {
                productId: product.id,
                productName: product.name,
                paymentMethod,
              },
            });
          }
        }

        const receiptRef = doc(collection(firestore, 'businesses', businessId, 'stockReceipts'));
        transaction.set(receiptRef, {
          receiptNumber: stockAddition.referenceNumber,
          supplierId: stockAddition.supplierId || null,
          supplierName: supplierName,
          items: [{
            productId: product.id,
            productName: product.name,
            quantity: stockAddition.quantity,
            unitCost: stockAddition.costPrice,
            totalCost: purchaseAmount,
          }],
          totalQuantity: stockAddition.quantity,
          totalCost: purchaseAmount,
          paymentMethod,
          paidAmount,
          creditAmount,
          receivedAt: new Date().toISOString(),
          receivedBy: user?.id || 'system',
          receivedByName: user?.name || 'System',
          notes: stockAddition.notes,
          createdAt: Timestamp.now(),
        });
      });

      showToast(`✅ Purchase recorded successfully${creditAmount > 0 ? ` - ${formatMoney(creditAmount)} added to credit` : ''}`);
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
        notes: ''
      });
      loadProducts();
      loadData();
      loadSuppliers();
      loadPurchases();
    } catch (error: any) {
      console.error('Error recording purchase:', error);
      showToast(`❌ Failed to record purchase: ${error.message || 'Unknown error'}`);
    } finally {
      setIsAddingPurchase(false);
    }
  };

  const handlePaySupplier = async () => {
    if (!businessId || !firestore) return;
    try {
      if (!supplierPayment.supplierId || supplierPayment.amount <= 0) {
        showToast('❌ Please select a supplier and enter a valid amount');
        return;
      }

      const supplier = suppliers.find(s => s.id === supplierPayment.supplierId);
      if (!supplier) {
        showToast('❌ Supplier not found');
        return;
      }

      if (supplier.currentBalance && supplier.currentBalance < supplierPayment.amount) {
        showToast('❌ Payment amount exceeds supplier balance');
        return;
      }

      const paymentAmount = supplierPayment.amount;
      const newBalance = (supplier.currentBalance || 0) - paymentAmount;

      await runTransaction(firestore, async (transaction) => {
        const supplierRef = doc(firestore, 'businesses', businessId, 'suppliers', supplierPayment.supplierId);
        const supplierDoc = await transaction.get(supplierRef);
        
        if (supplierDoc.exists()) {
          const supplierData = supplierDoc.data();
          transaction.update(supplierRef, {
            currentBalance: newBalance,
            totalPayments: (supplierData.totalPayments || 0) + paymentAmount,
            paymentCount: (supplierData.paymentCount || 0) + 1,
            lastPaymentDate: Timestamp.now(),
          });

          const ledgerRef = doc(collection(firestore, 'businesses', businessId, 'supplierLedger'));
          transaction.set(ledgerRef, {
            supplierId: supplierPayment.supplierId,
            businessId: businessId,
            type: 'payment',
            amount: paymentAmount,
            balanceAfter: newBalance,
            description: supplierPayment.description || `Payment to ${supplier.supplierName || supplier.businessName}`,
            reference: `PAY-${Date.now()}`,
            date: Timestamp.now(),
            createdAt: Timestamp.now(),
            createdBy: user?.id || 'system',
            createdByName: user?.name || 'System',
            metadata: {
              paymentMethod: supplierPayment.paymentMethod,
            },
          });

          if (supplierPayment.bankAccountId && (supplierPayment.paymentMethod === 'cash' || supplierPayment.paymentMethod === 'transfer' || supplierPayment.paymentMethod === 'pos')) {
            const accountRef = doc(firestore, 'businesses', businessId, 'bankAccounts', supplierPayment.bankAccountId);
            const accountDoc = await transaction.get(accountRef);
            if (accountDoc.exists()) {
              const currentBalance = accountDoc.data().currentBalance || 0;
              if (currentBalance < paymentAmount) {
                throw new Error('Insufficient bank balance');
              }
              transaction.update(accountRef, {
                currentBalance: currentBalance - paymentAmount,
              });

              const bankTxnRef = doc(collection(firestore, 'businesses', businessId, 'bankTransactions'));
              transaction.set(bankTxnRef, {
                transactionNumber: `TXN-${Date.now()}`,
                bankAccountId: supplierPayment.bankAccountId,
                accountName: accountDoc.data().accountName,
                type: 'money_out',
                category: 'Supplier Payment',
                amount: paymentAmount,
                balanceAfter: currentBalance - paymentAmount,
                description: `Payment to ${supplier.supplierName || supplier.businessName}`,
                createdAt: Timestamp.now(),
              });
            }
          }
        }
      });

      showToast(`✅ Payment of ${formatMoney(paymentAmount)} made to ${supplier.supplierName || supplier.businessName}`);
      setActiveAction(null);
      setSupplierPayment({
        supplierId: '',
        amount: 0,
        paymentMethod: 'cash',
        bankAccountId: '',
        description: ''
      });
      loadData();
      loadSuppliers();
    } catch (error: any) {
      console.error('Error paying supplier:', error);
      showToast(`❌ Failed to pay supplier: ${error.message || 'Unknown error'}`);
    }
  };

  function handleSubmit(e: React.FormEvent, action: string) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const amount = formData.get('amount') as string;
    const description = formData.get('description') as string;
    
    if (!amount || !description) {
      showToast('❌ Please fill all fields');
      return;
    }
    
    confirm(`${action}: ${description} - ${formatMoney(parseFloat(amount))}`);
  }

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
      const statementContent = `Cashflow Statement\n==================\nGenerated: ${new Date().toLocaleString()}\nDate Range: ${dateFilter === 'custom' ? `${customStartDate} to ${customEndDate}` : dateFilter}\n\nSUMMARY\n-------\nCash Balance: ${formatMoney(stats.cashBalance)}\nStock Value: ${formatMoney(stats.stockValue)}\nMonth In: +${formatMoney(stats.monthIn)}\nMonth Out: -${formatMoney(stats.monthOut)}\n\nTRANSACTIONS (${transactions.length} total)\n-----------\n${transactions.map(t => `${t.date} | ${t.type} | ${t.credit ? 'IN' : 'OUT'} | ${formatMoney(t.amount)}\n  Account: ${t.accountName || 'N/A'}\n  Description: ${t.description}\n`).join('\n')}`;

      const blob = new Blob([statementContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cashflow-statement-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showToast('✅ Cashflow statement downloaded successfully');
    } catch (error) {
      console.error('Error downloading statement:', error);
      showToast('❌ Failed to download statement');
    } finally {
      setIsDownloading(false);
    }
  };

  const transactionTypes = getTransactionTypes();

  return (
    <div className={styles.page}>
      {/* ── HEADER ── */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.heading}>{t('cashflow.title')}</h1>
          <p className={styles.sub}>{t('cashflow.subtitle')}</p>
        </div>
        <button
          className={styles.downloadBtn}
          onClick={handleDownloadPDF}
          disabled={isDownloading || loading || transactions.length === 0}
        >
          {isDownloading ? 'Downloading...' : 'Download Statement'}
        </button>
      </div>

      {/* ── DATE FILTER ── */}
      <div className={styles.dateFilterBar}>
        {(['all', 'today', 'week', 'month'] as DateFilter[]).map(f => (
          <button
            key={f}
            className={`${styles.filterChip} ${dateFilter === f ? styles.filterChipActive : ''}`}
            onClick={() => setDateFilter(f)}
          >
            {f === 'all' ? 'All Time' : f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
        <button
          className={`${styles.filterChip} ${dateFilter === 'custom' ? styles.filterChipActive : ''}`}
          onClick={() => setDateFilter('custom')}
        >
          Custom
        </button>
        {dateFilter === 'custom' && (
          <div className={styles.customDateRange}>
            <input
              type="date"
              className={styles.dateInput}
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
            />
            <span>to</span>
            <input
              type="date"
              className={styles.dateInput}
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* ── STATS ── */}
      <div className={styles.statsRow}>
        {loading ? (
          <div className={styles.loadingState}>Loading...</div>
        ) : (
          <>
            <div className={styles.statCard}>
              <div className={styles.statTop}>
                <span className={styles.statLabel}>{t('cashflow.cashBalance')}</span>
                <span className={`${styles.statIcon} ${styles.statIconGreen}`}>
                  <Banknote size={16} />
                </span>
              </div>
              <div className={styles.statValue} style={{ color: 'var(--green,#10B981)' }}>{formatMoney(stats.cashBalance)}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statTop}>
                <span className={styles.statLabel}>{t('cashflow.stockValue')}</span>
                <span className={`${styles.statIcon} ${styles.statIconBlue}`}>
                  <Package size={16} />
                </span>
              </div>
              <div className={styles.statValue}>{formatMoney(stats.stockValue)}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statTop}>
                <span className={styles.statLabel}>{t('cashflow.monthIn')}</span>
                <span className={`${styles.statIcon} ${styles.statIconPurple}`}>
                  <TrendingUp size={16} />
                </span>
              </div>
              <div className={styles.statValue} style={{ color: '#10B981' }}>+{formatMoney(stats.monthIn)}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statTop}>
                <span className={styles.statLabel}>{t('cashflow.monthOut')}</span>
                <span className={`${styles.statIcon} ${styles.statIconRed}`}>
                  <TrendingDown size={16} />
                </span>
              </div>
              <div className={styles.statValue} style={{ color: '#EF4444' }}>-{formatMoney(stats.monthOut)}</div>
            </div>
          </>
        )}
      </div>

      {/* ── BANK ACCOUNTS ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Bank Accounts</h2>
          <button className={styles.modalButtonPrimary} onClick={() => setActiveAction('add-account')}>
            <Plus size={14} />
            Add Account
          </button>
        </div>
        {bankAccounts.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No bank accounts added yet</p>
          </div>
        ) : (
          <div className={styles.accountsList}>
            {bankAccounts.map(account => (
              <div key={account.id} className={styles.accountCard}>
                <div className={styles.accountIcon}>
                  <Building2 size={18} />
                </div>
                <div className={styles.accountInfo}>
                  <h4 className={styles.accountName}>{account.accountName}</h4>
                  <span className={styles.accountBank}>{account.bankName}</span>
                  {account.isDefault && <span className={styles.defaultBadge}>Default</span>}
                  {account.isPosDefault && <span className={styles.posDefaultBadge}>POS</span>}
                </div>
                <div className={styles.accountBalance}>
                  {formatMoney(account.currentBalance)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className={styles.actionButtons}>
        <button className={styles.actionButton} onClick={() => setActiveAction('add-purchase')}>
          <span className={styles.actionIcon}>
            <ShoppingCart size={18} />
          </span>
          <span>Add Purchase</span>
        </button>
        <button className={styles.actionButton} onClick={() => setActiveAction('reduce-stock')}>
          <span className={styles.actionIcon}>
            <TrendingDown size={18} />
          </span>
          <span>Reduce Stock</span>
        </button>
        <button className={styles.actionButton} onClick={() => setActiveAction('add-money')}>
          <span className={styles.actionIcon}>
            <Wallet size={18} />
          </span>
          <span>Add Money</span>
        </button>
        <button className={styles.actionButton} onClick={() => setActiveAction('take-money')}>
          <span className={styles.actionIcon}>
            <ArrowUpRight size={18} className={styles.rotateIcon} />
          </span>
          <span>Take Money</span>
        </button>
        {suppliers.length > 0 && (
          <button className={styles.actionButton} onClick={() => setActiveAction('pay-supplier')}>
            <span className={styles.actionIcon}>
              <Building2 size={18} />
            </span>
            <span>Pay Supplier</span>
          </button>
        )}
      </div>

      {/* ── ACTION FORMS ── */}
      {activeAction && (
        <div className={styles.actionFormOverlay} onClick={() => setActiveAction(null)}>
          <div className={styles.actionForm} onClick={e => e.stopPropagation()}>
            <button className={styles.closeFormBtn} onClick={() => setActiveAction(null)}>
              <X size={16} />
            </button>
            
            {activeAction === 'add-account' && (
              <div>
                <h3 className={styles.modalTitle}>Add Bank Account</h3>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Account Name</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={newAccount.accountName}
                    onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })}
                    placeholder="e.g., Main Account"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Bank Name</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={newAccount.bankName}
                    onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                    placeholder="e.g., GTBank"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Initial Balance</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={newAccount.initialBalance}
                    onChange={(e) => setNewAccount({ ...newAccount, initialBalance: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={newAccount.isPosDefault}
                      onChange={(e) => setNewAccount({ ...newAccount, isPosDefault: e.target.checked })}
                    />
                    <span>Set as default for POS &amp; Bank payments</span>
                  </label>
                  <span className={styles.formHint}>Sales paid via POS, card, or bank transfer will be recorded to this account</span>
                </div>
                <div className={styles.modalActions}>
                  <button className={styles.modalButton} onClick={() => setActiveAction(null)} disabled={isAddingAccount}>Cancel</button>
                  <button 
                    className={styles.modalButtonPrimary} 
                    onClick={handleAddAccount}
                    disabled={isAddingAccount}
                  >
                    {isAddingAccount ? 'Adding...' : 'Add Account'}
                  </button>
                </div>
              </div>
            )}

            {activeAction === 'add-purchase' && (
              <form onSubmit={(e) => { e.preventDefault(); handleAddPurchase(); }}>
                <h3 className={styles.modalTitle}>Add Purchase</h3>
                
                {!showNewProductForm ? (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Select Product</label>
                      <select
                        className={styles.formInput}
                        value={stockAddition.productId}
                        onChange={(e) => setStockAddition({ ...stockAddition, productId: e.target.value })}
                      >
                        <option value="">Select a product</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>{product.name} (Stock: {product.stock})</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className={styles.linkButton}
                        onClick={() => setShowNewProductForm(true)}
                      >
                        + Create new product
                      </button>
                    </div>
                  </>
                ) : (
                  <div className={styles.newProductForm}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Product Name</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        placeholder="e.g., Rice 50kg"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Cost Price per Unit</label>
                      <input
                        type="number"
                        className={styles.formInput}
                        value={newProduct.costPrice}
                        onChange={(e) => setNewProduct({ ...newProduct, costPrice: parseFloat(e.target.value) || 0 })}
                        placeholder="&#8358;0.00"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Selling Price (Optional)</label>
                      <input
                        type="number"
                        className={styles.formInput}
                        value={newProduct.sellingPrice}
                        onChange={(e) => setNewProduct({ ...newProduct, sellingPrice: parseFloat(e.target.value) || 0 })}
                        placeholder="&#8358;0.00"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Category</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                        placeholder="e.g., Food Items"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Unit</label>
                      <select
                        className={styles.formInput}
                        value={newProduct.unit}
                        onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                      >
                        <option value="piece">Piece</option>
                        <option value="kg">Kilogram</option>
                        <option value="liter">Liter</option>
                        <option value="box">Box</option>
                        <option value="carton">Carton</option>
                        <option value="pack">Pack</option>
                      </select>
                    </div>
                    <div className={styles.modalActions}>
                      <button
                        type="button"
                        className={styles.modalButton}
                        onClick={() => {
                          setShowNewProductForm(false);
                          setNewProduct({ name: '', costPrice: 0, sellingPrice: 0, category: '', unit: 'piece' });
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className={styles.modalButtonPrimary}
                        onClick={handleCreateProduct}
                      >
                        Create Product
                      </button>
                    </div>
                  </div>
                )}

                {!showNewProductForm && (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Quantity to Add</label>
                      <input
                        type="number"
                        className={styles.formInput}
                        value={stockAddition.quantity}
                        onChange={(e) => setStockAddition({ ...stockAddition, quantity: parseFloat(e.target.value) || 0 })}
                        placeholder="e.g., 50"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Cost Price per Unit ({formatMoney(stockAddition.costPrice)})</label>
                      <input
                        type="number"
                        className={styles.formInput}
                        value={stockAddition.costPrice}
                        onChange={(e) => setStockAddition({ ...stockAddition, costPrice: parseFloat(e.target.value) || 0 })}
                        placeholder="&#8358;0.00"
                      />
                    </div>
                    {stockAddition.quantity > 0 && stockAddition.costPrice > 0 && (
                      <div className={styles.calculatedTotal}>
                        <strong>Goods Total: </strong>
                        <span className={styles.totalAmount}>
                          {formatMoney(stockAddition.quantity * stockAddition.costPrice)}
                        </span>
                        <span className={styles.totalBreakdown}>
                          ({stockAddition.quantity} x {formatMoney(stockAddition.costPrice)})
                        </span>
                      </div>
                    )}
                    
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Purchase Reference Number</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={stockAddition.referenceNumber}
                        onChange={(e) => setStockAddition({ ...stockAddition, referenceNumber: e.target.value })}
                        placeholder="PUR-00000000"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Purchase Date</label>
                      <input
                        type="date"
                        className={styles.formInput}
                        value={stockAddition.purchaseDate}
                        onChange={(e) => setStockAddition({ ...stockAddition, purchaseDate: e.target.value })}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Select Supplier (Optional)</label>
                      <select
                        className={styles.formInput}
                        value={stockAddition.supplierId}
                        onChange={(e) => setStockAddition({ ...stockAddition, supplierId: e.target.value })}
                      >
                        <option value="">No supplier</option>
                        {suppliers.map(supplier => (
                          <option key={supplier.id} value={supplier.id}>{supplier.supplierName || supplier.businessName}</option>
                        ))}
                      </select>
                      <span className={styles.formHint}>Link this purchase to a supplier for credit tracking</span>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Payment Method</label>
                      <select
                        className={styles.formInput}
                        value={stockAddition.paymentMethod}
                        onChange={(e) => setStockAddition({ ...stockAddition, paymentMethod: e.target.value as 'cash' | 'credit' | 'partial' })}
                      >
                        <option value="credit">Credit (Pay Later)</option>
                        <option value="cash">Cash (Full Payment)</option>
                        <option value="partial">Partial Payment</option>
                      </select>
                      <span className={styles.formHint}>
                        {stockAddition.paymentMethod === 'credit' && 'Full amount will be added to supplier credit balance'}
                        {stockAddition.paymentMethod === 'cash' && 'Full payment will be deducted from bank account'}
                        {stockAddition.paymentMethod === 'partial' && 'Pay part now, add remainder to credit'}
                      </span>
                    </div>

                    {stockAddition.paymentMethod === 'partial' && (
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Payment Amount</label>
                        <input
                          type="number"
                          className={styles.formInput}
                          value={stockAddition.paymentAmount}
                          onChange={(e) => setStockAddition({ ...stockAddition, paymentAmount: parseFloat(e.target.value) || 0 })}
                          placeholder="Enter payment amount"
                          max={stockAddition.quantity * stockAddition.costPrice}
                        />
                        {stockAddition.quantity > 0 && stockAddition.costPrice > 0 && (
                          <div className={styles.paymentBreakdown}>
                            <span>Total: {formatMoney(stockAddition.quantity * stockAddition.costPrice)}</span>
                            <span>Payment: {formatMoney(stockAddition.paymentAmount)}</span>
                            <span className={styles.redBold}>
                              Credit: {formatMoney((stockAddition.quantity * stockAddition.costPrice) - stockAddition.paymentAmount)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {(stockAddition.paymentMethod === 'cash' || stockAddition.paymentMethod === 'partial') && (
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Select Bank Account</label>
                        <select
                          className={styles.formInput}
                          value={stockAddition.bankAccountId}
                          onChange={(e) => setStockAddition({ ...stockAddition, bankAccountId: e.target.value })}
                        >
                          <option value="">Select bank account</option>
                          {bankAccounts.map(account => (
                            <option key={account.id} value={account.id}>{account.accountName} - {account.bankName} (Bal: {formatMoney(account.currentBalance)})</option>
                          ))}
                        </select>
                        <span className={styles.formHint}>Required for cash and partial payments</span>
                      </div>
                    )}

                    {stockAddition.supplierId && stockAddition.paymentMethod === 'credit' && (
                      <div className={styles.creditInfo}>
                        <div className={styles.creditInfoItem}>
                          <span className={styles.creditInfoLabel}>Supplier:</span>
                          <span className={styles.creditInfoValue}>{suppliers.find(s => s.id === stockAddition.supplierId)?.supplierName || suppliers.find(s => s.id === stockAddition.supplierId)?.businessName}</span>
                        </div>
                        {stockAddition.quantity > 0 && stockAddition.costPrice > 0 && (
                          <div className={styles.creditInfoItem}>
                            <span className={styles.creditInfoLabel}>Amount to Credit:</span>
                            <span className={`${styles.creditInfoValue} ${styles.redBold}`}>
                              {formatMoney(stockAddition.quantity * stockAddition.costPrice)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Notes (Optional)</label>
                      <textarea
                        className={styles.formInput}
                        value={stockAddition.notes}
                        onChange={(e) => setStockAddition({ ...stockAddition, notes: e.target.value })}
                        placeholder="Enter notes"
                        rows={3}
                      />
                    </div>
                    <div className={styles.modalActions}>
                      <button type="button" className={styles.modalButton} onClick={() => setActiveAction(null)}>Cancel</button>
                      <button type="submit" className={styles.modalButtonPrimary} disabled={isAddingPurchase}>
                        {isAddingPurchase ? 'Recording...' : 'Record Purchase'}
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}

            {activeAction === 'reduce-stock' && (
              <form onSubmit={(e) => { e.preventDefault(); handleReduceStock(); }}>
                <h3 className={styles.modalTitle}>Reduce Stock</h3>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Select Product</label>
                  <select
                    className={styles.formInput}
                    value={stockReduction.productId}
                    onChange={(e) => setStockReduction({ ...stockReduction, productId: e.target.value })}
                  >
                    <option value="">Select a product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>{product.name} (Stock: {product.stock})</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Quantity to Reduce</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={stockReduction.quantity}
                    onChange={(e) => setStockReduction({ ...stockReduction, quantity: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 10"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Reason</label>
                  <select
                    className={styles.formInput}
                    value={stockReduction.reason}
                    onChange={(e) => setStockReduction({ ...stockReduction, reason: e.target.value })}
                  >
                    <option value="">Select reason</option>
                    <option value="damaged">Damaged</option>
                    <option value="expired">Expired</option>
                    <option value="theft">Theft</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description</label>
                  <textarea
                    className={styles.formInput}
                    value={stockReduction.reason}
                    onChange={(e) => setStockReduction({ ...stockReduction, reason: e.target.value })}
                    placeholder="Enter description"
                    rows={3}
                  />
                </div>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.modalButton} onClick={() => setActiveAction(null)}>Cancel</button>
                  <button type="submit" className={styles.modalButtonPrimary}>Reduce Stock</button>
                </div>
              </form>
            )}

            {activeAction === 'add-money' && (
              <form onSubmit={(e) => { e.preventDefault(); handleAddMoney(); }}>
                <h3 className={styles.modalTitle}>Add Money</h3>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Select Account</label>
                  <select
                    className={styles.formInput}
                    value={moneyTransaction.accountId}
                    onChange={(e) => setMoneyTransaction({ ...moneyTransaction, accountId: e.target.value })}
                  >
                    <option value="">Select an account</option>
                    {bankAccounts.map(account => (
                      <option key={account.id} value={account.id}>{account.accountName} - {account.bankName}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Amount</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={moneyTransaction.amount}
                    onChange={(e) => setMoneyTransaction({ ...moneyTransaction, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category</label>
                  <select
                    className={styles.formInput}
                    value={moneyTransaction.category}
                    onChange={(e) => setMoneyTransaction({ ...moneyTransaction, category: e.target.value })}
                  >
                    <option value="">Select category</option>
                    <option value="Sales">Sales</option>
                    <option value="Deposit">Deposit</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={moneyTransaction.description}
                    onChange={(e) => setMoneyTransaction({ ...moneyTransaction, description: e.target.value })}
                    placeholder="Enter description"
                  />
                </div>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.modalButton} onClick={() => setActiveAction(null)}>Cancel</button>
                  <button type="submit" className={styles.modalButtonPrimary}>Add Money</button>
                </div>
              </form>
            )}

            {activeAction === 'take-money' && (
              <form onSubmit={(e) => { e.preventDefault(); handleTakeMoney(); }}>
                <h3 className={styles.modalTitle}>Take Money</h3>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Select Account</label>
                  <select
                    className={styles.formInput}
                    value={moneyTransaction.accountId}
                    onChange={(e) => setMoneyTransaction({ ...moneyTransaction, accountId: e.target.value })}
                  >
                    <option value="">Select an account</option>
                    {bankAccounts.map(account => (
                      <option key={account.id} value={account.id}>{account.accountName} - {account.bankName}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Amount</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={moneyTransaction.amount}
                    onChange={(e) => setMoneyTransaction({ ...moneyTransaction, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category</label>
                  <select
                    className={styles.formInput}
                    value={moneyTransaction.category}
                    onChange={(e) => setMoneyTransaction({ ...moneyTransaction, category: e.target.value })}
                  >
                    <option value="">Select category</option>
                    <option value="Expense">Expense</option>
                    <option value="Withdrawal">Withdrawal</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Purchase">Purchase</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={moneyTransaction.description}
                    onChange={(e) => setMoneyTransaction({ ...moneyTransaction, description: e.target.value })}
                    placeholder="Enter description"
                  />
                </div>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.modalButton} onClick={() => setActiveAction(null)}>Cancel</button>
                  <button type="submit" className={styles.modalButtonPrimary}>Take Money</button>
                </div>
              </form>
            )}

            {activeAction === 'pay-supplier' && (
              <form onSubmit={(e) => { e.preventDefault(); handlePaySupplier(); }}>
                <h3 className={styles.modalTitle}>Pay Supplier</h3>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Select Supplier</label>
                  <select
                    className={styles.formInput}
                    value={supplierPayment.supplierId}
                    onChange={(e) => setSupplierPayment({ ...supplierPayment, supplierId: e.target.value })}
                  >
                    <option value="">Select a supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.supplierName || supplier.businessName} 
                        {supplier.currentBalance ? ` (Balance: ${formatMoney(supplier.currentBalance)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {supplierPayment.supplierId && (
                  <div className={styles.creditInfo}>
                    <div className={styles.creditInfoItem}>
                      <span className={styles.creditInfoLabel}>Current Balance:</span>
                      <span className={`${styles.creditInfoValue} ${styles.redBold}`}>
                        {formatMoney(suppliers.find(s => s.id === supplierPayment.supplierId)?.currentBalance || 0)}
                      </span>
                    </div>
                  </div>
                )}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Payment Amount</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={supplierPayment.amount}
                    onChange={(e) => setSupplierPayment({ ...supplierPayment, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="Enter payment amount"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Payment Method</label>
                  <select
                    className={styles.formInput}
                    value={supplierPayment.paymentMethod}
                    onChange={(e) => setSupplierPayment({ ...supplierPayment, paymentMethod: e.target.value as 'cash' | 'transfer' | 'pos' })}
                  >
                    <option value="cash">Cash</option>
                    <option value="transfer">Bank Transfer</option>
                    <option value="pos">POS / Card</option>
                  </select>
                </div>
                {(supplierPayment.paymentMethod === 'transfer' || supplierPayment.paymentMethod === 'pos') && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Select Bank Account</label>
                    <select
                      className={styles.formInput}
                      value={supplierPayment.bankAccountId}
                      onChange={(e) => setSupplierPayment({ ...supplierPayment, bankAccountId: e.target.value })}
                    >
                      <option value="">Select bank account</option>
                      {bankAccounts.map(account => (
                        <option key={account.id} value={account.id}>{account.accountName} - {account.bankName} (Bal: {formatMoney(account.currentBalance)})</option>
                      ))}
                    </select>
                    <span className={styles.formHint}>Required for bank transfer and POS payments</span>
                  </div>
                )}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description (Optional)</label>
                  <textarea
                    className={styles.formInput}
                    value={supplierPayment.description}
                    onChange={(e) => setSupplierPayment({ ...supplierPayment, description: e.target.value })}
                    placeholder="Enter payment description"
                    rows={3}
                  />
                </div>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.modalButton} onClick={() => setActiveAction(null)}>Cancel</button>
                  <button type="submit" className={styles.modalButtonPrimary}>Record Payment</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── TRANSACTIONS ── */}
      <div className={styles.transactionsSection}>
        <div className={styles.txHeader}>
          <h2 className={styles.sectionTitle}>{t('cashflow.recentTransactions')}</h2>
          <div className={styles.txFilters}>
            <span className={styles.txFilterLabel}>Type:</span>
            <div className={styles.chipGroup}>
              <button
                className={`${styles.chip} ${transactionTypeFilter === 'all' ? styles.chipActive : ''}`}
                onClick={() => setTransactionTypeFilter('all')}
              >
                All
              </button>
              {transactionTypes.map(type => (
                <button
                  key={type}
                  className={`${styles.chip} ${transactionTypeFilter === type ? styles.chipActive : ''}`}
                  onClick={() => setTransactionTypeFilter(type)}
                >
                  {type}
                </button>
              ))}
            </div>
            <span className={styles.txFilterLabel}>Show:</span>
            <div className={styles.chipGroup}>
              {[2, 5, 10, 20].map(limitCount => (
                <button
                  key={limitCount}
                  className={`${styles.chip} ${transactionLimit === limitCount ? styles.chipActive : ''}`}
                  onClick={() => setTransactionLimit(limitCount)}
                >
                  {limitCount}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className={styles.txEmpty}>Loading...</div>
        ) : transactions.length === 0 ? (
          <div className={styles.txEmpty}>
            <svg className={styles.txEmptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
            </svg>
            <div className={styles.txEmptyTitle}>{t('cashflow.noTransactions')}</div>
            <div className={styles.txEmptyDesc}>{t('cashflow.addTransactionsFirst')}</div>
          </div>
        ) : (
          <div className={styles.transactionList}>
            {getFilteredTransactions().slice(0, transactionLimit).map(t => {
              const isExpanded = expandedTransaction === t.id;
              return (
                <div
                  key={t.id}
                  className={styles.transactionCard}
                  onClick={() => setExpandedTransaction(isExpanded ? null : t.id)}
                >
                  <div className={styles.txLeft}>
                    <div className={styles.txTop}>
                      <span className={styles.txDate}>{t.date}</span>
                      <span className={`${styles.txBadge} ${t.credit ? styles.txIn : styles.txOut}`}>
                        {t.credit ? 'IN' : 'OUT'}
                      </span>
                    </div>
                    <div className={styles.txBody}>
                      <span className={styles.txAccount}>{t.type}</span>
                      <span className={styles.txDesc}>
                        {t.accountName ? `${t.accountName} — ` : ''}{t.description || t.type}
                      </span>
                    </div>
                  </div>
                  <div className={`${styles.txAmount} ${t.credit ? styles.moneyIn : styles.moneyOut}`}>
                    {t.credit ? '+' : '-'}{formatMoney(t.amount)}
                  </div>

                  {isExpanded && (
                    <div className={styles.expandedDetails} onClick={e => e.stopPropagation()}>
                      <div className={styles.expRow}>
                        <span className={styles.expLabel}>Transaction ID:</span>
                        <span className={styles.expValue}>{t.id}</span>
                      </div>
                      <div className={styles.expRow}>
                        <span className={styles.expLabel}>Type:</span>
                        <span className={styles.expValue}>{t.type}</span>
                      </div>
                      <div className={styles.expRow}>
                        <span className={styles.expLabel}>Amount:</span>
                        <span className={`${styles.expValue} ${t.credit ? styles.moneyIn : styles.moneyOut}`}>
                          {t.credit ? 'Credit' : 'Debit'}: {formatMoney(t.amount)}
                        </span>
                      </div>
                      <div className={styles.expRow}>
                        <span className={styles.expLabel}>Date:</span>
                        <span className={styles.expValue}>{t.date}</span>
                      </div>
                      {t.accountName && (
                        <div className={styles.expRow}>
                          <span className={styles.expLabel}>Account:</span>
                          <span className={styles.expValue}>{t.accountName}</span>
                        </div>
                      )}
                      <div className={styles.expRow}>
                        <span className={styles.expLabel}>Description:</span>
                        <span className={styles.expValue}>{t.description || 'No description'}</span>
                      </div>
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

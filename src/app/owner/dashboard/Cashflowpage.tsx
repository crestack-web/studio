'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, limit, addDoc, Timestamp, doc, getDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { Building2, Package, TrendingDown, Wallet, ArrowUpRight, X, Plus, ShoppingCart } from 'lucide-react';
import styles from './Cashflowpage.module.css';

// ═══════════════════════════════════════════
//  CashflowPage — Bank accounts + stock + cash flow tracking
// ═══════════════════════════════════════════

type ActionId = 'add-stock' | 'reduce-stock' | 'add-money' | 'take-money' | 'add-account' | null;
type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom';

interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  currentBalance: number;
  isActive: boolean;
  isDefault: boolean;
  isPosDefault?: boolean; // Default for POS/bank payments
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

  // Form states
  const [newAccount, setNewAccount] = useState({ accountName: '', bankName: '', initialBalance: 0, isPosDefault: false });
  const [moneyTransaction, setMoneyTransaction] = useState({ accountId: '', amount: 0, description: '', category: '' });
  const [stockReduction, setStockReduction] = useState({ productId: '', quantity: 0, reason: '' });
  const [stockAddition, setStockAddition] = useState({ productId: '', quantity: 0, costPrice: 0, description: '', isPurchase: false, bankAccountId: '', supplierId: '', paymentAmount: 0, paymentMethod: 'credit' as 'cash' | 'credit' | 'partial' });

  useEffect(() => {
    loadProducts();
    loadSuppliers();
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
      const suppliersQuery = query(
        collection(firestore, 'businesses', businessId, 'suppliers'),
        where('active', '==', true)
      );
      const suppliersSnapshot = await getDocs(suppliersQuery);
      const suppliersList: Supplier[] = [];
      suppliersSnapshot.forEach(doc => {
        const data = doc.data();
        suppliersList.push({
          id: doc.id,
          supplierName: data.supplierName || 'Unnamed Supplier',
          businessName: data.businessName || data.supplierName || 'Unnamed Supplier',
          phone: data.phone,
          email: data.email,
          currentBalance: data.currentBalance || 0,
        });
      });
      setSuppliers(suppliersList);
    } catch (error) {
      console.error('Error loading suppliers:', error);
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
      
      // Load bank accounts
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
      
      // Fetch bank transactions with date filtering
      const dateRange = getDateRange();
      let transactionsQuery = query(
        collection(firestore, 'businesses', businessId, 'bankTransactions'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      let snapshot;
      if (dateRange && dateFilter !== 'all') {
        snapshot = await getDocs(transactionsQuery);
      } else {
        snapshot = await getDocs(transactionsQuery);
      }
      
      // Use a Map to deduplicate transactions by ID
      const transactionMap = new Map<string, Transaction>();
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
        
        // Apply date filter
        if (dateRange && dateFilter !== 'all') {
          if (date < dateRange.startDate || date > dateRange.endDate) {
            return;
          }
        }
        
        transactionMap.set(doc.id, {
          id: doc.id,
          date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          type: data.category || 'Other',
          description: data.description || '',
          amount: amount,
          credit: isCredit,
          accountName: data.accountName,
        });
        
        if (isCredit) {
          cashBalance += amount;
          if (date >= monthStart) monthIn += amount;
        } else {
          cashBalance -= amount;
          if (date >= monthStart) monthOut += amount;
        }
      });

      // Fetch recent sales with date filtering
      let salesQuery = query(
        collection(firestore, 'businesses', businessId, 'sales'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const salesSnapshot = await getDocs(salesQuery);
      
      salesSnapshot.forEach(doc => {
        const data = doc.data();
        const amount = data.totalRevenue || data.totalAmount || 0;
        const date = data.createdAt?.toDate() || new Date();
        
        // Apply date filter
        if (dateRange && dateFilter !== 'all') {
          if (date < dateRange.startDate || date > dateRange.endDate) {
            return;
          }
        }
        
        // Calculate payment breakdown totals
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
        
        // Add bank/POS portion to transactions
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
          
          cashBalance += bankPayment;
          if (date >= monthStart) monthIn += bankPayment;
        }
        
        // For cash sales, add as transaction too (to show in recent transactions)
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
        
        // Track credit sales separately in monthIn
        if (creditPayment > 0 && date >= monthStart) {
          monthIn += creditPayment;
        }
      });
      
      // Fetch expenses and integrate them into cashflow
      const expensesQuery = query(
        collection(firestore, 'businesses', businessId, 'expenses'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const expensesSnapshot = await getDocs(expensesQuery);
      
      // Process expenses with for...of to support async operations
      for (const expenseDoc of expensesSnapshot.docs) {
        const data = expenseDoc.data();
        const amount = data.amount || 0;
        const date = data.createdAt?.toDate() || new Date();
        
        // Apply date filter
        if (dateRange && dateFilter !== 'all') {
          if (date < dateRange.startDate || date > dateRange.endDate) {
            continue;
          }
        }
        
        // Determine if this is a bank payment
        const isBankPayment = data.paymentMethod === 'Bank Transfer' || 
                              data.paymentMethod === 'POS / Card';
        
        // Add expense to transactions
        transactionMap.set(`expense-${expenseDoc.id}`, {
          id: `expense-${expenseDoc.id}`,
          date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          type: data.category || 'Expense',
          description: data.description || `Expense: ${data.category}`,
          amount: amount,
          credit: false,
          accountName: isBankPayment ? accountsList.find(a => a.isDefault || a.isPosDefault)?.accountName : 'Cash',
        });
        
        // Deduct from monthly out
        if (date >= monthStart) monthOut += amount;
        
        // If bank payment, deduct from bank balance and record bank transaction
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
      
      // Convert map to array and sort transactions by date (most recent first)
      const sortedTransactions = Array.from(transactionMap.values()).sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });
      
      setTransactions(sortedTransactions);

      // Calculate stock value from products using costPrice
      const stockValue = products.reduce((sum: number, product: any) => {
        const stock = product.stock || 0;
        const costPrice = product.costPrice || product.cost || 0;
        return sum + (stock * costPrice);
      }, 0);
      
      // Calculate total cash balance (sum of all bank accounts)
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
    
    // Prevent duplicate accounts
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

      // Record as expense transaction
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

  const handleAddStock = async () => {
    if (!businessId || !firestore) return;
    try {
      const product = products.find(p => p.id === stockAddition.productId);
      if (!product) {
        showToast('❌ Please select a product');
        return;
      }

      const purchaseAmount = stockAddition.costPrice * stockAddition.quantity;
      
      // Calculate payment amounts before transaction
      let paidAmount = 0;
      let creditAmount = 0;
      let paymentMethod = 'cash';

      // Validate payment amount for partial payment
      if (stockAddition.paymentMethod === 'partial') {
        if (stockAddition.paymentAmount <= 0 || stockAddition.paymentAmount >= purchaseAmount) {
          showToast('❌ Partial payment amount must be greater than 0 and less than total');
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

      // Use Firestore transaction for atomic updates
      await runTransaction(firestore, async (transaction) => {
        // Update product stock
        const productRef = doc(firestore, 'businesses', businessId, 'products', stockAddition.productId);
        const productDoc = await transaction.get(productRef);
        if (productDoc.exists()) {
          const currentStock = productDoc.data().stock || 0;
          transaction.update(productRef, {
            stock: currentStock + stockAddition.quantity,
          });
        }

        // Handle payment based on method
        if (stockAddition.paymentMethod === 'cash' || stockAddition.paymentMethod === 'partial') {
          // If bank account selected, deduct from bank
          if (stockAddition.bankAccountId) {
            const accountRef = doc(firestore, 'businesses', businessId, 'bankAccounts', stockAddition.bankAccountId);
            const accountDoc = await transaction.get(accountRef);
            if (accountDoc.exists()) {
              const currentBalance = accountDoc.data().currentBalance || 0;
              if (currentBalance < paidAmount) {
                throw new Error('Insufficient bank balance');
              }
              transaction.update(accountRef, {
                currentBalance: currentBalance - paidAmount,
              });

              // Record bank transaction
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
        }

        // If supplier is selected, update supplier balance and create ledger entry
        if (stockAddition.supplierId) {
          const supplierRef = doc(firestore, 'businesses', businessId, 'suppliers', stockAddition.supplierId);
          const supplierDoc = await transaction.get(supplierRef);
          
          if (supplierDoc.exists()) {
            const supplierData = supplierDoc.data();
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

            // Create supplier ledger entry for purchase
            const ledgerRef = doc(collection(firestore, 'businesses', businessId, 'supplierLedger'));
            transaction.set(ledgerRef, {
              supplierId: stockAddition.supplierId,
              businessId: businessId,
              type: 'purchase',
              amount: purchaseAmount,
              balanceAfter: newBalance,
              description: `Purchase: ${product.name} - ${stockAddition.quantity} units`,
              reference: `SR-${Date.now()}`,
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
              },
            });

            // If payment was made, create payment ledger entry
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

            // Create stock receipt
            const receiptRef = doc(collection(firestore, 'businesses', businessId, 'stockReceipts'));
            transaction.set(receiptRef, {
              receiptNumber: `SR-${Date.now()}`,
              supplierId: stockAddition.supplierId,
              supplierName: supplierData.supplierName || supplierData.name || 'Unknown Supplier',
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
              notes: stockAddition.description,
              createdAt: Timestamp.now(),
            });
          }
        } else {
          // No supplier - just record as expense if bank account used
          if (stockAddition.bankAccountId && paidAmount > 0) {
            const accountRef = doc(firestore, 'businesses', businessId, 'bankAccounts', stockAddition.bankAccountId);
            const accountDoc = await transaction.get(accountRef);
            if (accountDoc.exists()) {
              const transactionData = {
                transactionNumber: `STK-${Date.now()}`,
                bankAccountId: stockAddition.bankAccountId,
                accountName: accountDoc.data().accountName,
                type: 'money_out',
                category: 'Stock Addition',
                amount: paidAmount,
                balanceAfter: accountDoc.data().currentBalance - paidAmount,
                description: `Stock addition: ${product.name} - ${stockAddition.quantity} units. ${stockAddition.description}`,
                createdAt: Timestamp.now(),
              };
              const bankTxnRef = doc(collection(firestore, 'businesses', businessId, 'bankTransactions'));
              transaction.set(bankTxnRef, transactionData);
            }
          }
        }
      });

      showToast(`✅ Stock added successfully${creditAmount > 0 ? ` - ${formatMoney(creditAmount)} added to credit` : ''}`);
      setActiveAction(null);
      setStockAddition({ productId: '', quantity: 0, costPrice: 0, description: '', isPurchase: false, bankAccountId: '', supplierId: '', paymentAmount: 0, paymentMethod: 'credit' as 'cash' | 'credit' | 'partial' });
      loadProducts();
      loadData();
      loadSuppliers();
    } catch (error: any) {
      console.error('Error adding stock:', error);
      showToast(`❌ Failed to add stock: ${error.message || 'Unknown error'}`);
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

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>{t('cashflow.title')}</h1>
      <p className={styles.sub}>{t('cashflow.subtitle')}</p>

      {/* ── DATE FILTER ── */}
      <div className={styles.dateFilterContainer}>
        <label className={styles.filterLabel}>Time Period:</label>
        <select
          className={styles.filterSelect}
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as DateFilter)}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="custom">Custom Range</option>
        </select>

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

      {/* ── QUICK STATS ── */}
      <div className={styles.statsGrid}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
            {t('common.loading')}...
          </div>
        ) : (
          [
            { label: t('cashflow.cashBalance'),    value: formatMoney(stats.cashBalance),  color: 'var(--green,#1A7A50)' },
            { label: t('cashflow.stockValue'),     value: formatMoney(stats.stockValue), color: 'var(--text-1)' },
            { label: t('cashflow.monthIn'),   value: '+' + formatMoney(stats.monthIn), color: 'var(--green,#1A7A50)' },
            { label: t('cashflow.monthOut'),  value: '-' + formatMoney(stats.monthOut), color: 'var(--red,#C0392B)' },
          ].map(s => (
            <div key={s.label} className={styles.statCard}>
              <div className={styles.statLabel}>{s.label}</div>
              <div className={styles.statValue} style={{ color: s.color }}>{s.value}</div>
            </div>
          ))
        )}
      </div>

      {/* ── BANK ACCOUNTS ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Bank Accounts</h2>
          <button className={styles.modalButtonPrimary} onClick={() => setActiveAction('add-account')}>
            <Plus size={16} style={{ marginRight: '6px' }} />
            Add Account
          </button>
        </div>
        {bankAccounts.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No bank accounts added yet</p>
          </div>
        ) : (
          <div className={styles.accountsGrid}>
            {bankAccounts.map(account => (
              <div key={account.id} className={styles.accountCard}>
                <div className={styles.accountHeader}>
                  <div className={styles.accountIcon}>
                    <Building2 size={20} />
                  </div>
                  <div className={styles.accountInfo}>
                    <h4 className={styles.accountName}>{account.accountName}</h4>
                    <span className={styles.accountBank}>{account.bankName}</span>
                  </div>
                  {account.isDefault && (
                    <div className={styles.defaultBadge}>Default</div>
                  )}
                  {account.isPosDefault && (
                    <div className={styles.posDefaultBadge}>POS Default</div>
                  )}
                </div>
                <div className={styles.accountBalance}>
                  {formatMoney(account.currentBalance)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ACTION CARDS ── */}
      <div className={styles.actionButtons}>
        <button className={styles.actionButton} onClick={() => setActiveAction('add-stock')}>
          <span className={styles.actionIcon}>
            <Package size={20} />
          </span>
          <span>Add Stock</span>
        </button>
        <button className={styles.actionButton} onClick={() => setActiveAction('reduce-stock')}>
          <span className={styles.actionIcon}>
            <TrendingDown size={20} />
          </span>
          <span>Reduce Stock</span>
        </button>
        <button className={styles.actionButton} onClick={() => setActiveAction('add-money')}>
          <span className={styles.actionIcon}>
            <Wallet size={20} />
          </span>
          <span>Add Money</span>
        </button>
        <button className={styles.actionButton} onClick={() => setActiveAction('take-money')}>
          <span className={styles.actionIcon}>
            <ArrowUpRight size={20} style={{ transform: 'rotate(45deg)' }} />
          </span>
          <span>Take Money</span>
        </button>
      </div>

      {/* ── ACTION FORMS (shown when active) ── */}
      {activeAction && (
        <div className={styles.actionFormOverlay} onClick={() => setActiveAction(null)}>
          <div className={styles.actionForm} onClick={e => e.stopPropagation()}>
            <button className={styles.closeFormBtn} onClick={() => setActiveAction(null)}>
              <X size={18} />
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
                    <span>Set as default for POS & Bank payments</span>
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

            {activeAction === 'add-stock' && (
              <form onSubmit={(e) => { e.preventDefault(); handleAddStock(); }}>
                <h3 className={styles.modalTitle}>Add Stock</h3>
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
                </div>
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
                    placeholder="₦0.00"
                  />
                </div>
                {stockAddition.quantity > 0 && stockAddition.costPrice > 0 && (
                  <div className={styles.calculatedTotal}>
                    <strong>Goods Total: </strong>
                    <span style={{ color: 'var(--purple)', fontSize: '1.1rem', fontWeight: 700 }}>
                      {formatMoney(stockAddition.quantity * stockAddition.costPrice)}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginLeft: '8px' }}>
                      ({stockAddition.quantity} × {formatMoney(stockAddition.costPrice)})
                    </span>
                  </div>
                )}
                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={stockAddition.isPurchase}
                      onChange={(e) => setStockAddition({ ...stockAddition, isPurchase: e.target.checked })}
                    />
                    <ShoppingCart size={16} style={{ marginRight: '8px' }} />
                    <span>This is a Purchase</span>
                  </label>
                  <span className={styles.formHint}>Mark as purchase to link with supplier and bank account</span>
                </div>

                {stockAddition.isPurchase && (
                  <>
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
                            <span style={{ color: 'var(--red)', fontWeight: 600 }}>
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
                            <span className={styles.creditInfoValue} style={{ color: 'var(--red)', fontWeight: 600 }}>
                              {formatMoney(stockAddition.quantity * stockAddition.costPrice)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description</label>
                  <textarea
                    className={styles.formInput}
                    value={stockAddition.description}
                    onChange={(e) => setStockAddition({ ...stockAddition, description: e.target.value })}
                    placeholder="Enter description"
                    rows={3}
                  />
                </div>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.modalButton} onClick={() => setActiveAction(null)}>Cancel</button>
                  <button type="submit" className={styles.modalButtonPrimary}>Add Stock</button>
                </div>
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
          </div>
        </div>
      )}

      {/* ── TRANSACTIONS LIST ── */}
      <div className={styles.transactionsSection}>
        <h2 className={styles.sectionTitle}>{t('cashflow.recentTransactions')}</h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
            {t('common.loading')}...
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.3 }}>
              <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
            </svg>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{t('cashflow.noTransactions')}</div>
            <div style={{ fontSize: '0.8rem' }}>{t('cashflow.addTransactionsFirst')}</div>
          </div>
        ) : (
          <div className={styles.transactionList}>
            {transactions.map(t => (
              <div key={t.id} className={styles.transactionCard}>
                <div className={styles.transactionHeader}>
                  <span className={styles.transactionNumber}>{t.date}</span>
                  <span className={`${styles.transactionType} ${t.credit ? styles.moneyIn : styles.moneyOut}`}>
                    {t.credit ? '↑' : '↓'} {t.type}
                  </span>
                </div>
                <div className={styles.transactionDetails}>
                  <div className={styles.transactionDetail}>
                    <span className={styles.transactionLabel}>Account:</span>
                    <span className={styles.transactionValue}>{t.accountName || 'N/A'}</span>
                  </div>
                  <div className={styles.transactionDetail}>
                    <span className={styles.transactionLabel}>Description:</span>
                    <span className={styles.transactionValue}>{t.description}</span>
                  </div>
                </div>
                <div className={`${styles.transactionAmount} ${t.credit ? styles.moneyIn : styles.moneyOut}`}>
                  {t.credit ? '+' : '-'}{formatMoney(t.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
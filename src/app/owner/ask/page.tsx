'use client';

import { useState, useRef, useEffect, FormEvent, useMemo } from 'react';
import { Send, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import MainLayout from '@/components/app/main-layout';
import { getBusinessInsights } from '@/ai/flows/get-business-insights';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { getCurrencySymbol } from '@/lib/currency';
import { useLanguage } from '@/context/language-provider';

interface AppUser {
  businessId: string;
  displayName: string;
}

interface Business {
  currency: string;
  country?: string;
}

interface Sale {
  amount: number;
  timestamp: Timestamp;
  productId?: string;
  variantId?: string;
  quantity: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  stockByBranch?: Record<string, number>;
  hasVariants?: boolean;
  variants?: {
    id: string;
    name: string;
    price: number;
    cost?: number;
    stockByBranch?: Record<string, number>;
  }[];
}

interface Transaction {
  type: 'deposit' | 'withdrawal';
  amount: number;
  createdAt: Timestamp;
}

interface Expense {
  amount: number;
  createdAt: Timestamp;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

export default function AskPage() {
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { language, t } = useLanguage();

  const unavailableText = t('askBusmo.unavailable');
  const loadingDataText = t('askBusmo.loadingData');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial',
      text: t('askBusmo.greeting'),
      sender: 'ai',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userProfileRef = useMemoFirebase(() => {
    if (!authUser || !firestore) return null;
    return doc(firestore, `users/${authUser.uid}`);
  }, [authUser, firestore]);
  const { data: userProfile } = useDoc<AppUser>(userProfileRef);
  const businessId = userProfile?.businessId;

  const businessRef = useMemoFirebase(() => {
    if (!businessId || !firestore) return null;
    return doc(firestore, `businesses/${businessId}`);
  }, [businessId, firestore]);
  const { data: businessData } = useDoc<Business>(businessRef);

  const salesQuery = useMemoFirebase(() => {
    if (!businessId || !firestore) return null;
    return query(
      collection(firestore, `businesses/${businessId}/sales`),
      orderBy('timestamp', 'desc'),
      limit(500)
    );
  }, [businessId, firestore]);
  const { data: salesData } = useCollection<Sale>(salesQuery);

  const expensesQuery = useMemoFirebase(() => {
    if (!businessId || !firestore) return null;
    return query(
      collection(firestore, `businesses/${businessId}/expenses`),
      orderBy('createdAt', 'desc'),
      limit(500)
    );
  }, [businessId, firestore]);
  const { data: expensesData } = useCollection<Expense>(expensesQuery);

  const transactionsQuery = useMemoFirebase(() => {
    if (!businessId || !firestore) return null;
    return query(
      collection(firestore, `businesses/${businessId}/transactions`),
      orderBy('createdAt', 'desc'),
      limit(500)
    );
  }, [businessId, firestore]);
  const { data: transactionsData } = useCollection<Transaction>(transactionsQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!businessId || !firestore) return null;
    return query(collection(firestore, `businesses/${businessId}/products`));
  }, [businessId, firestore]);
  const { data: productsData } = useCollection<Product>(productsQuery);

  const businessInsights = useMemo(() => {
    const defaultInsights = {
      totalSales: 0,
      totalProfit: 0,
      bestSellingProduct: undefined,
      worstSellingProduct: undefined,
      lowStockProducts: [],
      salesTodayCount: 0,
      salesTodayTotal: 0,
      profitToday: 0,
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalExpenses: 0,
      profitMargin: 0,
      cashBalance: 0,
      dailyAvgExpense: 0,
      salesDays: 0,
    };

    if (!salesData || !productsData || !expensesData || !transactionsData) {
      return defaultInsights;
    }

    const todayInterval = { start: startOfDay(new Date()), end: endOfDay(new Date()) };
    const salesByProduct: { [key: string]: { id: string; name: string; quantity: number; sales: number } } = {};
    let totalSales = 0;
    let totalCogs = 0;
    let salesTodayCount = 0;
    let salesTodayTotal = 0;
    let cogsToday = 0;
    const saleDates = new Set<string>();

    for (const sale of salesData) {
      totalSales += sale.amount;
      saleDates.add(sale.timestamp.toDate().toDateString());
      const product = productsData.find(p => p.id === sale.productId);
      if (product) {
        let costOfItem = 0;
        if (product.hasVariants && sale.variantId) {
          const variant = product.variants?.find(v => v.id === sale.variantId);
          costOfItem = variant?.cost || 0;
        } else {
          costOfItem = product.cost || 0;
        }
        const cogsForSale = costOfItem * sale.quantity;
        totalCogs += cogsForSale;

        if (!salesByProduct[product.id]) {
          salesByProduct[product.id] = { id: product.id, name: product.name, quantity: 0, sales: 0 };
        }
        salesByProduct[product.id].quantity += sale.quantity;
        salesByProduct[product.id].sales += sale.amount;

        if (isWithinInterval(sale.timestamp.toDate(), todayInterval)) {
          cogsToday += cogsForSale;
        }
      }

      if (isWithinInterval(sale.timestamp.toDate(), todayInterval)) {
        salesTodayCount += 1;
        salesTodayTotal += sale.amount;
      }
    }

    const grossProfit = totalSales - totalCogs;
    const grossProfitToday = salesTodayTotal - cogsToday;

    const totalExpenses = expensesData.reduce((acc, exp) => acc + exp.amount, 0);
    const expensesToday = expensesData
      .filter(exp => exp.createdAt?.toDate && isWithinInterval(exp.createdAt.toDate(), todayInterval))
      .reduce((acc, exp) => acc + exp.amount, 0);

    const netProfit = grossProfit - totalExpenses;
    const netProfitToday = grossProfitToday - expensesToday;

    const soldProducts = Object.values(salesByProduct);
    const bestSellingProduct = soldProducts.length > 0 ? [...soldProducts].sort((a, b) => b.sales - a.sales)[0] : undefined;
    const worstSellingProduct = soldProducts.length > 0 ? [...soldProducts].sort((a, b) => a.sales - b.sales)[0] : undefined;

    const lowStockProducts = productsData
      .flatMap(p => {
        if (p.hasVariants && p.variants) {
          return p.variants.map(v => {
            const quantity = Object.values(v.stockByBranch || {}).reduce((s, q) => s + q, 0);
            return { id: `${p.id}-${v.id}`, name: `${p.name} (${v.name})`, quantity };
          });
        }
        const quantity = Object.values(p.stockByBranch || {}).reduce((s, q) => s + q, 0);
        return [{ id: p.id, name: p.name, quantity }];
      })
      .filter(p => p.quantity <= 10);

    let totalDeposits = 0;
    let totalWithdrawals = 0;
    for (const transaction of transactionsData) {
      if (transaction.type === 'deposit') totalDeposits += transaction.amount;
      if (transaction.type === 'withdrawal') totalWithdrawals += transaction.amount;
    }

    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;
    const cashBalance = totalDeposits - totalWithdrawals;
    const daysWithExpenses = new Set(expensesData.map(e => e.createdAt.toDate().toDateString())).size;
    const dailyAvgExpense = daysWithExpenses > 0 ? totalExpenses / daysWithExpenses : 0;

    return {
      totalSales,
      totalProfit: netProfit,
      bestSellingProduct,
      worstSellingProduct,
      lowStockProducts,
      salesTodayCount,
      salesTodayTotal,
      profitToday: netProfitToday,
      totalDeposits,
      totalWithdrawals,
      totalExpenses,
      profitMargin,
      cashBalance,
      dailyAvgExpense,
      salesDays: saleDates.size,
    };
  }, [salesData, productsData, expensesData, transactionsData]);

  const isInsightsReady = !!businessData && !!salesData && !!expensesData && !!transactionsData && !!productsData;

  const quickQuestions = useMemo(() => {
    const list = t('askBusmo.ownerQuickQuestions', { returnObjects: true }) as unknown;
    const questions = Array.isArray(list) ? (list as string[]).filter(Boolean) : [];

    // Shuffle suggestions so owners see different prompts each visit.
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 8);
  }, [t, language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    setMessages(prev => {
      if (prev.length !== 1) return prev;
      const first = prev[0];
      if (!first || first.id !== 'initial' || first.sender !== 'ai') return prev;
      const nextText = t('askBusmo.greeting');
      if (first.text === nextText) return prev;
      return [{ ...first, text: nextText }];
    });
  }, [language, t]);

  const submitQuestion = async (question: string) => {
    const trimmed = (question || '').trim();
    if (!trimmed || isLoading) return;

    if (!isInsightsReady) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: loadingDataText,
          sender: 'ai',
        },
      ]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: trimmed,
      sender: 'user',
    };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = trimmed;
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await getBusinessInsights({
        query: currentInput,
        insights: {
          totalSales: businessInsights.totalSales,
          totalProfit: businessInsights.totalProfit,
          bestSellingProduct: businessInsights.bestSellingProduct,
          worstSellingProduct: businessInsights.worstSellingProduct,
          lowStockProducts: businessInsights.lowStockProducts,
          salesTodayCount: businessInsights.salesTodayCount,
          salesTodayTotal: businessInsights.salesTodayTotal,
          profitToday: businessInsights.profitToday,
          totalDeposits: businessInsights.totalDeposits,
          totalWithdrawals: businessInsights.totalWithdrawals,
          totalExpenses: businessInsights.totalExpenses,
          profitMargin: businessInsights.profitMargin,
          cashBalance: businessInsights.cashBalance,
          dailyAvgExpense: businessInsights.dailyAvgExpense,
          salesDays: businessInsights.salesDays,
          expenseRatioPct:
            businessInsights.totalSales > 0
              ? (businessInsights.totalExpenses / businessInsights.totalSales) * 100
              : undefined,
          expensesGreaterThanSales:
            businessInsights.totalSales > 0
              ? businessInsights.totalExpenses > businessInsights.totalSales
              : undefined,
          isNetProfitNegative: businessInsights.totalProfit < 0,
        },
        currency: getCurrencySymbol(businessData?.currency || businessData?.country),
        language,
      });
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response?.answer || unavailableText,
        sender: 'ai',
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error getting business insights:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: unavailableText,
        sender: 'ai',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    await submitQuestion(inputValue);
  };

  const sendQuickQuestion = async (question: string) => {
    await submitQuestion(question);
  };

  return (
    <MainLayout title={t('askBusmo.title')} backHref="/owner/home">
      <div className="flex flex-col h-full w-full max-w-2xl">
        <div className="flex-1 overflow-y-auto p-1 md:p-4 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.sender === 'user' ? 'justify-end' : ''
              }`}
            >
              {message.sender === 'ai' && (
                <Avatar className="w-8 h-8 border">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-sm md:max-w-md rounded-xl p-3 text-base ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-card border rounded-bl-none'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3">
              <Avatar className="w-8 h-8 border">
                 <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="w-5 h-5" />
                  </AvatarFallback>
              </Avatar>
              <div className="max-w-xs md:max-w-md rounded-xl p-3 bg-card border w-32 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {quickQuestions.length > 0 && (
          <div className="border-t bg-background px-1 md:px-4 py-3">
            <div className="text-sm text-muted-foreground mb-2">{t('askBusmo.tryAsking')}</div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {quickQuestions.map((q) => (
                <Button
                  key={q}
                  type="button"
                  variant="secondary"
                  className="h-9 shrink-0"
                  disabled={isLoading || isUserLoading || !isInsightsReady}
                  onClick={() => sendQuickQuestion(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}

        <form
          onSubmit={handleSendMessage}
          className={`flex items-center gap-2 pt-4 bg-background ${quickQuestions.length > 0 ? '' : 'border-t'}`}
        >
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t('askBusmo.placeholder')}
            className="h-12 flex-1 text-base"
            disabled={isLoading || isUserLoading}
            autoFocus
          />
          <Button type="submit" size="icon" className="h-12 w-12 shrink-0" disabled={isLoading || !inputValue.trim()}>
            <Send className="h-6 w-6" />
          </Button>
        </form>
      </div>
    </MainLayout>
  );
}

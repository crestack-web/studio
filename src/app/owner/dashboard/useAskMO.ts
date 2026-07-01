'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { initializeFirebase } from '@/firebase';
import { getFirestore, collection, query, where, getDocs, Timestamp, doc, getDoc, setDoc, addDoc, deleteDoc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { isRestaurantBusiness } from './utils/restaurantHelpers';

interface MOMessage {
  id: string;
  role: 'bot' | 'user';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  audioUrl?: string;
  quickActions?: Array<{ label: string; action: string }>;
  metrics?: Array<{ label: string; value: string; trend?: string }>;
  followUpSuggestions?: Array<string>;
  expandableSections?: Array<{ title: string; content: string; id: string }>;
  alerts?: Array<{ type: 'warning' | 'info' | 'success' | 'error'; message: string }>;
  saleCard?: {
    items: Array<{ name: string; quantity: number; price: number; costPrice?: number }>;
    totalRevenue: number;
    totalProfit?: number;
    timestamp: Date;
  };
  productCard?: {
    type: 'product';
    name: string;
    price: number;
    cost: number;
    stock: number;
    sku?: string;
    message: string;
  };
  expenseCard?: {
    type: 'expense';
    category: string;
    amount: number;
    date: string;
    message: string;
  };
}

interface Conversation {
  id: string;
  title: string;
  preview: string;
  businessId?: string;
  branchId?: string;
  branchName?: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  messages?: MOMessage[];
}

interface UseAskMOOptions {
  userId: string;
  userPlan?: string;
  businessId?: string;
  branchId?: string;
  branchName?: string;
}

export function useAskMO({ userId, userPlan, businessId, branchId, branchName }: UseAskMOOptions) {
  const [messages, setMessages] = useState<MOMessage[]>([]);
  // Ref to always have the latest messages, avoiding stale closures in saveConversation
  const messagesRef = useRef<MOMessage[]>([]);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [creditsRemaining, setCreditsRemaining] = useState(2500);
  const [planLimit, setPlanLimit] = useState(10);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [businessSummary, setBusinessSummary] = useState<any>(null);

  // Plan-based limitations
  const PLAN_LIMITS = {
    starter: { messagesPerDay: 10, totalCredits: 2500 },
    standard: { messagesPerDay: 50, totalCredits: 10000 },
    pro: { messagesPerDay: -1, totalCredits: -1 },
  };

  // Load user's plan and credits only (no conversation restoration)
  useEffect(() => {
    const loadPlanLimits = async () => {
      try {
        const { firestore } = initializeFirebase();
        const normalizedPlan = userPlan?.toLowerCase() || 'starter';
        const limits = PLAN_LIMITS[normalizedPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.starter;

        setPlanLimit(limits.messagesPerDay);

        // Load credits from Firestore
        try {
          const userDoc = await getDoc(doc(firestore, 'users', userId));
          const userData = userDoc.data();
          
          // Handle credit initialization
          let storedCredits = userData?.moCreditsRemaining;
          
          // If credits don't exist or are invalid, initialize them
          if (storedCredits === undefined || storedCredits === null || storedCredits === -1) {
            // Only initialize if not on pro plan (pro has unlimited credits)
            if (limits.totalCredits !== -1) {
              storedCredits = limits.totalCredits;
              // Save the initial credits to Firestore
              await updateDoc(doc(firestore, 'users', userId), {
                moCreditsRemaining: storedCredits
              }).catch(err => console.error('Error initializing credits:', err));
            } else {
              // Pro plan - unlimited credits
              storedCredits = -1;
            }
          }
          
          setCreditsRemaining(storedCredits);

          // Load business analysis from onboarding if available
          const businessAnalysis = userData?.businessAnalysis;
          if (businessAnalysis) {
            console.log('Loaded onboarding business analysis:', businessAnalysis);
            
            // Store business analysis in state for use in business summary
            setBusinessSummary((prev: any) => ({
              ...prev,
              businessAnalysis: {
                businessType: businessAnalysis.businessType,
                operationalNeeds: businessAnalysis.operationalNeeds,
                productTypes: businessAnalysis.productTypes,
                recommendedCategories: businessAnalysis.recommendedCategories,
                recommendedFeatures: businessAnalysis.recommendedFeatures,
              }
            }));
          }
        } catch (error) {
          console.error('Error loading credits from Firestore:', error);
          setCreditsRemaining(limits.totalCredits);
        }

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayStartTimestamp = Timestamp.fromDate(todayStart);

        try {
          const messagesQuery = query(
            collection(firestore, 'users', userId, 'mo_messages'),
            where('timestamp', '>=', todayStartTimestamp)
          );

          const snapshot = await getDocs(messagesQuery);
          setCreditsUsed(snapshot.size);
        } catch (error) {
          console.error('Error loading today\'s messages:', error);
        }

        // Load conversation history list (just metadata, not messages)
        try {
          const conversationsQuery = query(
            collection(firestore, 'users', userId, 'mo_conversations'),
            orderBy('updatedAt', 'desc'),
            limit(50)
          );

          const conversationsSnapshot = await getDocs(conversationsQuery);
          const loadedConversations: Conversation[] = [];
          
          conversationsSnapshot.forEach(doc => {
            const data = doc.data();
            loadedConversations.push({
              id: doc.id,
              title: data.title || 'Untitled Conversation',
              preview: data.preview || data.messages?.[0]?.content?.substring(0, 100) || 'No preview',
              businessId: data.businessId,
              branchId: data.branchId,
              branchName: data.branchName,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              messageCount: data.messages?.length || 0,
              messages: data.messages || [],
            });
          });

          setConversations(loadedConversations);
        } catch (error) {
          console.error('Error loading conversations:', error);
        }

        // Load business data (only if businessId is available)
        if (businessId) {
          try {
            // Check if business is a restaurant
            const isRestaurant = await isRestaurantBusiness(businessId);

            const salesQuery = query(
              collection(firestore, 'businesses', businessId, 'sales'),
              where('createdAt', '>=', Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
            );
            const salesSnapshot = await getDocs(salesQuery);
            
            let totalSales = 0;
            let totalProfit = 0;
            let todaySales = 0;
            let todayProfit = 0;
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);
            
            salesSnapshot.forEach(doc => {
              const data = doc.data();
              const saleAmount = data.totalRevenue || data.total || 0;
              const saleProfit = data.profit || 0;
              totalSales += saleAmount;
              totalProfit += saleProfit;
              
              const saleDate = data.createdAt?.toDate();
              if (saleDate && saleDate >= todayDate) {
                todaySales += saleAmount;
                todayProfit += saleProfit;
              }
            });

            const productsQuery = query(
              collection(firestore, 'businesses', businessId, 'products'),
              where('active', '==', true)
            );
            const productsSnapshot = await getDocs(productsQuery);
            let lowStockCount = 0;
            let outOfStockCount = 0;
            let totalInventoryValue = 0;
            let dishesCount = 0;
            let ingredientsCount = 0;
            let ingredientsNeedingReorder = 0;
            
            productsSnapshot.forEach(doc => {
              const data = doc.data();
              const stock = data.stock || 0;
              const threshold = data.lowStockThreshold || 10;
              const costPrice = data.costPrice || 0;
              
              if (stock === 0) outOfStockCount++;
              else if (stock <= threshold) lowStockCount++;
              
              totalInventoryValue += stock * costPrice;

              // Restaurant-specific tracking
              if (isRestaurant) {
                if (data.productType === 'dish') dishesCount++;
                if (data.productType === 'ingredient') {
                  ingredientsCount++;
                  if (stock <= (data.reorderLevel || 10)) {
                    ingredientsNeedingReorder++;
                  }
                }
              }
            });

            const expensesQuery = query(
              collection(firestore, 'businesses', businessId, 'expenses'),
              where('createdAt', '>=', Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
            );
            const expensesSnapshot = await getDocs(expensesQuery);
            let totalExpenses = 0;
            expensesSnapshot.forEach(doc => {
              const data = doc.data();
              totalExpenses += data.amount || 0;
            });

            let pendingCollections = 0;
            salesSnapshot.forEach(doc => {
              const data = doc.data();
              if (data.paymentBreakdown && Array.isArray(data.paymentBreakdown)) {
                data.paymentBreakdown.forEach((pb: any) => {
                  if (pb.method === 'credit' && !pb.received) {
                    pendingCollections += pb.amount || 0;
                  }
                });
              }
            });

            // Load operations data (suppliers, stock receipts, transfers)
            let suppliersCount = 0;
            let totalSpentOnSuppliers = 0;
            let stockReceiptsCount = 0;
            let stockTransfersCount = 0;
            
            try {
              const suppliersQuery = query(
                collection(firestore, 'businesses', businessId, 'suppliers'),
                where('active', '==', true)
              );
              const suppliersSnapshot = await getDocs(suppliersQuery);
              suppliersCount = suppliersSnapshot.size;
              suppliersSnapshot.forEach(doc => {
                const data = doc.data();
                totalSpentOnSuppliers += data.totalAmountSpent || 0;
              });
            } catch (error) {
              console.error('Error loading suppliers:', error);
            }
            
            try {
              const receiptsQuery = query(
                collection(firestore, 'businesses', businessId, 'stockReceipts'),
                where('createdAt', '>=', Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
              );
              const receiptsSnapshot = await getDocs(receiptsQuery);
              stockReceiptsCount = receiptsSnapshot.size;
            } catch (error) {
              console.error('Error loading stock receipts:', error);
            }
            
            try {
              const transfersQuery = query(
                collection(firestore, 'businesses', businessId, 'stockTransfers'),
                where('createdAt', '>=', Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
              );
              const transfersSnapshot = await getDocs(transfersQuery);
              stockTransfersCount = transfersSnapshot.size;
            } catch (error) {
              console.error('Error loading stock transfers:', error);
            }

            // Load credit data (supplier credit, customer credit)
            let supplierCreditBalance = 0;
            let customerCreditBalance = 0;
            let pendingCreditPayments = 0;
            
            try {
              const supplierCreditQuery = query(
                collection(firestore, 'businesses', businessId, 'supplier_credit'),
                where('status', '==', 'active')
              );
              const supplierCreditSnapshot = await getDocs(supplierCreditQuery);
              supplierCreditSnapshot.forEach(doc => {
                const data = doc.data();
                supplierCreditBalance += data.outstandingBalance || 0;
              });
            } catch (error) {
              console.error('Error loading supplier credit:', error);
            }
            
            try {
              const customerCreditQuery = query(
                collection(firestore, 'businesses', businessId, 'credit_customers')
              );
              const customerCreditSnapshot = await getDocs(customerCreditQuery);
              customerCreditSnapshot.forEach(doc => {
                const data = doc.data();
                customerCreditBalance += data.currentBalance || 0;
              });
            } catch (error) {
              console.error('Error loading customer credit:', error);
            }
            
            try {
              const creditTransactionsQuery = query(
                collection(firestore, 'businesses', businessId, 'credit_transactions'),
                where('status', '==', 'pending')
              );
              const creditTransactionsSnapshot = await getDocs(creditTransactionsQuery);
              creditTransactionsSnapshot.forEach(doc => {
                const data = doc.data();
                pendingCreditPayments += data.remainingAmount || 0;
              });
            } catch (error) {
              console.error('Error loading credit transactions:', error);
            }

            // Load banking data
            let totalBankBalance = 0;
            let bankAccountsCount = 0;
            let recentBankTransactions = 0;
            
            try {
              const bankAccountsQuery = query(
                collection(firestore, 'businesses', businessId, 'bankAccounts'),
                where('isActive', '==', true)
              );
              const bankAccountsSnapshot = await getDocs(bankAccountsQuery);
              bankAccountsCount = bankAccountsSnapshot.size;
              bankAccountsSnapshot.forEach(doc => {
                const data = doc.data();
                totalBankBalance += data.balance || 0;
              });
            } catch (error) {
              console.error('Error loading bank accounts:', error);
            }
            
            try {
              const bankTransactionsQuery = query(
                collection(firestore, 'businesses', businessId, 'bankTransactions'),
                where('createdAt', '>=', Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
              );
              const bankTransactionsSnapshot = await getDocs(bankTransactionsQuery);
              recentBankTransactions = bankTransactionsSnapshot.size;
            } catch (error) {
              console.error('Error loading bank transactions:', error);
            }

            // Load staff activity data
            let staffCount = 0;
            let totalStaffActions = 0;
            let staffSalesCount = 0;
            let staffRevenue = 0;
            
            try {
              const staffQuery = query(
                collection(firestore, 'businesses', businessId, 'staff'),
                where('isActive', '==', true)
              );
              const staffSnapshot = await getDocs(staffQuery);
              staffCount = staffSnapshot.size;
              staffSnapshot.forEach(doc => {
                const data = doc.data();
                staffSalesCount += data.transactions || 0;
                staffRevenue += data.revenue || 0;
              });
            } catch (error) {
              console.error('Error loading staff:', error);
            }
            
            try {
              const staffActivityQuery = query(
                collection(firestore, 'businesses', businessId, 'staffActivity'),
                where('timestamp', '>=', Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
              );
              const staffActivitySnapshot = await getDocs(staffActivityQuery);
              totalStaffActions = staffActivitySnapshot.size;
            } catch (error) {
              console.error('Error loading staff activity:', error);
            }

            // Load cash flow data
            let totalMoneyIn = 0;
            let totalMoneyOut = 0;
            
            try {
              const cashFlowQuery = query(
                collection(firestore, 'businesses', businessId, 'cashFlow'),
                where('date', '>=', Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
              );
              const cashFlowSnapshot = await getDocs(cashFlowQuery);
              cashFlowSnapshot.forEach(doc => {
                const data = doc.data();
                totalMoneyIn += data.moneyIn || 0;
                totalMoneyOut += data.moneyOut || 0;
              });
            } catch (error) {
              console.error('Error loading cash flow:', error);
            }

            // Build business summary with restaurant-specific data and operations data
            const summary: any = {
              totalSales,
              totalProfit,
              todaySales,
              todayProfit,
              lowStockCount,
              outOfStockCount,
              totalInventoryValue,
              totalExpenses,
              pendingCollections,
              // Operations data
              suppliersCount,
              totalSpentOnSuppliers,
              stockReceiptsCount,
              stockTransfersCount,
              // Credit data
              supplierCreditBalance,
              customerCreditBalance,
              pendingCreditPayments,
              // Banking data
              totalBankBalance,
              bankAccountsCount,
              recentBankTransactions,
              // Staff activity data
              staffCount,
              totalStaffActions,
              staffSalesCount,
              staffRevenue,
              // Cash flow data
              totalMoneyIn,
              totalMoneyOut,
              netCashFlow: totalMoneyIn - totalMoneyOut,
            };

            // Add restaurant-specific context
            if (isRestaurant) {
              summary.isRestaurant = true;
              summary.dishesCount = dishesCount;
              summary.ingredientsCount = ingredientsCount;
              summary.ingredientsNeedingReorder = ingredientsNeedingReorder;
              summary.foodCostPercentage = totalSales > 0 ? ((totalSales - totalProfit) / totalSales) * 100 : 0;
              
              // Calculate restaurant health score (simplified version)
              const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
              const stockHealth = productsSnapshot.size > 0 ? ((productsSnapshot.size - outOfStockCount) / productsSnapshot.size) * 100 : 100;
              const reorderHealth = ingredientsCount > 0 ? ((ingredientsCount - ingredientsNeedingReorder) / ingredientsCount) * 100 : 100;
              
              summary.restaurantHealthScore = Math.round(
                (profitMargin > 20 ? 25 : profitMargin > 10 ? 20 : 15) +
                (stockHealth * 0.25) +
                (reorderHealth * 0.2) +
                (totalExpenses / totalSales < 0.3 ? 25 : 15)
              );
            }

            setBusinessSummary(summary);
          } catch (error) {
            console.error('Error loading business data:', error);
          }
        }
      } catch (error) {
        console.error('Error loading plan limits:', error);
      }
    };

    if (userId) {
      loadPlanLimits();
    }
  }, [userId, userPlan, businessId]);

  // Keep ref in sync with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Create a new conversation and save it immediately
  const createConversation = useCallback(async (firstMessage: MOMessage): Promise<string> => {
    try {
      const { firestore } = initializeFirebase();
      
      const conversationData: any = {
        title: generateConversationTitle([firstMessage]),
        preview: firstMessage.content.substring(0, 100),
        messages: [firstMessage],
        businessId: businessId || userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        messageCount: 1,
      };

      // Only include branchId and branchName if they are defined
      if (branchId) {
        conversationData.branchId = branchId;
      }
      if (branchName) {
        conversationData.branchName = branchName;
      }

      const docRef = await addDoc(collection(firestore, 'users', userId, 'mo_conversations'), conversationData);
      const newConversationId = docRef.id;

      // Add to conversations list
      const newConversation: Conversation = {
        id: newConversationId,
        title: conversationData.title,
        preview: conversationData.preview,
        businessId: conversationData.businessId,
        branchId: conversationData.branchId,
        branchName: conversationData.branchName,
        createdAt: new Date(),
        updatedAt: new Date(),
        messageCount: 1,
      };

      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversationId(newConversationId);
      
      return newConversationId;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return '';
    }
  }, [userId, businessId, branchId, branchName]);

  // Save messages incrementally to current conversation
  const saveMessages = useCallback(async (conversationId: string, updatedMessages: MOMessage[]) => {
    try {
      const { firestore } = initializeFirebase();
      
      const conversationRef = doc(firestore, 'users', userId, 'mo_conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (!conversationDoc.exists()) {
        console.error('Conversation not found:', conversationId);
        return;
      }

      const conversationData = conversationDoc.data();
      const title = conversationData?.title || 'Untitled Conversation';
      const preview = updatedMessages[0]?.content?.substring(0, 100) || 'No preview';

      await updateDoc(conversationRef, {
        title,
        preview,
        messages: updatedMessages,
        updatedAt: Timestamp.now(),
        messageCount: updatedMessages.length,
      });

      // Update conversations list
      setConversations(prev => prev.map(c => 
        c.id === conversationId 
          ? { 
              ...c, 
              title, 
              preview, 
              updatedAt: new Date(), 
              messageCount: updatedMessages.length 
            }
          : c
      ));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  }, [userId]);

  // Load messages for a specific conversation
  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      const { firestore } = initializeFirebase();
      const docRef = doc(firestore, 'users', userId, 'mo_conversations', conversationId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const loadedMessages = data.messages || [];
        
        // Convert Firestore timestamps back to Date objects for proper rendering
        const messagesWithDates = loadedMessages.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp || Date.now()),
        }));
        
        setMessages(messagesWithDates);
        setCurrentConversationId(conversationId);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  }, [userId, setMessages]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      const { firestore } = initializeFirebase();
      await deleteDoc(doc(firestore, 'users', userId, 'mo_conversations', conversationId));
      
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (currentConversationId === conversationId) {
        setMessages([]);
        setCurrentConversationId(null);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  }, [currentConversationId, userId]);

  const renameConversation = useCallback(async (conversationId: string, newTitle: string) => {
    try {
      const { firestore } = initializeFirebase();
      await updateDoc(doc(firestore, 'users', userId, 'mo_conversations', conversationId), {
        title: newTitle,
        updatedAt: Timestamp.now(),
      });

      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, title: newTitle } : c
      ));
    } catch (error) {
      console.error('Error renaming conversation:', error);
    }
  }, [userId]);

  // Save current messages to current conversation - uses ref to avoid stale closure
  const saveConversation = useCallback(async () => {
    if (!currentConversationId) return;
    await saveMessages(currentConversationId, messagesRef.current);
  }, [currentConversationId, saveMessages]);

  const updateCredits = useCallback(async (creditsConsumed: number) => {
    const normalizedPlan = userPlan?.toLowerCase() || 'starter';
    const isProPlan = normalizedPlan === 'pro';
    
    if (!isProPlan) {
      setCreditsRemaining(prev => {
        const newRemaining = Math.max(0, prev - creditsConsumed);
        const { firestore } = initializeFirebase();
        updateDoc(doc(firestore, 'users', userId), {
          moCreditsRemaining: newRemaining,
        }).catch(err => console.error('Error saving credits:', err));
        return newRemaining;
      });
      setCreditsUsed(prev => prev + creditsConsumed);
    }
  }, [userPlan, userId]);

  function generateConversationTitle(messages: MOMessage[]): string {
    if (messages.length === 0) return 'New Conversation';
    
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (firstUserMessage) {
      const content = firstUserMessage.content.trim();
      // Remove common greetings and get the main request
      const cleanedContent = content
        .replace(/^(hi|hello|hey|good morning|good afternoon|good evening|mo|hey mo)\s*,?\s*/i, '')
        .replace(/^(please|can you|could you|i want|i need|i would like)\s+/i, '')
        .replace(/[?!.,;]+$/, '')
        .trim();
      
      // Take first 6-8 words for title
      const words = cleanedContent.split(' ').slice(0, 8).join(' ');
      return words.length > 40 ? words.substring(0, 40) + '...' : words || 'New Conversation';
    }

    return 'Conversation';
  }

  // Reset to empty state (for new chat or page refresh)
  const resetToNewChat = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
  }, []);

  return {
    messages,
    setMessages,
    creditsUsed,
    creditsRemaining,
    planLimit,
    conversations,
    currentConversationId,
    setCurrentConversationId,
    businessSummary,
    createConversation,
    saveConversation,
    saveMessages,
    loadConversation,
    deleteConversation,
    renameConversation,
    updateCredits,
    resetToNewChat,
  };
}
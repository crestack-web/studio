'use client';

import { useState, useEffect, useCallback } from 'react';
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
  alerts?: Array<{ type: 'warning' | 'info' | 'success'; message: string }>;
}

interface Conversation {
  id: string;
  title: string;
  messages: MOMessage[];
  businessId?: string;
  branchId?: string;
  branchName?: string;
  createdAt: Date;
  updatedAt: Date;
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

  // Load user's plan and message history
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

        // Load conversation history
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
              messages: data.messages || [],
              businessId: data.businessId,
              branchId: data.branchId,
              branchName: data.branchName,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            });
          });

          setConversations(loadedConversations);

          // Start with empty state instead of auto-loading most recent conversation
          // Users can select a conversation from history to continue it
          setMessages([{
            id: 'init',
            role: 'bot',
            content: `Hi, I'm Mo! I'm here to help you understand your business better.\n\nI can help you with sales insights, inventory management, cash flow analysis, and more.\n\nWhat would you like to explore today?`,
            timestamp: new Date(),
          }]);
          setCurrentConversationId(null);
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

            // Build business summary with restaurant-specific data
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

  const saveConversation = useCallback(async (conversationTitle?: string) => {
    try {
      const { firestore } = initializeFirebase();
      const title = conversationTitle || generateConversationTitle(messages);
      
      const conversationData = {
        title,
        messages: messages,
        businessId: businessId || userId,
        branchId: branchId,
        branchName: branchName || 'Main Branch',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      if (currentConversationId) {
        await setDoc(doc(firestore, 'users', userId, 'mo_conversations', currentConversationId), conversationData, { merge: true });
      } else {
        const docRef = await addDoc(collection(firestore, 'users', userId, 'mo_conversations'), conversationData);
        setCurrentConversationId(docRef.id);
      }

      // Reload conversations
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
          messages: data.messages || [],
          businessId: data.businessId,
          branchId: data.branchId,
          branchName: data.branchName,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      setConversations(loadedConversations);
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }, [messages, currentConversationId, businessId, userId, branchId, branchName]);

  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      const { firestore } = initializeFirebase();
      const docRef = doc(firestore, 'users', userId, 'mo_conversations', conversationId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setMessages(data.messages || []);
        setCurrentConversationId(conversationId);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  }, [userId]);

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
      const content = firstUserMessage.content;
      const words = content.split(' ').slice(0, 5).join(' ');
      return words.length > 30 ? words.substring(0, 30) + '...' : words;
    }

    return 'Conversation';
  }

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
    saveConversation,
    loadConversation,
    deleteConversation,
    renameConversation,
    updateCredits,
  };
}

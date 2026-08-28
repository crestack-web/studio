'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { initializeFirebase } from '@/firebase';
import { getFirestore, collection, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { getSupabase } from '@/lib/supabase';
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
    items: Array<{ name: string; quantity: number; price: number; costPrice?: number; imageUrl?: string }>;
    totalRevenue: number;
    totalProfit?: number;
    timestamp: Date;
    mode?: 'pending' | 'recorded';
  };
  productCard?: {
    type: 'product';
    name: string;
    price: number;
    cost: number;
    stock: number;
    sku?: string;
    imageUrl?: string;
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

function toDbRole(role: 'bot' | 'user'): string {
  return role === 'bot' ? 'assistant' : 'user';
}
function fromDbRole(role: string): 'bot' | 'user' {
  return role === 'assistant' || role === 'bot' ? 'bot' : 'user';
}
function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function generateConversationTitle(messages: MOMessage[]): string {
  if (messages.length === 0) return 'New Conversation';
  const firstUserMessage = messages.find((m) => m.role === 'user');
  if (firstUserMessage) {
    const content = firstUserMessage.content.trim();
    const cleanedContent = content
      .replace(/^(hi|hello|hey|good morning|good afternoon|good evening|mo|hey mo)\s*,?\s*/i, '')
      .replace(/^(please|can you|could you|i want|i need|i would like)\s+/i, '')
      .replace(/[?!.,;]+$/, '')
      .trim();
    const words = cleanedContent.split(' ').slice(0, 8).join(' ');
    return words.length > 40 ? words.substring(0, 40) + '...' : words || 'New Conversation';
  }
  return 'Conversation';
}

export function useAskMO({ userId, userPlan, businessId, branchId, branchName }: UseAskMOOptions) {
  const [messages, setMessages] = useState<MOMessage[]>([]);
  const messagesRef = useRef<MOMessage[]>([]);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [creditsRemaining, setCreditsRemaining] = useState(2000);
  const [totalCreditsConsumed, setTotalCreditsConsumed] = useState(0);
  const [planLimit, setPlanLimit] = useState(10);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [businessSummary, setBusinessSummary] = useState<any>(null);
  const [totalConversationsStarted, setTotalConversationsStarted] = useState(0);
  const [averageConversationTime, setAverageConversationTime] = useState(0);

  const PLAN_LIMITS = {
    starter: { messagesPerDay: 10, totalCredits: 2000 },
    standard: { messagesPerDay: 50, totalCredits: 10000 },
    pro: { messagesPerDay: -1, totalCredits: -1 },
  };

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      try {
        const supabase = getSupabase();
        const normalizedPlan = userPlan?.toLowerCase() || 'starter';
        const limits = PLAN_LIMITS[normalizedPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.starter;
        setPlanLimit(limits.messagesPerDay);

        try {
          const { data: userRow } = await supabase.from('users').select('metadata').eq('id', userId).maybeSingle();
          const meta = (userRow?.metadata as Record<string, any>) || {};
          let storedCredits = meta.moCreditsRemaining;
          if (storedCredits === undefined || storedCredits === null) {
            storedCredits = limits.totalCredits !== -1 ? limits.totalCredits : -1;
            if (limits.totalCredits !== -1) {
              await supabase.from('users').update({ metadata: { ...meta, moCreditsRemaining: storedCredits } }).eq('id', userId);
            }
          }
          setCreditsRemaining(storedCredits);
          setTotalCreditsConsumed(meta.moCreditsConsumed || 0);
          setTotalConversationsStarted(meta.moTotalConversations || 0);
          setAverageConversationTime(meta.moAverageConversationTime || 0);
        } catch (e) {
          console.error('MO credits load error:', e);
          setCreditsRemaining(PLAN_LIMITS.starter.totalCredits);
        }

        try {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const { count } = await supabase
            .from('mo_messages')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('role', 'user')
            .gte('created_at', todayStart.toISOString());
          setCreditsUsed(count || 0);
        } catch (e) {
          console.error('MO daily count error:', e);
        }

        try {
          const { data: convRows, error } = await supabase
            .from('mo_conversations')
            .select('id, title, business_id, created_at, updated_at')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(50);
          if (error) throw error;
          const loaded: Conversation[] = (convRows || []).map((row: any) => ({
            id: row.id,
            title: row.title || 'Untitled Conversation',
            preview: '',
            businessId: row.business_id || undefined,
            createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
            messageCount: 0,
          }));
          if (loaded.length) {
            const ids = loaded.map((c) => c.id);
            const { data: msgs } = await supabase
              .from('mo_messages')
              .select('conversation_id, content, role')
              .in('conversation_id', ids)
              .order('created_at', { ascending: true });
            const previewBy: Record<string, string> = {};
            const countBy: Record<string, number> = {};
            (msgs || []).forEach((m: any) => {
              countBy[m.conversation_id] = (countBy[m.conversation_id] || 0) + 1;
              if (m.role === 'user' && !previewBy[m.conversation_id] && m.content) {
                previewBy[m.conversation_id] = String(m.content).substring(0, 100);
              }
            });
            loaded.forEach((c) => {
              c.preview = previewBy[c.id] || 'No preview';
              c.messageCount = countBy[c.id] || 0;
            });
          }
          setConversations(loaded);
          console.log('📂 [useAskMO] Conversations loaded from Supabase');
        } catch (e) {
          console.error('MO conversations load error:', e);
        }
      } catch (e) {
        console.error('useAskMO init error:', e);
      }
    };
    load();
  }, [userId, userPlan]);

  const loadBusinessData = useCallback(async () => {
    if (!businessId || businessSummary) return;
    try {
      const { firestore } = initializeFirebase();
      const isRestaurant = await isRestaurantBusiness(businessId);
      const salesSnapshot = await getDocs(collection(firestore, 'businesses', businessId, 'sales'));
      let totalSales = 0;
      let totalProfit = 0;
      let todaySales = 0;
      let todayProfit = 0;
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
      salesSnapshot.forEach((d) => {
        const data = d.data();
        const saleAmount = data.totalRevenue || data.total || 0;
        const saleProfit = data.profit || 0;
        totalSales += saleAmount;
        totalProfit += saleProfit;
        const saleDate = data.createdAt?.toDate?.();
        if (saleDate && saleDate >= todayDate) {
          todaySales += saleAmount;
          todayProfit += saleProfit;
        }
        if (Array.isArray(data.products)) {
          data.products.forEach((item: any) => {
            const productName = item.name || item.productName || 'Unknown';
            const quantity = item.quantity || 0;
            const revenue = item.total || item.price * quantity || 0;
            if (!productSales[productName]) productSales[productName] = { name: productName, quantity: 0, revenue: 0 };
            productSales[productName].quantity += quantity;
            productSales[productName].revenue += revenue;
          });
        }
      });

      const productsSnapshot = await getDocs(
        query(collection(firestore, 'businesses', businessId, 'products'), where('active', '==', true))
      );
      let lowStockCount = 0;
      let outOfStockCount = 0;
      let totalInventoryValue = 0;
      const outOfStockProducts: any[] = [];
      const lowStockProducts: any[] = [];
      productsSnapshot.forEach((d) => {
        const data = d.data();
        const stock = data.stock || 0;
        const threshold = data.lowStockThreshold || 10;
        const costPrice = data.costPrice || 0;
        const productName = data.displayName || data.name || 'Unknown';
        if (stock === 0) {
          outOfStockCount++;
          outOfStockProducts.push({ name: productName, quantity: stock, sku: data.sku });
        } else if (stock <= threshold) {
          lowStockCount++;
          lowStockProducts.push({ name: productName, quantity: stock, threshold, sku: data.sku });
        }
        totalInventoryValue += stock * costPrice;
      });

      const expensesSnapshot = await getDocs(
        query(
          collection(firestore, 'businesses', businessId, 'expenses'),
          where('createdAt', '>=', Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
        )
      );
      let totalExpenses = 0;
      expensesSnapshot.forEach((d) => {
        totalExpenses += d.data().amount || 0;
      });

      setBusinessSummary({
        totalSales,
        totalProfit,
        todaySales,
        todayProfit,
        lowStockCount,
        outOfStockCount,
        outOfStockProducts,
        lowStockProducts,
        totalInventoryValue,
        totalExpenses,
        isRestaurant,
        topSellingProducts: Object.values(productSales)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10),
      });
    } catch (e) {
      console.error('Business data load error:', e);
    }
  }, [businessId, businessSummary]);

  const createConversation = useCallback(
    async (firstMessage: MOMessage): Promise<string> => {
      try {
        if (!businessId) {
          console.error('createConversation: missing businessId');
          return '';
        }
        const supabase = getSupabase();
        const id = newId();
        const title = generateConversationTitle([firstMessage]);
        const { error } = await supabase.from('mo_conversations').insert({
          id,
          business_id: businessId,
          user_id: userId,
          title,
        });
        if (error) {
          console.error('createConversation error:', error);
          return '';
        }
        await supabase.from('mo_messages').insert({
          id: firstMessage.id || newId(),
          conversation_id: id,
          business_id: businessId,
          user_id: userId,
          role: toDbRole(firstMessage.role),
          content: firstMessage.content || '',
        });
        const nextTotal = totalConversationsStarted + 1;
        setTotalConversationsStarted(nextTotal);
        try {
          const { data: userRow } = await supabase.from('users').select('metadata').eq('id', userId).maybeSingle();
          const meta = (userRow?.metadata as Record<string, any>) || {};
          await supabase.from('users').update({ metadata: { ...meta, moTotalConversations: nextTotal } }).eq('id', userId);
        } catch (_) {}
        const preview = (firstMessage.content || '').substring(0, 100);
        setConversations((prev) => [
          {
            id,
            title,
            preview,
            businessId,
            branchId,
            branchName,
            createdAt: new Date(),
            updatedAt: new Date(),
            messageCount: 1,
          },
          ...prev,
        ]);
        setCurrentConversationId(id);
        return id;
      } catch (e) {
        console.error('createConversation error:', e);
        return '';
      }
    },
    [userId, businessId, branchId, branchName, totalConversationsStarted]
  );

  const saveMessages = useCallback(
    async (conversationId: string, updatedMessages: MOMessage[]) => {
      try {
        if (!businessId) return;
        const supabase = getSupabase();
        const { data: existing } = await supabase.from('mo_messages').select('id').eq('conversation_id', conversationId);
        const existingIds = new Set((existing || []).map((m: any) => m.id));
        const toInsert = updatedMessages
          .filter((m) => m.id && !existingIds.has(m.id))
          .map((m) => ({
            id: m.id,
            conversation_id: conversationId,
            business_id: businessId,
            user_id: userId,
            role: toDbRole(m.role),
            content: m.content || '',
            created_at: m.timestamp instanceof Date ? m.timestamp.toISOString() : new Date().toISOString(),
          }));
        if (toInsert.length) {
          const { error } = await supabase.from('mo_messages').upsert(toInsert, {
            onConflict: 'id',
            ignoreDuplicates: false,
          });
          if (error) {
            console.error('saveMessages upsert error:', error);
            // Retry plain insert without created_at in case of column mismatch
            const slim = toInsert.map(({ created_at, ...rest }) => rest);
            const { error: e2 } = await supabase.from('mo_messages').insert(slim);
            if (e2) console.error('saveMessages insert retry error:', e2);
          }
        }
        const title = generateConversationTitle(updatedMessages);
        const preview =
          updatedMessages.find((m) => m.role === 'user')?.content?.substring(0, 100) ||
          updatedMessages[0]?.content?.substring(0, 100) ||
          'No preview';
        await supabase
          .from('mo_conversations')
          .update({ title, updated_at: new Date().toISOString() })
          .eq('id', conversationId);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId
              ? { ...c, title, preview, updatedAt: new Date(), messageCount: updatedMessages.length }
              : c
          )
        );
      } catch (e) {
        console.error('saveMessages error:', e);
      }
    },
    [userId, businessId]
  );

  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      const supabase = getSupabase();
      const { data: rows, error } = await supabase
        .from('mo_messages')
        .select('id, role, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      const seen = new Set<string>();
      const loaded: MOMessage[] = (rows || [])
        .map((r: any) => ({
          id: r.id,
          role: fromDbRole(r.role),
          content: r.content || '',
          timestamp: r.created_at ? new Date(r.created_at) : new Date(),
        }))
        .filter((m) => {
          if (!m.id || seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });
      setMessages(loaded);
      setCurrentConversationId(conversationId);
    } catch (e) {
      console.error('loadConversation error:', e);
      setMessages([]);
      setCurrentConversationId(null);
    }
  }, []);

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      try {
        const supabase = getSupabase();
        await supabase.from('mo_conversations').delete().eq('id', conversationId);
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        if (currentConversationId === conversationId) {
          setMessages([]);
          setCurrentConversationId(null);
        }
      } catch (e) {
        console.error('deleteConversation error:', e);
      }
    },
    [currentConversationId]
  );

  const renameConversation = useCallback(async (conversationId: string, newTitle: string) => {
    try {
      const supabase = getSupabase();
      await supabase
        .from('mo_conversations')
        .update({ title: newTitle, updated_at: new Date().toISOString() })
        .eq('id', conversationId);
      setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, title: newTitle } : c)));
    } catch (e) {
      console.error('renameConversation error:', e);
    }
  }, []);

  const saveConversation = useCallback(async () => {
    if (!currentConversationId) return;
    await saveMessages(currentConversationId, messagesRef.current);
  }, [currentConversationId, saveMessages]);

  const updateCredits = useCallback(
    async (creditsConsumed: number) => {
      if ((userPlan || 'starter').toLowerCase() === 'pro') return;
      setCreditsRemaining((prev) => {
        const newRemaining = Math.max(0, prev - creditsConsumed);
        const newConsumed = totalCreditsConsumed + creditsConsumed;
        (async () => {
          try {
            const supabase = getSupabase();
            const { data: userRow } = await supabase.from('users').select('metadata').eq('id', userId).maybeSingle();
            const meta = (userRow?.metadata as Record<string, any>) || {};
            await supabase
              .from('users')
              .update({ metadata: { ...meta, moCreditsRemaining: newRemaining, moCreditsConsumed: newConsumed } })
              .eq('id', userId);
          } catch (err) {
            console.error('updateCredits error:', err);
          }
        })();
        return newRemaining;
      });
      setCreditsUsed((prev) => prev + creditsConsumed);
      setTotalCreditsConsumed((prev) => prev + creditsConsumed);
    },
    [userPlan, userId, totalCreditsConsumed]
  );

  const resetToNewChat = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
  }, []);

  const refreshBusinessData = useCallback(async () => {
    setBusinessSummary(null);
    await loadBusinessData();
  }, [loadBusinessData]);

  return {
    messages,
    setMessages,
    creditsUsed,
    creditsRemaining,
    totalCreditsConsumed,
    planLimit,
    conversations,
    currentConversationId,
    setCurrentConversationId,
    businessSummary,
    totalConversationsStarted,
    averageConversationTime,
    createConversation,
    saveConversation,
    saveMessages,
    loadConversation,
    deleteConversation,
    renameConversation,
    updateCredits,
    resetToNewChat,
    loadBusinessData,
    refreshBusinessData,
  };
}

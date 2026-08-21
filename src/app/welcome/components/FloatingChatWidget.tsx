'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Search, MessageSquare, HelpCircle, User, Bot, ChevronRight, Paperclip, Image, FileText, Mic, Smile, Phone, Mail, Clock, Check, CheckCheck, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { MoIcon } from '../../owner/dashboard/NavIcons';
import { initializeFirebase } from '@/firebase';
import { getSupabase } from '@/lib/supabase';
import { doc, getDoc, collection, addDoc, serverTimestamp, updateDoc, arrayUnion, query, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';

// ─── Types ───────────────────────────────────────────────────────
interface SupportMessage {
  id: string;
  sender: 'user' | 'support' | 'system';
  text: string;
  createdAt: string;
  status?: 'sent' | 'delivered' | 'read';
  attachments?: Array<{ type: string; url: string }>;
}

interface Conversation {
  id: string;
  messages: SupportMessage[];
  status: 'open' | 'waiting' | 'assigned' | 'closed';
  lastMessageAt: string;
  category?: string;
}

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  popular?: boolean;
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  message: string;
}

// ─── Data ────────────────────────────────────────────────────────
const HELP_ARTICLES: HelpArticle[] = [
  { id: '1', title: 'Getting started with Busmo', category: 'Getting Started', excerpt: 'Learn the basics of setting up your Busmo account.', content: 'Getting started content...', popular: true },
  { id: '2', title: 'Recording your first sale', category: 'Sales', excerpt: 'Step-by-step guide to recording sales.', content: 'Recording sales content...', popular: true },
  { id: '3', title: 'Adding products', category: 'Products', excerpt: 'How to add and manage your product inventory.', content: 'Adding products content...', popular: true },
  { id: '4', title: 'Managing inventory', category: 'Inventory', excerpt: 'Track stock levels and get low stock alerts.', content: 'Managing inventory content...', popular: true },
  { id: '5', title: 'Understanding profit vs revenue', category: 'Finance', excerpt: 'Learn the difference between profit and revenue.', content: 'Profit vs revenue content...', popular: false },
  { id: '6', title: 'Connecting your bank account', category: 'Payments', excerpt: 'Link your bank for seamless transactions.', content: 'Bank account content...', popular: true },
  { id: '7', title: 'Using Busmo AI', category: 'Features', excerpt: 'Harness AI to grow your business.', content: 'Busmo AI content...', popular: true },
  { id: '8', title: 'Creating invoices', category: 'Documents', excerpt: 'Generate professional invoices for your clients.', content: 'Invoices content...', popular: false },
  { id: '9', title: 'Managing expenses', category: 'Finance', excerpt: 'Track and categorize your business expenses.', content: 'Expenses content...', popular: false },
  { id: '10', title: 'Staff permissions', category: 'Settings', excerpt: 'Control access levels for your team.', content: 'Staff permissions content...', popular: false },
];

const QUICK_ACTIONS: QuickAction[] = [
  { id: '1', label: 'Record a Sale', icon: '💰', message: 'I need help recording a sale' },
  { id: '2', label: 'Inventory Problem', icon: '📦', message: 'I have an issue with my inventory' },
  { id: '3', label: 'Expense Question', icon: '💸', message: 'I have a question about expenses' },
  { id: '4', label: 'Payment Issue', icon: '💳', message: 'I\'m having trouble with a payment' },
  { id: '5', label: 'Reports', icon: '📊', message: 'I need help with reports' },
  { id: '6', label: 'Talk to Human', icon: '👤', message: 'I\'d like to speak with a human agent' },
  { id: '7', label: 'Feature Request', icon: '✨', message: 'I have a feature suggestion' },
  { id: '8', label: 'Bug Report', icon: '🐛', message: 'I found a bug in the app' },
];

const TEAM_MEMBERS = [
  { name: 'Sarah', role: 'Support Lead', online: true },
  { name: 'John', role: 'Support Agent', online: true },
  { name: 'Emily', role: 'Support Agent', online: false },
];

// ─── Component ───────────────────────────────────────────────────
export const FloatingChatWidget = () => {
  // ─── State ─────────────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'messages' | 'help'>('home');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userEmail, setUserEmail] = useState('visitor');
  const [userId, setUserId] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [userName, setUserName] = useState('there');
  const [isOnline, setIsOnline] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Chat state
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isBotMode, setIsBotMode] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  // Help center state
  const [helpSearch, setHelpSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // ─── Effects ──────────────────────────────────────────────────
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user;
      if (user) {
        setUserEmail(user.email || 'user');
        setUserId(user.id);
        setUserName(user.user_metadata?.full_name?.split(' ')[0] || user.user_metadata?.name?.split(' ')[0] || 'there');
        
        try {
          const { firestore } = initializeFirebase();
          if (firestore) {
            const userDoc = await getDoc(doc(firestore, 'users', user.id));
            if (userDoc.exists()) {
              const data = userDoc.data();
              setBusinessId(data.businessId || null);
              setBusinessName(data.businessName || null);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isChatOpen && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => chatInputRef.current?.focus(), 100);
    }
  }, [isChatOpen]);

  // ─── Chat Functions ────────────────────────────────────────────
  const saveMessageToFirestore = async (text: string, sender: 'user' | 'support', parentMessageId?: string) => {
    try {
      const { firestore } = initializeFirebase();
      if (!firestore) return;

      if (sender === 'user') {
        const docRef = await addDoc(collection(firestore, 'supportMessages'), {
          userId: userId || userEmail,
          userEmail,
          businessId: businessId || null,
          businessName: businessName || null,
          message: text,
          status: 'unread',
          category: 'general',
          createdAt: serverTimestamp(),
          replies: [],
        });
        setCurrentConversationId(docRef.id);
      } else if (parentMessageId && currentConversationId) {
        const docRef = doc(firestore, 'supportMessages', parentMessageId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const replies = data.replies || [];
          replies.push({
            message: text,
            sender: 'admin',
            createdAt: new Date().toISOString(),
          });
          
          await updateDoc(docRef, {
            replies,
            status: 'open',
          });
        }
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const getBotResponse = async (text: string, conversationHistory: any[] = []): Promise<string> => {
    if (!isBotMode) {
      return "I've requested a human agent. They'll be with you shortly. In the meantime, I can still help with general questions about Busmo.";
    }

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          userEmail,
          userId,
          businessId,
          businessName,
          conversationHistory,
          requestHumanAgent: false,
        }),
      });

      if (!res.ok) throw new Error('Failed to get response');

      const data = await res.json();
      return data.reply || "I'm here to help! Could you tell me more about what you need?";
    } catch (error) {
      console.error('Error getting response:', error);
      return "I'm here to help! Could you tell me more about what you need?";
    }
  };

  const handleRequestHumanAgent = async () => {
    setIsBotMode(false);
    
    try {
      const { firestore } = initializeFirebase();
      if (firestore && currentConversationId) {
        await updateDoc(doc(firestore, 'supportMessages', currentConversationId), {
          status: 'needs_human',
          'replies': arrayUnion({
            message: "User requested human agent.",
            sender: 'system',
            createdAt: new Date().toISOString(),
            type: 'human_agent_request',
          }),
        });
      }
    } catch (error) {
      console.error('Error requesting human agent:', error);
    }

    const escalationMsg: SupportMessage = {
      id: `escalation-${Date.now()}`,
      sender: 'support',
      text: "I've connected you with our support team. A human agent will be with you shortly to help you further.",
      createdAt: new Date().toISOString(),
      status: 'read',
    };
    setMessages((prev) => [...prev, escalationMsg]);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: SupportMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      createdAt: new Date().toISOString(),
      status: 'sent',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);
    setIsTyping(true);

    const conversationHistory = messages.map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    }));

    await saveMessageToFirestore(text, 'user');

    let replyText: string;

    if (isBotMode) {
      replyText = await getBotResponse(text, conversationHistory);
      
      const botMsg: SupportMessage = {
        id: `mo-${Date.now()}`,
        sender: 'support',
        text: replyText,
        createdAt: new Date().toISOString(),
        status: 'read',
      };
      
      if (currentConversationId) {
        await saveMessageToFirestore(replyText, 'support', currentConversationId);
      }
      
      setMessages((prev) => [...prev, botMsg]);
      setIsSending(false);
      setIsTyping(false);
    } else {
      // Human agent mode
      try {
        const res = await fetch('/api/support', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: text,
              userEmail,
              category: 'general',
              userId,
              businessId,
              businessName,
              conversationHistory,
              requestHumanAgent: true,
            }),
          });

          if (!res.ok) throw new Error('Failed to send message');

          const data = await res.json();

          const supportMsg: SupportMessage = {
            id: data.id || `support-${Date.now()}`,
            sender: 'support',
            text: data.reply || "Thanks for reaching out! Our support team has been notified and will get back to you shortly.",
            createdAt: new Date().toISOString(),
            status: 'read',
          };

          setMessages((prev) => [...prev, supportMsg]);
      } catch (err) {
        const fallback: SupportMessage = {
          id: `support-${Date.now()}`,
          sender: 'support',
          text: "Thanks for reaching out! Our support team has been notified and will get back to you shortly.",
          createdAt: new Date().toISOString(),
          status: 'read',
        };
        setMessages((prev) => [...prev, fallback]);
      } finally {
        setIsSending(false);
        setIsTyping(false);
      }
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    setInput(action.message);
    setIsChatOpen(true);
    setActiveTab('home');
  };

  const openChat = () => {
    setIsChatOpen(true);
    
    // Add welcome message if first time
    if (messages.length === 0) {
      const welcomeMsg: SupportMessage = {
        id: 'welcome',
        sender: 'support',
        text: `Hi ${userName}! Welcome to Busmo Support. We're here to help you grow your business. You can ask us about sales, inventory, expenses, AI, reports, payments, or account issues. Most replies take just a few minutes!`,
        createdAt: new Date().toISOString(),
        status: 'read',
      };
      setMessages([welcomeMsg]);
    }
  };

  const closeWidget = () => {
    setIsOpen(false);
    setIsChatOpen(false);
    setActiveTab('home');
    setMessages([]);
  };

  // ─── Help Center Functions ────────────────────────────────────
  const filteredArticles = HELP_ARTICLES.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(helpSearch.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(helpSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(HELP_ARTICLES.map(a => a.category)))];

  // ─── Online Status Check ───────────────────────────────────────
  useEffect(() => {
    const checkOnline = () => setIsOnline(navigator.onLine);
    checkOnline();
    window.addEventListener('online', checkOnline);
    window.addEventListener('offline', checkOnline);
    return () => {
      window.removeEventListener('online', checkOnline);
      window.removeEventListener('offline', checkOnline);
    };
  }, []);

  // Check admin agent status from Firestore
  useEffect(() => {
    const { firestore } = initializeFirebase();
    if (!firestore) return;

    const agentStatusRef = doc(firestore, 'agentStatus', 'admin');
    const unsubscribe = onSnapshot(agentStatusRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const adminOnline = data.isOnline !== false;
        setIsOnline(adminOnline && navigator.onLine);
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time listener for admin replies on current conversation
  useEffect(() => {
    if (!currentConversationId) return;
    const { firestore } = initializeFirebase();
    if (!firestore) return;

    const unsub = onSnapshot(doc(firestore, 'supportMessages', currentConversationId), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const firestoreReplies = data.replies || [];

      setMessages((prev) => {
        const localAdminReplies = prev.filter(
          (m) => m.sender === 'support' && m.id !== 'welcome'
        );
        const firestoreAsSupport = firestoreReplies
          .filter((r: any) => r.sender === 'admin')
          .map((r: any, i: number) => ({
            id: `admin-reply-${i}`,
            sender: 'support' as const,
            text: r.message,
            createdAt: r.createdAt,
            status: 'read' as const,
          }));

        const welcomeAndUser = prev.filter(
          (m) => m.id === 'welcome' || m.sender === 'user'
        );
        return [...welcomeAndUser, ...firestoreAsSupport];
      });
    });

    return () => unsub();
  }, [currentConversationId]);

  // ─── Render Helpers ───────────────────────────────────────────
  const renderOnlineStatus = () => {
    if (!isOnline) {
      return <span className="flex items-center gap-1 text-xs text-gray-500"><WifiOff size={12} /> Offline</span>;
    }
    return (
      <span className="flex items-center gap-1 text-xs text-green-600">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        {isBotMode ? 'AI Online' : 'Agent Online'}
      </span>
    );
  };

  // ─── Main Render ────────────────────────────────────────────────
  return (
    <>
      {!isOpen ? (
        // ─── Floating Button ──────────────────────────────────────
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group"
          aria-label="Open support"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-purple-600 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
            <div className="relative bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110">
              <MoIcon size={12} />
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>
        </button>
      ) : (
        // ─── Main Widget ──────────────────────────────────────────────
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] animate-[fadeIn_0.2s_ease-out]"
            onClick={closeWidget}
          ></div>
          {/* Widget Container */}
          <div 
            className="fixed bottom-6 right-6 z-[101] bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 animate-[slideUp_0.3s_ease-out]"
            style={{ 
              width: isMobile ? 'calc(100% - 24px)' : '420px',
              height: isMobile ? 'calc(100vh - 84px)' : '600px',
              maxHeight: isMobile ? 'none' : '600px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
          {/* ─── Header ─────────────────────────────────────────── */}
          <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 text-white p-6 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
            
            <div className="relative flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
<img 
  src="/email-logo.png" 
  alt="Busmo" 
  className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm p-1.5"
/>
                  {isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-purple-700 rounded-full" />
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-lg leading-tight">Hi {userName}! 👋</h2>
                  <p className="text-sm text-white/80">How can we help today?</p>
                </div>
              </div>
              
              <button 
                onClick={closeWidget}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Team avatars */}
            <div className="relative flex items-center gap-2 mt-4">
              <div className="flex -space-x-2">
                {TEAM_MEMBERS.filter(m => m.online).map((member, idx) => (
                  <div 
                    key={idx} 
                    className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white flex items-center justify-center text-sm"
                    title={`${member.name} - ${member.role}`}
                  >
                    <User size={14} />
                  </div>
                ))}
              </div>
              <span className="text-xs text-white/70 ml-2">
                {TEAM_MEMBERS.filter(m => m.online).length} team members online
              </span>
            </div>
          </div>

          {/* ─── Bottom Navigation ──────────────────────────────── */}
          <div className="flex border-b border-gray-200 bg-white">
            <button
              onClick={() => {
                setActiveTab('home');
                setIsChatOpen(false);
              }}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
                activeTab === 'home' && !isChatOpen
                  ? 'text-purple-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageSquare size={18} className="mx-auto mb-1" />
              Home
              {activeTab === 'home' && !isChatOpen && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('messages');
                setIsChatOpen(false);
              }}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
                activeTab === 'messages' && !isChatOpen
                  ? 'text-purple-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageCircle size={18} className="mx-auto mb-1" />
              Messages
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
              {activeTab === 'messages' && !isChatOpen && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('help');
                setIsChatOpen(false);
              }}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
                activeTab === 'help' && !isChatOpen
                  ? 'text-purple-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <HelpCircle size={18} className="mx-auto mb-1" />
              Help
              {activeTab === 'help' && !isChatOpen && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
              )}
            </button>
          </div>

          {/* ─── Content Area ───────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto bg-gray-50" style={{ height: isMobile ? 'calc(100% - 200px)' : '440px' }}>
            
            {/* ─── Home Tab ──────────────────────────────────────── */}
            {activeTab === 'home' && !isChatOpen && (
              <div className="p-4 space-y-4">
                {/* Primary CTA */}
                <button
                  onClick={openChat}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        💬
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-base">Send us a message</div>
                        <div className="text-sm text-white/80">We typically reply in a few minutes</div>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-white/60 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* Status indicator */}
                <div className="flex items-center justify-center gap-2 pt-2 pb-4">
                  {renderOnlineStatus()}
                </div>
              </div>
            )}

            {/* ─── Messages Tab ─────────────────────────────────── */}
            {activeTab === 'messages' && !isChatOpen && (
              <div className="p-4">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-4xl mb-4">
                      💬
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">No conversations yet</h3>
                    <p className="text-sm text-gray-500 mb-6 max-w-[260px]">
                      Need help? Start a conversation with our team and we'll get back to you as soon as possible.
                    </p>
                    <button
                      onClick={openChat}
                      className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                    >
                      Start a Conversation
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className="p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              conv.status === 'open' ? 'bg-green-500' :
                              conv.status === 'waiting' ? 'bg-amber-500' :
                              conv.status === 'assigned' ? 'bg-blue-500' :
                              'bg-gray-400'
                            }`} />
                            <span className="text-xs font-medium text-gray-600 capitalize">{conv.status}</span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(conv.lastMessageAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {conv.messages[conv.messages.length - 1]?.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── Help Tab ─────────────────────────────────────── */}
            {activeTab === 'help' && !isChatOpen && (
              <div className="p-4 space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for help..."
                    value={helpSearch}
                    onChange={(e) => setHelpSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        selectedCategory === cat
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-500'
                      }`}
                    >
                      {cat === 'all' ? 'All' : cat}
                    </button>
                  ))}
                </div>

                {/* Articles */}
                <div className="space-y-2">
                  {filteredArticles.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-3">🔍</div>
                      <p className="text-sm text-gray-500">No help articles found</p>
                    </div>
                  ) : (
                    filteredArticles.map((article) => (
                      <button
                        key={article.id}
                        onClick={() => setSelectedArticle(article)}
                        className="w-full flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition-all text-left group"
                      >
                        <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 flex-shrink-0 group-hover:scale-110 transition-transform">
                          📄
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900">{article.title}</div>
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">{article.excerpt}</div>
                          <span className="inline-block mt-2 text-[10px] font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                            {article.category}
                          </span>
                        </div>
                        <ChevronRight size={16} className="text-gray-400 flex-shrink-0 mt-1" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ─── Article View ─────────────────────────────────── */}
            {selectedArticle && (
              <div className="h-full flex flex-col bg-white">
                <div className="flex items-center gap-2 p-4 border-b border-gray-200">
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight size={20} className="rotate-180" />
                  </button>
                  <h3 className="font-semibold text-sm flex-1">{selectedArticle.title}</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-600 leading-relaxed">{selectedArticle.content}</p>
                    <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-100">
                      <p className="text-sm text-purple-900">
                        <strong>Need more help?</strong> Start a conversation with our support team.
                      </p>
                      <button
                        onClick={openChat}
                        className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                      >
                        Contact Support
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Chat View ────────────────────────────────────── */}
            {isChatOpen && (
              <div className="flex flex-col h-full bg-white">
                {/* Chat Header */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-white">
                  <button
                    onClick={() => {
                      setIsChatOpen(false);
                      setActiveTab('home');
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight size={20} className="rotate-180" />
                  </button>
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center text-white text-lg">
                    {isBotMode ? '🤖' : '👤'}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-gray-900">
                      {isBotMode ? 'MO AI Assistant' : 'Human Support Agent'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {renderOnlineStatus()}
                    </div>
                  </div>
                  {isBotMode && (
                    <button
                      onClick={handleRequestHumanAgent}
                      className="px-3 py-1.5 text-xs font-medium text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                    >
                      👤 Human
                    </button>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                          msg.sender === 'user'
                            ? 'bg-purple-600 text-white rounded-br-md'
                            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        <div className={`flex items-center gap-1 mt-1 ${
                          msg.sender === 'user' ? 'justify-end' : 'justify-start'
                        }`}>
                          <span className={`text-[10px] ${
                            msg.sender === 'user' ? 'text-white/70' : 'text-gray-400'
                          }`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.sender === 'user' && msg.status && (
                            <span className="text-white/70">
                              {msg.status === 'read' ? <CheckCheck size={12} /> : <Check size={12} />}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-gray-200 bg-white">
                  {/* Quick action chips */}
                  {messages.length <= 1 && (
                    <div className="flex gap-2 overflow-x-auto mb-3 scrollbar-hide pb-1">
                      {QUICK_ACTIONS.slice(0, 6).map((action) => (
                        <button
                          key={action.id}
                          onClick={() => handleQuickAction(action)}
                          className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium whitespace-nowrap hover:bg-purple-100 transition-colors"
                        >
                          {action.icon} {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                    className="flex items-end gap-2"
                  >
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Attach file"
                      >
                        <Paperclip size={18} />
                      </button>
                      <button
                        type="button"
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Voice message"
                      >
                        <Mic size={18} />
                      </button>
                    </div>
                    <input
                      ref={chatInputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={isBotMode ? "Type your message..." : "Message agent..."}
                      disabled={isSending}
                      className="flex-1 px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-sm transition-all"
                    />
                    <button
                      type="submit"
                      disabled={isSending || !input.trim()}
                      className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
        </>
      )}
    </>
  );
}
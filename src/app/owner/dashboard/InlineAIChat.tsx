'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useTranslation } from './LangContext';
import { MoIcon } from './NavIcons';
import { initializeFirebase } from '@/firebase';
import { useBranch } from '@/context/BranchContext';
import { getFirestore, collection, query, where, getDocs, Timestamp, doc, getDoc, setDoc, addDoc, deleteDoc, updateDoc, orderBy, limit } from 'firebase/firestore';
import styles from './InlineAIChat.module.css';
import { useAskMO } from './useAskMO';

import { Lightbulb, BarChart, DollarSign, Package, Heart, Cpu, Settings, Plus, Trash2, Pencil } from 'lucide-react';
import { CreditPurchaseModal } from '@/components/CreditPurchaseModal';
import { SaleConfirmationCard } from '@/components/SaleConfirmationCard';
import { ActionConfirmationModal } from '@/components/ActionConfirmationModal';

// Dynamic suggestions based on business data
const BASE_SUGGESTIONS = [
  { label: "Analyze my sales", icon: <BarChart size={20} /> },
  { label: "Cash flow summary", icon: <DollarSign size={20} /> },
  { label: "Inventory insights", icon: <Package size={20} /> },
  { label: "Business health check", icon: <Heart size={20} /> },
];

// Plan-based limitations
const PLAN_LIMITS = {
  starter: { messagesPerDay: 10, features: ['basic_insights', 'sales_summary'] },
  standard: { messagesPerDay: 50, features: ['basic_insights', 'sales_summary', 'forecasts', 'inventory_tips'] },
  pro: { messagesPerDay: -1, features: ['basic_insights', 'sales_summary', 'forecasts', 'inventory_tips', 'premium_consulting', 'custom_reports'] },
};

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
  saleCard?: {
    items: Array<{ name: string; quantity: number; price: number; costPrice?: number }>;
    totalRevenue: number;
    totalProfit?: number;
    timestamp: Date;
  };
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

interface InlineAIChatProps {
  onClose?: () => void;
}

export function InlineAIChat({ onClose }: InlineAIChatProps) {
  const { user, showToast, theme } = useApp();
  const { formatMoney } = useCurrency();
  const { t, lang, langMeta } = useTranslation();
  const { selectedBranchId, selectedBranchScope, branches } = useBranch();

  // Use shared hook for data management
   const {
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
     saveMessages,
     loadConversation,
     deleteConversation,
     renameConversation,
     updateCredits,
   } = useAskMO({
     userId: user.id,
     userPlan: user.plan,
     businessId: user.businessId,
     branchId: selectedBranchId || undefined,
     branchName: branches.find(b => b.id === selectedBranchId)?.name || undefined,
   });

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [dynamicSuggestions, setDynamicSuggestions] = useState(BASE_SUGGESTIONS);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showCreditPurchase, setShowCreditPurchase] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingStage, setLoadingStage] = useState<number>(0);
  const [showActionConfirmation, setShowActionConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [pendingProductDetails, setPendingProductDetails] = useState<any>(null);
  const [loadingActions, setLoadingActions] = useState<string[]>([]);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Auto-scroll to bottom when messages change or typing state changes
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping, isStreaming]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setInput('');
    setSelectedImage(null);
    setImagePreview(null);
    setAudioBlob(null);
    setAudioUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setCurrentConversationId(null);
    setShowHistory(false);
  }, [setCurrentConversationId]);

  const handleActionConfirm = async () => {
    setShowActionConfirmation(false);
    
    if (!pendingAction) return;

    try {
      const executeResponse = await fetch('/api/ask-mo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: pendingAction,
          businessId: user.businessId || user.id,
          userId: user.id,
        }),
      });

      const executeResult = await executeResponse.json();
      if (executeResult.success) {
        // If this was a sale recording, attach the sale card data with real product info
        if (pendingAction.action === 'record_sale' && executeResult.data?.product) {
          const product = executeResult.data.product;
          const saleCardData = {
            items: [{
              name: product.name,
              quantity: pendingAction.data.quantity,
              price: product.sellingPrice,
              costPrice: product.costPrice,
            }],
            totalRevenue: product.sellingPrice * (pendingAction.data.quantity || 1),
            totalProfit: executeResult.data?.profit,
            timestamp: new Date(),
          };
          
          // Update the last bot message to include the sale card
          setMessages(prev => {
            const updated = [...prev];
            const lastBotMsg = updated.find(m => m.role === 'bot');
            if (lastBotMsg) {
              lastBotMsg.saleCard = saleCardData;
              
              // Add intelligent follow-up insights
              const remainingStock = executeResult.data.product.remainingStock || 0;
              const insights = [];
              
              if (remainingStock <= 5) {
                insights.push(`⚠️ Only ${remainingStock} units remaining - consider restocking soon`);
              } else if (remainingStock <= 10) {
                insights.push(`📦 ${remainingStock} units left in stock`);
              }
              
              if (executeResult.data.profit > 0) {
                insights.push(`💰 Profit: ₦${executeResult.data.profit.toLocaleString()}`);
              }
              
              if (insights.length > 0) {
                lastBotMsg.content += '\n\n' + insights.join('\n');
              }
            }
            return updated;
          });
        }
        
        showToast(executeResult.message);
      } else {
        showToast(`Failed: ${executeResult.message}`);
      }
      
      // Save conversation after action execution
      if (currentConversationId) {
        await saveConversation();
      }
    } catch (error) {
      console.error('Error executing action:', error);
      showToast('Failed to execute action');
      
      // Save conversation even on error
      if (currentConversationId) {
        await saveConversation();
      }
    } finally {
      setPendingAction(null);
      setPendingProductDetails(null);
    }
  };

  const handleActionCancel = async () => {
    setShowActionConfirmation(false);
    setPendingAction(null);
    setPendingProductDetails(null);
    showToast('Action cancelled');
    
    // Save conversation after cancellation
    if (currentConversationId) {
      await saveConversation();
    }
  };

  const handlePurchaseSuccess = () => {
    // Refresh credits after successful purchase
    window.location.reload();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error('Error starting recording:', error);
      showToast('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
  };

  const transcribeAudio = async (blob: Blob): Promise<string> => {
    try {
      const { transcribeAudio: transcribe } = await import('@/services/ai/speech-to-text-service');
      const transcription = await transcribe(blob, lang);
      return transcription;
    } catch (error) {
      console.error('Transcription error:', error);
      return '🎤 Voice message (transcription failed)';
    }
  };

  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg && !selectedImage && !audioBlob) return;

    // Check credits: -1 means unlimited (pro plan), 0 or negative means no credits
    if (creditsRemaining !== -1 && creditsRemaining <= 0) {
      showToast('You have run out of MO Credits. Please purchase more credits to continue.');
      return;
    }

    let finalMessage = msg;
    let finalImageUrl = imagePreview || undefined;
    let finalAudioUrl = audioUrl || undefined;

    // Handle audio transcription
    if (audioBlob && !msg) {
      setIsTranscribing(true);
      try {
        const transcription = await transcribeAudio(audioBlob);
        finalMessage = transcription;
        setInput(transcription);
      } catch (error) {
        finalMessage = '🎤 Voice message (transcription failed)';
      } finally {
        setIsTranscribing(false);
      }
    }

    // Add user message
    const userMsg: MOMessage = {
      id: (Date.now()).toString(),
      role: 'user',
      content: finalMessage,
      timestamp: new Date(),
      imageUrl: finalImageUrl,
      audioUrl: finalAudioUrl,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSelectedImage(null);
    setImagePreview(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsTyping(true);
    setIsStreaming(true);
    setStreamedContent('');
    setLoadingStage(1);
    setLoadingActions([]);

    // Stage 1: Understanding Request
    await new Promise(resolve => setTimeout(resolve, 800));
    setLoadingStage(2);

    // Stage 2: MO Thinking (dynamic rotation)
    const thinkingMessages = [
      'Reviewing sales data',
      'Checking cashflow',
      'Looking at expenses',
      'Comparing performance',
      'Identifying opportunities',
      'Analyzing inventory',
      'Calculating profitability',
      'Reviewing branch performance',
    ];
    
    for (let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    
    setLoadingStage(3);

    // Stage 3: MO Actions (progressive display)
    const actions = [
      'Retrieved sales records',
      'Analyzed expenses',
      'Calculated profitability',
      'Checked inventory',
      'Reviewed branch performance',
    ];
    
    for (const action of actions) {
      await new Promise(resolve => setTimeout(resolve, 400));
      setLoadingActions(prev => [...prev, action]);
    }
    
    setLoadingStage(4);

    try {
      console.log('💬 Sending message to Ask MO API');
      const { firestore } = initializeFirebase();

      // Save user message to Firestore
      console.log('💾 Saving user message to Firestore...');
      const messageData: any = {
        role: userMsg.role,
        content: userMsg.content,
        timestamp: Timestamp.now(),
      };
      if (userMsg.imageUrl) {
        messageData.imageUrl = userMsg.imageUrl;
      }
      if (userMsg.audioUrl) {
        messageData.audioUrl = userMsg.audioUrl;
      }
      await setDoc(doc(firestore, 'users', user.id, 'mo_messages', userMsg.id), messageData);
      console.log('✅ User message saved successfully');

      // Call AI API
      console.log('📡 Calling Ask MO API...');
      
      // Get business category
      let businessCategory = 'retail';
      if (user.businessId) {
        try {
          const { firestore } = initializeFirebase();
          const businessDoc = await getDoc(doc(firestore, 'businesses', user.businessId));
          if (businessDoc.exists()) {
            const data = businessDoc.data();
            businessCategory = data?.category || data?.businessCategory || 'retail';
          }
        } catch (error) {
          console.error('Error fetching business category:', error);
        }
      }
      
      const response = await fetch('/api/ask-mo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: finalMessage,
          image: finalImageUrl,
          businessId: user.businessId || user.id,
          userId: user.id,
          conversationHistory: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          userPlan: user.plan || 'starter',
          language: lang,
          languageName: langMeta.name,
          businessCategory: businessCategory,
        }),
      });

      console.log('📡 API Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error Response:', errorData);
        throw new Error(errorData.error || `API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📡 API Response data:', data);

      const botMsg: MOMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: data.answer || "I'm analysing your business data...",
        timestamp: new Date(),
        metrics: data.metrics,
        quickActions: data.quickActions,
        followUpSuggestions: data.followUpSuggestions,
        expandableSections: data.expandableSections,
        alerts: data.alerts,
      };

      // Handle action data if present
      if (data.action) {
        console.log('🎯 Action detected:', data.action);
        const action = data.action;
        
        // For record_sale, fetch product details first
        if (action.action === 'record_sale') {
          try {
            const { firestore } = initializeFirebase();
            const productQuery = await query(
              collection(firestore, 'businesses', user.businessId || user.id, 'products'),
              where('name', '==', action.data.productName),
              where('active', '==', true),
              limit(1)
            );
            const productSnapshot = await getDocs(productQuery);
            
            if (!productSnapshot.empty) {
              const productDoc = productSnapshot.docs[0];
              const productData = productDoc.data();
              setPendingProductDetails({
                name: productData.name,
                sellingPrice: productData.price || 0,
                costPrice: productData.cost || productData.costPrice || 0,
                currentStock: productData.stock || 0,
              });
            }
          } catch (error) {
            console.error('Error fetching product details:', error);
          }
        }

        // Show custom confirmation modal instead of browser confirm
        setPendingAction(action);
        setShowActionConfirmation(true);
      }

      setMessages(prev => [...prev, botMsg]);

      console.log('💾 Saving bot response to Firestore...');
      // Save bot response to Firestore
      const botMessageData: any = {
        role: botMsg.role,
        content: botMsg.content,
        timestamp: Timestamp.now(),
      };
      if (botMsg.metrics) {
        botMessageData.metrics = botMsg.metrics;
      }
      if (botMsg.quickActions) {
        botMessageData.quickActions = botMsg.quickActions;
      }
      if (botMsg.followUpSuggestions) {
        botMessageData.followUpSuggestions = botMsg.followUpSuggestions;
      }
      if (botMsg.expandableSections) {
        botMessageData.expandableSections = botMsg.expandableSections;
      }
      if (botMsg.alerts) {
        botMessageData.alerts = botMsg.alerts;
      }
      await setDoc(doc(firestore, 'users', user.id, 'mo_messages', botMsg.id), botMessageData);
      console.log('✅ Bot response saved successfully');

      // Calculate and consume credits based on response length (simulating token usage)
      // Reduced to make 2500 credits last a week with 10 messages daily (~35 credits per message average)
      const estimatedTokens = Math.ceil((botMsg.content.length / 4) * 0.7);
      const creditsConsumed = Math.max(5, Math.min(100, estimatedTokens));
      await updateCredits(creditsConsumed);

      // Auto-save conversation
      await saveConversation();
    } catch (error) {
      console.error('❌ [InlineAIChat] MO API error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
        code: (error as any).code,
        details: (error as any).details,
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (error.message.includes('fetch') || error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('Firebase') || error.message.includes('functions')) {
          // Firebase function error
          errorMessage = 'Service temporarily unavailable. Please try again in a moment.';
          console.error('❌ [InlineAIChat] Firebase function error:', {
            code: (error as any).code,
            details: (error as any).details,
          });
        } else if (error.message.includes('Google') || error.message.includes('genai') || error.message.includes('API')) {
          // Filter out Google Gen AI specific errors
          errorMessage = 'I apologize, but I encountered an issue processing your request. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      const botMsg: MOMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: `I'm having trouble connecting right now. ${errorMessage}. Please try again in a moment.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
      showToast(`Error: ${errorMessage}`);
    } finally {
      setIsTyping(false);
      setIsStreaming(false);
      setStreamedContent('');
      setLoadingStage(0);
      setLoadingActions([]);
      setIsSending(false);
    }
  }, [input, selectedImage, imagePreview, audioBlob, audioUrl, messages, user, planLimit, creditsUsed, showToast, lang, langMeta, saveConversation, isSending]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
  }

  function formatContent(content: string) {
    // Split by newlines first
    const lines = content.split('\n');
    
    return lines.map((line, lineIndex) => {
      // Process each line for markdown-like formatting
      const parts = line.split(/\*\*([^*]+)\*\*/g);
      
      const formattedLine = parts.map((part, partIndex) => {
        if (partIndex % 2 === 1) {
          // Bold text
          return <strong key={partIndex} style={{ fontWeight: 600, color: 'var(--text-1)' }}>{part}</strong>;
        }
        // Regular text - handle other formatting
        return part;
      });
      
      return (
        <React.Fragment key={lineIndex}>
          <span style={{ lineHeight: '1.6', display: 'block', marginBottom: lineIndex < lines.length - 1 ? '0.5rem' : '0' }}>
            {formattedLine}
          </span>
        </React.Fragment>
      );
    });
  }

  function formatRecordingTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function handleHistory() {
    setShowHistory(!showHistory);
  }

  const filteredConversations = conversations.filter(conv => 
    conv.title.toLowerCase().includes(historySearchQuery.toLowerCase())
  );

  return (
    <div className={styles.container} data-theme={theme}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.moAvatar}>
            <MoIcon size={24} />
          </div>
          <div className={styles.headerInfo}>
            <h3 className={styles.headerTitle}>Ask MO</h3>
            <div 
              className={styles.tokenCounter}
              onClick={() => setShowCreditPurchase(true)}
              style={{ cursor: creditsRemaining !== -1 ? 'pointer' : 'default' }}
              title={creditsRemaining !== -1 ? 'Click to purchase more credits' : 'Unlimited credits'}
            >
              <img
                src="https://res.cloudinary.com/dzjoqbg2u/image/upload/q_auto/f_auto/v1781081246/Untitled_design_1_aphwas.png"
                alt="Token"
                width={14}
                height={14}
                style={{ borderRadius: '50%' }}
              />
              <span>{creditsRemaining === -1 ? 'Unlimited' : creditsRemaining.toLocaleString()} Credits</span>
              {creditsRemaining !== -1 && (
                <span style={{ marginLeft: '4px', fontSize: '12px', color: 'var(--primary)' }}>+</span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className={styles.newChatBtn} onClick={handleNewChat} title="New chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
          <button className={styles.historyBtn} onClick={handleHistory} title="Chat history">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </button>
          {onClose && (
            <button className={styles.closeBtn} onClick={onClose}>
              ✕
            </button>
          )}
        </div>
      </div>

      <CreditPurchaseModal 
        isOpen={showCreditPurchase}
        onClose={() => setShowCreditPurchase(false)}
        onSuccess={handlePurchaseSuccess}
      />

      <ActionConfirmationModal
        isOpen={showActionConfirmation}
        onClose={handleActionCancel}
        onConfirm={handleActionConfirm}
        actionType={pendingAction?.action === 'record_sale' ? 'record_sale' : pendingAction?.action === 'add_product' ? 'add_product' : 'other'}
        actionData={pendingAction?.data || {}}
        productDetails={pendingProductDetails}
      />

      {/* Messages */}
      <div className={styles.messages} ref={messagesContainerRef}>
        {messages.length === 0 && (
          <div className={styles.emptyChat}>
            <div className={styles.emptyChatContent}>
              <div className={styles.moAvatarLg}>
                <MoIcon size={32} />
              </div>
              <h3>Hi, I'm Mo</h3>
              <p>Your AI business assistant. I can help you understand your sales, cash flow, inventory, customer trends, and overall business performance. What would you like to explore today?</p>
            </div>
          </div>
        )}

        {messages.filter(m => m.content || m.saleCard || m.imageUrl || m.audioUrl).map(m => (
          <div
            key={m.id}
            className={`${styles.message} ${m.role === 'user' ? styles.user : styles.bot}`}
          >
            {m.role === 'bot' && (
              <div className={styles.botHeader}>
                <div className={styles.moAvatarSm}>
                  <MoIcon size={16} />
                </div>
                <span className={styles.botStatus}>
                  {isTyping ? (
                    <div className={styles.typingIndicator}>
                      <span className={styles.typingDot}></span>
                      <span className={styles.typingDot}></span>
                      <span className={styles.typingDot}></span>
                    </div>
                  ) : 'MO'}
                </span>
              </div>
            )}
            <div className={`${styles.bubble} ${m.role === 'user' ? styles.userBubble : styles.botBubble}`}>
              {m.imageUrl && (
                <img
                  src={m.imageUrl}
                  alt="Uploaded"
                  style={{
                    maxWidth: '200px',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    display: 'block',
                  }}
                />
              )}
              {m.audioUrl && (
                <audio
                  src={m.audioUrl}
                  controls
                  style={{
                    width: '100%',
                    maxWidth: '250px',
                    marginBottom: '8px',
                    display: 'block',
                  }}
                />
              )}
              {m.saleCard && (
                <div className="my-3">
                  <SaleConfirmationCard
                    items={m.saleCard.items}
                    totalRevenue={m.saleCard.totalRevenue}
                    totalProfit={m.saleCard.totalProfit}
                    timestamp={m.saleCard.timestamp}
                  />
                </div>
              )}
              {formatContent(m.content)}
              {m.role === 'bot' && m.metrics && m.metrics.length > 0 && (
                <div className={styles.metrics}>
                  {m.metrics.map((metric, idx) => (
                    <div key={idx} className={styles.metric}>
                      <span className={styles.metricLabel}>{metric.label}</span>
                      <span className={styles.metricValue}>{metric.value}</span>
                      {metric.trend && (
                        <span className={`${styles.metricTrend} ${metric.trend.startsWith('+') ? styles.trendUp : styles.trendDown}`}>
                          {metric.trend}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {m.role === 'bot' && m.quickActions && m.quickActions.length > 0 && (
                <div className={styles.quickActions}>
                  {m.quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      className={styles.quickAction}
                      onClick={() => send(action.action)}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
              {m.role === 'bot' && m.followUpSuggestions && m.followUpSuggestions.length > 0 && (
                <div className={styles.followUpSuggestions}>
                  <span className={styles.followUpLabel}>Explore:</span>
                  {m.followUpSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      className={styles.followUpSuggestion}
                      onClick={() => send(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              {m.role === 'bot' && m.expandableSections && m.expandableSections.length > 0 && (
                <div className={styles.expandableSections}>
                  {m.expandableSections.map((section, idx) => {
                    const isExpanded = expandedSections.has(section.id);
                    return (
                      <div key={idx} className={styles.expandableSection}>
                        <button
                          className={styles.expandableHeader}
                          onClick={() => {
                            setExpandedSections(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(section.id)) {
                                newSet.delete(section.id);
                              } else {
                                newSet.add(section.id);
                              }
                              return newSet;
                            });
                          }}
                        >
                          <span className={styles.expandableTitle}>{section.title}</span>
                          <span className={`${styles.expandableIcon} ${isExpanded ? styles.expanded : ''}`}>
                            ▼
                          </span>
                        </button>
                        {isExpanded && (
                          <div className={styles.expandableContent}>
                            {formatContent(section.content)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {m.role === 'bot' && m.alerts && m.alerts.length > 0 && (
                <div className={styles.alerts}>
                  {m.alerts.map((alert, idx) => (
                    <div key={idx} className={`${styles.alert} ${styles[alert.type]}`}>
                      <span className={styles.alertIcon}>
                        {alert.type === 'warning' ? '⚠️' : alert.type === 'success' ? '✅' : 'ℹ️'}
                      </span>
                      <span className={styles.alertMessage}>{alert.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className={`${styles.message} ${styles.bot}`}>
            <div className={styles.moAvatarSm}>
              <MoIcon size={16} />
            </div>
            <div className={`${styles.bubble} ${styles.botBubble}`}>
              {loadingStage === 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu size={20} className={styles.loadingIcon} />
                  <span>Understanding request...</span>
                </div>
              )}
              {loadingStage === 2 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lightbulb size={20} className={styles.loadingIcon} />
                  <span>Reviewing business data...</span>
                </div>
              )}
              {loadingStage === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Settings size={20} className={styles.loadingIcon} />
                    <span>Processing...</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-2)', flexWrap: 'wrap' }}>
                    {loadingActions.map((action, idx) => (
                      <span key={idx}>✓ {action}</span>
                    ))}
                  </div>
                </div>
              )}
              {loadingStage === 4 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>✨</span>
                  <span>Generating insights...</span>
                </div>
              )}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Conversation History Panel */}
      {showHistory && (
        <>
          <div className={styles.historyBackdrop} onClick={() => setShowHistory(false)} />
          <div className={styles.historyPanel}>
            <div className={styles.historyHeader}>
              <h4 className={styles.historyTitle}>Conversation History</h4>
              <button
                className={styles.closeHistoryBtn}
                onClick={() => setShowHistory(false)}
              >
                ✕
              </button>
            </div>
            
            <div className={styles.historySearch}>
              <input
                type="text"
                placeholder="Search conversations..."
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                className={styles.historySearchInput}
              />
            </div>

            <div className={styles.historyList}>
              {filteredConversations.length === 0 ? (
                <div className={styles.historyEmpty}>
                  <p>No conversations found</p>
                </div>
              ) : (
                filteredConversations.map(conv => (
                  <div
                    key={conv.id}
                    className={`${styles.historyItem} ${currentConversationId === conv.id ? styles.historyItemActive : ''}`}
                    onClick={() => loadConversation(conv.id)}
                  >
                    <div className={styles.historyItemHeader}>
                      <span className={styles.historyItemTitle}>{conv.title}</span>
                      <div className={styles.historyItemActions}>
                        <button
                          className={styles.historyItemAction}
                          onClick={(e) => {
                            e.stopPropagation();
                            const newTitle = prompt('Rename conversation:', conv.title);
                            if (newTitle) renameConversation(conv.id, newTitle);
                          }}
                          title="Rename"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className={styles.historyItemAction}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete this conversation?')) {
                              deleteConversation(conv.id);
                            }
                          }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className={styles.historyItemMeta}>
                      <span>{conv.branchName || 'Main Branch'}</span>
                      <span>•</span>
                      <span>{(conv.messages?.length || conv.messageCount || 0)} messages</span>
                      <span>•</span>
                      <span>{conv.updatedAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Input */}
      <div className={styles.inputArea}>
        {imagePreview && (
          <div className={styles.imagePreview}>
            <img src={imagePreview} alt="Preview" />
            <button
              className={styles.removeImage}
              onClick={() => {
                setSelectedImage(null);
                setImagePreview(null);
              }}
            >
              ✕
            </button>
          </div>
        )}
        {audioUrl && (
          <div className={styles.audioPreview}>
            <audio src={audioUrl} controls />
            <button
              className={styles.removeAudio}
              onClick={() => {
                setAudioBlob(null);
                setAudioUrl(null);
                setRecordingTime(0);
              }}
            >
              ✕
            </button>
          </div>
        )}
        <div className={styles.inputWrapper}>
          <button
            className={styles.attachBtn}
            onClick={() => fileInputRef.current?.click()}
            title="Upload image"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageSelect}
          />
          <button
            className={styles.micBtn}
            onClick={isRecording ? stopRecording : startRecording}
            title={isRecording ? "Stop recording" : "Record voice"}
            style={{ background: isRecording ? 'var(--red)' : 'var(--bg-2)', color: isRecording ? '#fff' : 'var(--text-2)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18 }}>
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </button>
          {isRecording && (
            <span className={styles.recordingTime}>{formatRecordingTime(recordingTime)}</span>
          )}
          <textarea
            ref={textareaRef}
            className={styles.input}
            placeholder={isRecording ? "Recording..." : "Ask MO anything about your business..."}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              if (textareaRef.current) autoResize(textareaRef.current);
            }}
            onKeyDown={handleKey}
            rows={1}
            disabled={isRecording || isTranscribing}
          />
          {isRecording && (
            <button
              className={styles.cancelRecordingBtn}
              onClick={cancelRecording}
              title="Cancel recording"
            >
              ✕
            </button>
          )}
          <button
            className={styles.sendBtn}
            onClick={() => send()}
            disabled={!input.trim() && !selectedImage && !audioBlob}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}



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
  const { user, showToast, theme, navigateTo } = useApp();
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
      createConversation,
      saveConversation,
      saveMessages,
      loadConversation,
      deleteConversation,
      renameConversation,
      updateCredits,
      resetToNewChat,
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
  const [loadingActions, setLoadingActions] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesRef = useRef<MOMessage[]>([]);
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

  // Auto-load most recent conversation on mount to persist state across refresh/navigation
  useEffect(() => {
    if (conversations.length > 0 && !currentConversationId && messages.length === 0) {
      const mostRecent = conversations[0];
      if (mostRecent.messages && mostRecent.messages.length > 0) {
        console.log('📂 [InlineAIChat] Auto-loading most recent conversation:', mostRecent.id);
        loadConversation(mostRecent.id);
      }
    }
  }, [conversations, currentConversationId, messages.length, loadConversation]);

  // Keep messagesRef in sync so save logic always uses latest state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const handleNewChat = useCallback(() => {
    resetToNewChat();
    setInput('');
    setSelectedImage(null);
    setImagePreview(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setIsTyping(false);
    setIsStreaming(false);
    setLoadingStage(0);
    setLoadingActions([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [resetToNewChat]);

  const handlePurchaseSuccess = () => {
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

    if (creditsRemaining !== -1 && creditsRemaining <= 0) {
      showToast('You have run out of MO Credits. Please purchase more credits to continue.');
      return;
    }

    let finalMessage = msg;
    let finalImageUrl = imagePreview || undefined;
    let finalAudioUrl = audioUrl || undefined;

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

    const userMsg: MOMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

    // Create conversation if this is the first message
    if (!currentConversationId) {
      console.log('📝 Creating new conversation...');
      const newConversationId = await createConversation(userMsg);
      if (newConversationId) {
        setCurrentConversationId(newConversationId);
        console.log('✅ Conversation created:', newConversationId);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 800));
    setLoadingStage(2);

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

      console.log(' Calling Ask MO API...');
      
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
          userRole: user.role,
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

      const rendered = data.rendered;
      
      const botMsg: MOMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'bot',
        content: data.answer || "I'm analysing your business data...",
        timestamp: new Date(),
        metrics: rendered?.metrics,
        quickActions: rendered?.quickActions,
        followUpSuggestions: rendered?.suggestions,
        expandableSections: data.expandableSections,
        alerts: rendered?.alerts,
      };

      // Attach structured cards from rendered response
      if (rendered?.card) {
        if (rendered.card.type === 'sale') {
          botMsg.saleCard = rendered.card;
        } else if (rendered.card.type === 'product') {
          botMsg.productCard = rendered.card;
        } else if (rendered.card.type === 'expense') {
          botMsg.expenseCard = rendered.card;
        }
      }

      setMessages(prev => [...prev, botMsg]);

      const estimatedTokens = Math.ceil((botMsg.content.length / 4) * 0.7);
      const creditsConsumed = Math.max(5, Math.min(100, estimatedTokens));
      await updateCredits(creditsConsumed);

      if (currentConversationId) {
        await saveMessages(currentConversationId, [...messagesRef.current, userMsg, botMsg]);
      }
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
          errorMessage = 'Service temporarily unavailable. Please try again in a moment.';
        } else if (error.message.includes('Google') || error.message.includes('genai') || error.message.includes('API')) {
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
  }, [input, selectedImage, imagePreview, audioBlob, audioUrl, messages, user, planLimit, creditsUsed, showToast, lang, langMeta, saveConversation, isSending, currentConversationId]);

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
    const lines = content.split('\n');
    
    return lines.map((line, lineIndex) => {
      const parts = line.split(/\*\*([^*]+)\*\*/g);
      
      const formattedLine = parts.map((part, partIndex) => {
        if (partIndex % 2 === 1) {
          return <strong key={partIndex} style={{ fontWeight: 600, color: 'var(--text-1)' }}>{part}</strong>;
        }
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
        {onClose && (
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      <CreditPurchaseModal 
        isOpen={showCreditPurchase}
        onClose={() => setShowCreditPurchase(false)}
        onSuccess={handlePurchaseSuccess}
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
              <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-2)' }}>
                Your AI business assistant. Ask me anything about your business.
              </p>
              
              {dynamicSuggestions.length > 0 && (
                <div className={styles.quickActions}>
                  {dynamicSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className={styles.quickActionChip}
                      onClick={() => {
                        setInput(suggestion.label);
                        textareaRef.current?.focus();
                      }}
                    >
                      {suggestion.icon}
                      <span>{suggestion.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {messages.filter(m => m.content || m.saleCard || m.productCard || m.expenseCard || m.imageUrl || m.audioUrl).map(m => (
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
              {m.productCard && (
                <div className="my-3">
                  <div style={{
                    background: 'var(--primary-light)',
                    border: '1px solid var(--primary)',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '8px'
                  }}>
                    <h4 style={{ margin: '0 0 8px 0', color: 'var(--primary)' }}>✅ Product Added</h4>
                    <p style={{ margin: '4px 0' }}><strong>{m.productCard.name}</strong></p>
                    <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
                      Stock: {m.productCard.stock} units<br/>
                      Selling: ₦{m.productCard.price.toLocaleString()}<br/>
                      Cost: ₦{m.productCard.cost.toLocaleString()}
                      {m.productCard.sku && <>• SKU: {m.productCard.sku}</>}
                    </p>
                  </div>
                </div>
              )}
              {m.expenseCard && (
                <div className="my-3">
                  <div style={{
                    background: 'var(--warning-bg)',
                    border: '1px solid var(--amber)',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '8px'
                  }}>
                    <h4 style={{ margin: '0 0 8px 0', color: 'var(--warning-text)' }}>✅ Expense Recorded</h4>
                    <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
                      <strong>{m.expenseCard.category}</strong><br/>
                      Amount: ₦{m.expenseCard.amount.toLocaleString()}<br/>
                      Date: {m.expenseCard.date}
                    </p>
                  </div>
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
                        {alert.type === 'warning' ? '⚠️' : alert.type === 'success' ? '✅' : alert.type === 'error' ? '❌' : 'ℹ️'}
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
              }}
            >
              ✕
            </button>
          </div>
        )}
        <div className={styles.inputRow}>
          <button
            className={styles.attachBtn}
            onClick={() => fileInputRef.current?.click()}
            title="Attach image"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
          <button
            className={styles.micBtn}
            onClick={isRecording ? stopRecording : startRecording}
            title={isRecording ? 'Stop recording' : 'Start voice input'}
          >
            {isRecording ? (
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20 }}>
                <rect x="6" y="6" width="12" height="12" rx="2"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}>
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
          </button>
          <textarea
            ref={textareaRef}
            className={styles.textInput}
            placeholder="Ask MO anything about your business... (Shift+Enter for new line)"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoResize(e.target);
            }}
            onKeyDown={handleKey}
            rows={1}
            disabled={isTranscribing}
          />
          <button
            className={`${styles.sendBtn} ${isSending ? styles.sending : ''}`}
            onClick={() => send()}
            disabled={isSending || isTranscribing || (!input.trim() && !selectedImage && !audioBlob)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}>
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useTranslation } from './LangContext';
import { MoIcon } from './NavIcons';
import { initializeFirebase } from '@/firebase';
import { useBranch } from '@/context/BranchContext';
import { doc, getDoc } from 'firebase/firestore';
import styles from './InlineAIChat.module.css';
import { useAskMO } from './useAskMO';

import { Lightbulb, BarChart, DollarSign, Package, Heart, Cpu, Settings, Plus, Trash2, Pencil } from 'lucide-react';
import { CreditPurchaseModal } from '@/components/CreditPurchaseModal';
import { SaleConfirmationCard } from '@/components/SaleConfirmationCard';

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
      loadBusinessData,
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
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [dynamicSuggestions, setDynamicSuggestions] = useState(BASE_SUGGESTIONS);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showCreditPurchase, setShowCreditPurchase] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingText, setLoadingText] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [pendingMessageId, setPendingMessageId] = useState<string | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
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

  // Smart auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Check if user is near the bottom (within 100px)
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    // Only auto-scroll if user is already near bottom
    if (isNearBottom) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
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
    setAudioBase64(null);
    setIsTyping(false);
    setIsStreaming(false);
    setLoadingText('');
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

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Bug #2 fix: detect supported MIME type (matches MobileAskMOPage logic)
      let mimeType = 'audio/webm';
      const supportedTypes = [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/mp4',
        'audio/wav',
      ];
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunks, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        try {
          const base64 = await blobToBase64(blob);
          setAudioBase64(base64);
        } catch (err) {
          console.error('Failed to convert audio to base64:', err);
        }
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
    setAudioBase64(null);
    setRecordingTime(0);
  };

  const transcribeAudio = async (blob: Blob): Promise<string> => {
    try {
      const base64 = audioBase64 || await blobToBase64(blob);
      const detectedMimeType = blob.type || 'audio/webm';

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64: base64, mimeType: detectedMimeType, language: lang }),
      });

      if (!response.ok) {
        throw new Error(`Transcription API error: ${response.status}`);
      }

      const data = await response.json();
      return data.transcription || '🎤 Voice message (transcription failed)';
    } catch (error) {
      console.error('Transcription error:', error);
      return '🎤 Voice message (transcription failed)';
    }
  };

  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg && !selectedImage && !audioBlob) return;
    if (isSending) return;

    if (creditsRemaining !== -1 && creditsRemaining <= 0) {
      showToast('You have run out of MO Credits. Please purchase more credits to continue.');
      return;
    }

    setIsSending(true);

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
    // Reset textarea height after programmatic clear
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setSelectedImage(null);
    setImagePreview(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setAudioBase64(null);
    setRecordingTime(0);
    setIsTyping(true);
    setIsStreaming(true);
    setStreamedContent('');
    setLoadingText('Thinking');

    // Create conversation if this is the first message
    if (!currentConversationId) {
      console.log('📝 Creating new conversation...');
      const newConversationId = await createConversation(userMsg);
      if (newConversationId) {
        setCurrentConversationId(newConversationId);
        console.log('✅ Conversation created:', newConversationId);
      }
      
      // Load business data on first message for better performance
      console.log('📊 [InlineAIChat] Loading business data on first message');
      await loadBusinessData();
      
      // Wait a bit more to ensure businessSummary state is updated
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('📊 [InlineAIChat] Current businessSummary:', businessSummary);
    }

    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoadingText('Generating insights');

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
      
      const requestBody: any = {
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
        businessSummary: businessSummary,
      };
      if (audioBase64) requestBody.audio = audioBase64;
      const response = await fetch('/api/ask-mo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
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

      // If API returned a pending action (needs confirmation), set it
      if (data.pendingAction) {
        setPendingAction(data.pendingAction);
        setPendingMessageId(botMsg.id);
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
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
      setLoadingText('');
      setIsSending(false);
    }
  }, [input, selectedImage, imagePreview, audioBlob, audioUrl, audioBase64, messages, user, planLimit, creditsUsed, showToast, lang, langMeta, saveConversation, isSending, currentConversationId, creditsRemaining, businessSummary, loadBusinessData, createConversation, setCurrentConversationId, updateCredits, saveMessages]);

  // Execute pending action (sale/expense/product confirmation)
  const executePendingAction = useCallback(async () => {
    if (!pendingAction || isExecutingAction) return;
    setIsExecutingAction(true);
    try {
      const response = await fetch('/api/ask-mo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: pendingAction,
          businessId: user.businessId || user.id,
          userId: user.id,
          userRole: user.role,
        }),
      });
      const result = await response.json();
      const updatedMessages = [...messagesRef.current];

      if (result.success) {
        showToast(`Action completed: ${result.message}`);

        if (pendingAction.action === 'record_sale' && pendingMessageId) {
          const cardIndex = updatedMessages.findIndex(msg => msg.id === pendingMessageId && msg.saleCard);
          const existingCard = cardIndex !== -1 ? updatedMessages[cardIndex].saleCard : undefined;
          const fallbackItems = existingCard?.items || [{
            name: pendingAction.data.productName || 'Sale',
            quantity: pendingAction.data.quantity || 1,
            price: pendingAction.data.price || 0,
            costPrice: pendingAction.data.costPrice,
            imageUrl: undefined,
          }];
          const recordedItems = result.data?.items?.map((item: any, idx: number) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            costPrice: item.costPrice,
            imageUrl: item.imageUrl || fallbackItems[idx]?.imageUrl || undefined,
          })) || fallbackItems;
          if (cardIndex !== -1 && existingCard) {
            updatedMessages[cardIndex] = {
              ...updatedMessages[cardIndex],
              saleCard: {
                ...existingCard,
                items: recordedItems,
                totalRevenue: result.data?.totalRevenue ?? existingCard.totalRevenue ?? 0,
                totalProfit: result.data?.totalProfit ?? result.data?.profit ?? existingCard.totalProfit,
                timestamp: new Date(),
                mode: 'recorded',
              },
            };
          }
        }

        const successMsg: MOMessage = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          role: 'bot',
          content: `✅ ${result.message || 'Action completed successfully.'}`,
          timestamp: new Date(),
          ...(pendingAction.action !== 'record_sale' && {
            ...(pendingAction.action === 'add_product' && {
              productCard: {
                type: 'product',
                name: pendingAction.data.name || 'Product',
                price: pendingAction.data.price || 0,
                cost: pendingAction.data.costPrice || 0,
                stock: pendingAction.data.stock || 0,
                sku: pendingAction.data.sku,
                imageUrl: pendingAction.data.imageUrl,
                message: `✅ Product "${pendingAction.data.name}" added successfully.`,
              },
            }),
            ...(pendingAction.action === 'add_expense' && {
              expenseCard: {
                type: 'expense',
                category: pendingAction.data.category || 'General',
                amount: pendingAction.data.amount || 0,
                date: pendingAction.data.date || new Date().toISOString().split('T')[0],
                message: `✅ Expense recorded: ${pendingAction.data.category || 'General'}`,
              },
            }),
          }),
        };
        updatedMessages.push(successMsg);
      } else {
        showToast(`Failed: ${result.message}`);
        const errorMsg: MOMessage = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          role: 'bot',
          content: `❌ ${result.message || 'Action failed.'}`,
          timestamp: new Date(),
        };
        updatedMessages.push(errorMsg);
      }

      setMessages(updatedMessages);
      if (currentConversationId) {
        await saveMessages(currentConversationId, updatedMessages);
      }
    } catch (error) {
      console.error('Error executing action:', error);
      showToast('Failed to execute action');
      if (currentConversationId) {
        await saveConversation();
      }
    } finally {
      setPendingAction(null);
      setPendingMessageId(null);
      setIsExecutingAction(false);
    }
  }, [pendingAction, isExecutingAction, pendingMessageId, user, showToast, currentConversationId, saveConversation, saveMessages, setMessages]);

  const cancelPendingAction = useCallback(() => {
    const cancelMsg: MOMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'bot',
      content: 'Action cancelled.',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, cancelMsg]);
    setPendingAction(null);
    setPendingMessageId(null);
  }, [setMessages]);

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
        {/* Bug #11 fix: render New Chat and History buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className={styles.newChatBtn}
            onClick={handleNewChat}
            title="New chat"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <button
            className={`${styles.closeBtn} ${styles.historyBtn}`}
            onClick={() => setShowHistory(true)}
            title="Conversation history"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
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

      {/* Messages */}
      <div className={styles.messages} ref={messagesContainerRef}>
        {/* Bug #12 fix: show welcome screen when no active conversation, regardless of conversation history */}
        {messages.length === 0 && currentConversationId === null && (
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
                    mode={m.saleCard.mode || 'pending'}
                    onConfirm={
                      pendingAction && pendingMessageId === m.id && pendingAction.action === 'record_sale' && !isExecutingAction
                        ? executePendingAction
                        : undefined
                    }
                    onCancel={
                      pendingAction && pendingMessageId === m.id && pendingAction.action === 'record_sale' && !isExecutingAction
                        ? cancelPendingAction
                        : undefined
                    }
                    isExecuting={isExecutingAction}
                  />
                </div>
              )}
              {m.productCard && (
                <div className="my-3">
                  <div style={{
                    background: pendingAction?.action === 'add_product' ? 'rgba(245,158,11,0.1)' : 'var(--primary-light)',
                    border: `1px solid ${pendingAction?.action === 'add_product' ? 'var(--amber, #F59E0B)' : 'var(--primary)'}`,
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '8px'
                  }}>
                    <h4 style={{ margin: '0 0 8px 0', color: pendingAction?.action === 'add_product' ? 'var(--amber, #F59E0B)' : 'var(--primary)' }}>
                      {pendingAction?.action === 'add_product' ? '📦 Confirm Add Product' : '✅ Product Added'}
                    </h4>
                    <p style={{ margin: '4px 0' }}><strong>{m.productCard.name}</strong></p>
                    {m.productCard.imageUrl && (
                      <img
                        src={m.productCard.imageUrl}
                        alt={m.productCard.name}
                        style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', marginTop: '4px', display: 'block' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
                      Stock: {m.productCard.stock} units<br/>
                      Selling: ₦{m.productCard.price.toLocaleString()}<br/>
                      Cost: ₦{m.productCard.cost.toLocaleString()}
                      {m.productCard.sku && <>• SKU: {m.productCard.sku}</>}
                    </p>
                  </div>
                  {pendingAction && pendingMessageId === m.id && pendingAction.action === 'add_product' && !isExecutingAction && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button
                        onClick={executePendingAction}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: 'var(--green)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        ✓ Confirm
                      </button>
                      <button
                        onClick={cancelPendingAction}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: 'var(--bg-2)',
                          color: 'var(--text-1)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
              {m.expenseCard && (
                <div className="my-3">
                  <div style={{
                    background: pendingAction?.action === 'add_expense' ? 'rgba(245,158,11,0.1)' : 'var(--warning-bg)',
                    border: `1px solid ${pendingAction?.action === 'add_expense' ? 'var(--amber, #F59E0B)' : 'var(--amber)'}`,
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '8px'
                  }}>
                    <h4 style={{ margin: '0 0 8px 0', color: pendingAction?.action === 'add_expense' ? 'var(--amber, #F59E0B)' : 'var(--warning-text)' }}>
                      {pendingAction?.action === 'add_expense' ? '💰 Confirm Expense' : '✅ Expense Recorded'}
                    </h4>
                    <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
                      <strong>{m.expenseCard.category}</strong><br/>
                      Amount: ₦{m.expenseCard.amount.toLocaleString()}<br/>
                      Date: {m.expenseCard.date}
                    </p>
                  </div>
                  {pendingAction && pendingMessageId === m.id && pendingAction.action === 'add_expense' && !isExecutingAction && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button
                        onClick={executePendingAction}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: 'var(--green)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        ✓ Confirm
                      </button>
                      <button
                        onClick={cancelPendingAction}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: 'var(--bg-2)',
                          color: 'var(--text-1)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className={styles.loadingText}>{loadingText}</span>
              </div>
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
                setAudioBase64(null);
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
            className={`${styles.micBtn}${isRecording ? ` ${styles.recording}` : ''}`}
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
          {isRecording && (
            <span className={styles.recordingTime}>{formatRecordingTime(recordingTime)}</span>
          )}
          {isRecording && (
            <button
              className={styles.cancelRecordingBtn}
              onClick={cancelRecording}
              title="Cancel recording"
            >
              ✕
            </button>
          )}
          <textarea
            ref={textareaRef}
            className={styles.textInput}
            placeholder="Ask MO..."
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
      {showHistory && (
        <>
          <div className={styles.historyBackdrop} onClick={() => setShowHistory(false)} />
          <div className={styles.historyPanel}>
            <div className={styles.historyHeader}>
              <h3 className={styles.historyTitle}>Conversation History</h3>
              <button className={styles.closeHistoryBtn} onClick={() => setShowHistory(false)}>✕</button>
            </div>
            <div className={styles.historySearch}>
              <input
                className={styles.historySearchInput}
                placeholder="Search conversations..."
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
              />
            </div>
            <div className={styles.historyList}>
              {filteredConversations.length === 0 && (
                <div className={styles.historyEmpty}>No conversations yet</div>
              )}
              {filteredConversations.map(conv => (
                <div
                  key={conv.id}
                  className={`${styles.historyItem}${conv.id === currentConversationId ? ` ${styles.historyItemActive}` : ''}`}
                  onClick={() => {
                    loadConversation(conv.id);
                    setShowHistory(false);
                  }}
                >
                  <div className={styles.historyItemHeader}>
                    <span className={styles.historyItemTitle}>{conv.title || 'Untitled conversation'}</span>
                  </div>
                  <div className={styles.historyItemMeta}>
                    <span>{conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString() : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

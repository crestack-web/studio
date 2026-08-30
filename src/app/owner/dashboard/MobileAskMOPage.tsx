'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import { ReceiptGenerator, type ReceiptData } from './ReceiptGenerator';
import { loadBusinessReceiptSettings, buildSaleReceiptData } from './utils/saleReceipt';
import { useCurrency } from './CurrencyContext';
import { useTranslation } from './LangContext';
import { MoIcon } from './NavIcons';
import { Lightbulb, BarChart, DollarSign, Package, Heart, Plus, Cpu, Settings, Trash2 } from 'lucide-react';
import styles from './MobileAskMOPage.module.css';
import { useAskMO } from './useAskMO';
import { getSupabase } from '@/lib/supabase';
import { CreditPurchaseModal } from '@/components/CreditPurchaseModal';
import { SaleConfirmationCard } from '@/components/SaleConfirmationCard';

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

export function MobileAskMOPage() {
  const { user, showToast, navigateTo, theme } = useApp();
  const { formatMoney } = useCurrency();
  const { t, lang, langMeta } = useTranslation();

   // Use shared hook for data management
   const {
     messages,
     setMessages,
     creditsUsed,
     creditsRemaining,
     totalCreditsConsumed,
     planLimit,
     conversations,
    conversationsLoaded,
     currentConversationId,
     setCurrentConversationId,
     businessSummary,
     totalConversationsStarted,
     averageConversationTime,
     createConversation,
     saveMessages,
     saveConversation,
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

  // Convert blob to base64 on stop
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [dynamicSuggestions, setDynamicSuggestions] = useState([
    { label: "Analyze my sales", icon: <BarChart size={20} /> },
    { label: "Cash flow summary", icon: <DollarSign size={20} /> },
    { label: "Inventory insights", icon: <Package size={20} /> },
    { label: "Business health check", icon: <Heart size={20} /> },
  ]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showHistory, setShowHistory] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [showCreditPurchase, setShowCreditPurchase] = useState(false);
  const [loadingText, setLoadingText] = useState<string>('');
  const [isSending, setIsSending] = useState(false); // Prevent duplicate requests
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [showSaleReceipt, setShowSaleReceipt] = useState(false);
  const [saleReceiptData, setSaleReceiptData] = useState<ReceiptData | null>(null);
  const [saleReceiptType, setSaleReceiptType] = useState<'supermarket' | 'invoice'>('supermarket');
  const [pendingMessageId, setPendingMessageId] = useState<string | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<MOMessage[]>([]);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-load most recent conversation on mount
  useEffect(() => {
    if (!conversationsLoaded) return;
    if (conversations.length > 0 && !currentConversationId && messages.length === 0) {
      const mostRecent = conversations[0];
      console.log('📂 [MobileAskMO] Auto-loading most recent conversation:', mostRecent.id);
      void loadConversation(mostRecent.id);
    }
  }, [conversationsLoaded, conversations, currentConversationId, messages.length, loadConversation]);

  // Execute pending action (sale confirmation)
  const executePendingAction = useCallback(async () => {
    if (!pendingAction || isExecutingAction) return;

    setIsExecutingAction(true);
    try {
      const updatedMessages = [...messagesRef.current];
      
      if (pendingAction.action === 'record_sale') {
        const saleData = pendingAction.data;
        
        // Execute the sale via API
        const response = await fetch('/api/ask-mo', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: pendingAction,
            businessId: user.businessId || undefined,
            userId: user.id,
            userRole: (user.role && !['user',''].includes(String(user.role).toLowerCase())) ? user.role : 'owner',
          }),
        });

        const result = await response.json();

        if (result.success) {
          showToast(`Sale recorded: ${result.message}`);
          
          if (pendingMessageId) {
            const cardIndex = updatedMessages.findIndex(msg => msg.id === pendingMessageId && msg.saleCard);
            const existingCard = cardIndex !== -1 ? updatedMessages[cardIndex].saleCard : undefined;
            const fallbackItems = existingCard?.items || [{
              name: saleData.productName || 'Sale',
              quantity: saleData.quantity || 1,
              price: result.data?.product?.sellingPrice || saleData.price || 0,
              costPrice: result.data?.product?.costPrice || saleData.costPrice,
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
                  totalRevenue: result.data.totalRevenue || 0,
                  totalProfit: result.data.profit ?? existingCard.totalProfit,
                  timestamp: new Date(),
                  mode: 'recorded',
                },
              };
            }
          }
          
          // Original Record Sale receipt
          try {
            if (user.businessId) {
              const settings = await loadBusinessReceiptSettings(user.businessId);
              setSaleReceiptType(settings.receiptType);
              const itemsForReceipt = (result.data?.items || saleData.items || []).map((item: any) => ({
                name: item.name || item.productName || 'Item',
                quantity: Number(item.quantity) || 1,
                price: Number(item.price) || 0,
              }));
              setSaleReceiptData(
                buildSaleReceiptData({
                  settings,
                  items: itemsForReceipt,
                  saleId: result.saleId || result.data?.saleId,
                  paymentMethod: saleData.paymentMethod || saleData.paymentType || 'cash',
                  soldBy: user.name || user.shortName || 'Owner',
                })
              );
              setShowSaleReceipt(true);
            }
          } catch (e) {
            console.warn('[MobileAskMO] receipt failed', e);
          }

          // Add success message to chat
          const successMsg: MOMessage = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role: 'bot',
            content: `✅ Sale recorded successfully!\n\n${result.message}\n\nItems: ${saleData.items?.length || 1}\nRevenue: ₦${result.data.totalRevenue?.toLocaleString()}\nProfit: ₦${result.data.profit?.toLocaleString()}\n\nReceipt ready — same as Record Sale.`,
            timestamp: new Date(),
          };
          updatedMessages.push(successMsg);
        } else {
          showToast(`Failed to record sale: ${result.message}`);
          
          const errorMsg: MOMessage = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role: 'bot',
            content: `❌ Failed to record sale: ${result.message}`,
            timestamp: new Date(),
          };
          updatedMessages.push(errorMsg);
        }
      } else {
        // Generic handler for add_expense, add_product, etc.
        const response = await fetch('/api/ask-mo', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: pendingAction,
            businessId: user.businessId || undefined,
            userId: user.id,
            userRole: (user.role && !['user',''].includes(String(user.role).toLowerCase())) ? user.role : 'owner',
          }),
        });

        const result = await response.json();

        if (result.success) {
          showToast(`Action completed: ${result.message}`);
          const successMsg: MOMessage = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role: 'bot',
            content: `✅ ${result.message || 'Action completed successfully.'}`,
            timestamp: new Date(),
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
      }

      setMessages(updatedMessages);
      setPendingAction(null);
      setPendingMessageId(null);
      if (currentConversationId) {
        await saveMessages(currentConversationId, updatedMessages);
      }
    } catch (error) {
      console.error('Error executing action:', error);
      showToast('Failed to execute action');
      setPendingAction(null);
      setPendingMessageId(null);
      
      // Save conversation even on error
      if (currentConversationId) {
        await saveConversation();
      }
    } finally {
      setIsExecutingAction(false);
    }
  }, [pendingAction, isExecutingAction, pendingMessageId, user, showToast, currentConversationId, saveConversation, saveMessages, setMessages]);

  // Check for pre-filled question from other pages
  useEffect(() => {
    const prefilledQuestion = localStorage.getItem('mo-prefilled-question');
    if (prefilledQuestion && !isSending) {
      setInput(prefilledQuestion);
      localStorage.removeItem('mo-prefilled-question');
      // Auto-send the question after a short delay
      setTimeout(() => {
        send(prefilledQuestion);
      }, 500);
    }
  }, []);

  // Keep ref in sync with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Always scroll to bottom for chat interface - this is expected behavior
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    });
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
    resetToNewChat();
    setInput('');
    setSelectedImage(null);
    setImagePreview(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setIsTyping(false);
    setIsStreaming(false);
    setLoadingText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [resetToNewChat]);

  const handleLoadConversation = useCallback(async (conversationId: string) => {
    console.log('📂 [MobileAskMO] Loading conversation:', conversationId);
    try {
      await loadConversation(conversationId);
      console.log('✅ [MobileAskMO] Conversation loaded successfully');
      setShowHistory(false);
      setIsTyping(false);
      setIsStreaming(false);
      setLoadingText('');
    } catch (error) {
      console.error('❌ [MobileAskMO] Failed to load conversation:', error);
      showToast('Failed to load conversation. Please try again.');
    }
  }, [loadConversation, showToast]);

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
      
      // Try to use a supported MIME type
      let mimeType = 'audio/webm';
      const supportedTypes = [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/mp4',
        'audio/wav'
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
        
        // Convert to base64 for server transmission
        try {
          const base64 = await blobToBase64(blob);
          setAudioBase64(base64);
        } catch (error) {
          console.error('Failed to convert audio to base64:', error);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error('Error starting recording:', error);
      showToast('Could not access microphone. Please check permissions.');
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
    const requestStartTime = Date.now();
    console.log('🚀 [MobileAskMO] send() called', { 
      hasText: !!text, 
      hasInput: !!input, 
      hasImage: !!selectedImage, 
      hasAudio: !!audioBlob,
      isSending 
    });

    // Prevent duplicate requests
    if (isSending) {
      console.log('⚠️ [MobileAskMO] Request already in progress, ignoring duplicate');
      return;
    }
    
    const msg = (text ?? input).trim();
    if (!msg && !selectedImage && !audioBlob) {
      console.log('⚠️ [MobileAskMO] No content to send');
      return;
    }
    
    setIsSending(true);
    console.log('✅ [MobileAskMO] Request validation passed', { time: Date.now() - requestStartTime });

    // Check credits: -1 means unlimited (pro plan), 0 or negative means no credits
    if (creditsRemaining !== -1 && creditsRemaining <= 0) {
      console.log('⚠️ [MobileAskMO] Insufficient credits', { creditsRemaining });
      showToast('You have run out of MO Credits. Please purchase more credits to continue.');
      setIsSending(false);
      return;
    }

    let finalMessage = msg;
    let finalImageUrl = imagePreview || undefined;
    let finalAudioUrl = audioUrl || undefined;

    if (audioBlob && !msg) {
      console.log('🎤 [MobileAskMO] Starting audio transcription');
      setIsTranscribing(true);
      try {
        const transcription = await transcribeAudio(audioBlob);
        finalMessage = transcription;
        setInput(transcription);
        console.log('✅ [MobileAskMO] Audio transcription completed', { length: transcription.length });
      } catch (error) {
        console.error('❌ [MobileAskMO] Audio transcription failed:', error);
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

    console.log('📝 [MobileAskMO] User message created', { 
      messageId: userMsg.id, 
      contentLength: finalMessage.length,
      hasImage: !!finalImageUrl,
      hasAudio: !!finalAudioUrl
    });

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
    setLoadingText('Thinking');

    // Track conversation id in a local variable — React state is async and cannot be relied on for save
    let activeConversationId = currentConversationId;
    if (!activeConversationId) {
      console.log('💾 [MobileAskMO] Creating new conversation on first message');
      activeConversationId = await createConversation(userMsg);
      if (activeConversationId) {
        console.log('✅ [MobileAskMO] Conversation created:', activeConversationId);
      }
      console.log('📊 [MobileAskMO] Loading business data on first message');
      await loadBusinessData();
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    await new Promise(resolve => setTimeout(resolve, 800));
    setLoadingText('Generating insights');

    try {
      // Create a placeholder bot message for streaming
      const botMsgId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const botMsg: MOMessage = {
        id: botMsgId,
        role: 'bot',
        content: '',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
      console.log('📝 [MobileAskMO] Bot message placeholder created', { botMsgId });

      // Fetch with streaming and timeout
      console.log('📡 [MobileAskMO] Starting API call to /api/ask-mo');
      const apiCallStart = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      // Get business category
      let businessCategory = 'retail';
      if (user.businessId) {
        try {
          const supabase = getSupabase();
          const { data } = await supabase
            .from('businesses')
            .select('category, industry, metadata')
            .eq('id', user.businessId)
            .maybeSingle();
          const meta = (data?.metadata && typeof data.metadata === 'object') ? (data.metadata as any) : {};
          businessCategory =
            data?.category ||
            data?.industry ||
            meta.selectedCategory ||
            meta.category ||
            'retail';
        } catch (error) {
          console.error('Error fetching business category:', error);
        }
      }
      
      const requestBody: any = {
        message: finalMessage,
        image: finalImageUrl,
        businessId: user.businessId || undefined,
        userId: user.id,
        conversationHistory: currentConversationId ? messages.slice(-10).map(m => ({ role: m.role, content: m.content })) : [],
        userPlan: user.plan || planLimit === -1 ? 'pro' : planLimit === 50 ? 'standard' : 'starter',
        language: lang,
        languageName: langMeta.name,
        businessCategory: businessCategory,
        businessSummary: businessSummary,
        userRole: (user.role && !['user',''].includes(String(user.role).toLowerCase())) ? user.role : 'owner',
      };
      if (audioBase64) requestBody.audio = audioBase64;
      
      console.log('📤 [MobileAskMO] Request payload:', {
        messageLength: finalMessage.length,
        hasImage: !!finalImageUrl,
        businessId: requestBody.businessId,
        conversationHistoryLength: requestBody.conversationHistory.length,
      });

      const response = await fetch('/api/ask-mo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(requestBody),
      });
      
      clearTimeout(timeoutId);
      const apiCallTime = Date.now() - apiCallStart;
      console.log('✅ [MobileAskMO] API call completed', { 
        status: response.status, 
        time: apiCallTime 
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [MobileAskMO] API error response:', errorData);
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      // Handle non-streaming JSON response
      console.log('📡 [MobileAskMO] Parsing JSON response');
      const data = await response.json();
      const fullContent = data.answer || data.response || "I'm analysing your business data...";
      console.log('✅ [MobileAskMO] Response received', { 
        responseLength: fullContent.length 
      });

      const rendered = data.rendered;

      const updatedBotMsg: MOMessage = {
        ...botMsg,
        content: fullContent,
        metrics: rendered?.metrics,
        quickActions: rendered?.quickActions,
        followUpSuggestions: rendered?.suggestions,
        alerts: rendered?.alerts,
      };

      // Attach structured cards from rendered response
      if (rendered?.card) {
        if (rendered.card.type === 'sale') {
          updatedBotMsg.saleCard = rendered.card;
        } else if (rendered.card.type === 'product') {
          updatedBotMsg.productCard = rendered.card;
        } else if (rendered.card.type === 'expense') {
          updatedBotMsg.expenseCard = rendered.card;
        }
      }

      // If API returned a pending action (needs confirmation), set it
      if (data.pendingAction) {
        setPendingAction(data.pendingAction);
        setPendingMessageId(botMsgId);
        if (
          data.pendingAction.action === 'record_sale' &&
          !updatedBotMsg.saleCard &&
          data.pendingAction.data?.items?.length
        ) {
          const d = data.pendingAction.data;
          updatedBotMsg.saleCard = {
            items: d.items.map((item: any) => ({
              name: item.productName || item.name,
              quantity: item.quantity || 1,
              price: item.price || 0,
              costPrice: item.costPrice || 0,
              imageUrl: item.imageUrl || '',
            })),
            totalRevenue: d.totalRevenue || 0,
            totalProfit: d.profit || 0,
            timestamp: new Date(),
          };
        }
      }

      // Update the final message
      setMessages(prev => 
        prev.map(msg => 
          msg.id === botMsgId 
            ? updatedBotMsg
            : msg
        )
      );

      // Persist user + assistant messages (use local conversation id, not stale state)
      if (activeConversationId) {
        console.log('💾 [MobileAskMO] Saving messages to conversation', activeConversationId);
        const prior = messagesRef.current.filter((m) => m.id !== botMsgId);
        // Ensure user message is included
        const hasUser = prior.some((m) => m.id === userMsg.id);
        const thread = hasUser ? [...prior, updatedBotMsg] : [...prior, userMsg, updatedBotMsg];
        await saveMessages(activeConversationId, thread);
        setMessages(thread);
      } else {
        console.warn('⚠️ [MobileAskMO] No conversation id — assistant reply not persisted');
      }

      // Calculate and consume credits based on response length (simulating token usage)
      // Only consume credits if we received a valid response
      if (fullContent && fullContent.length > 10 && fullContent !== "I'm analysing your business data...") {
        const estimatedTokens = Math.ceil((fullContent.length / 4) * 0.7);
        const creditsConsumed = Math.max(5, Math.min(100, estimatedTokens));
        console.log('💰 [MobileAskMO] Consuming credits', { estimatedTokens, creditsConsumed });
        await updateCredits(creditsConsumed);
      } else {
        console.log('⚠️ [MobileAskMO] Not consuming credits - invalid or empty response');
      }

      const totalTime = Date.now() - requestStartTime;
      console.log('✅ [MobileAskMO] Request completed successfully', {
        totalTime,
        responseLength: fullContent.length,
      });
    } catch (error) {
      const errorTime = Date.now() - requestStartTime;
      console.error('❌ [MobileAskMO] Request failed:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
        code: (error as any).code,
        details: (error as any).details,
        stack: error instanceof Error ? error.stack : undefined,
        time: errorTime,
      });
      
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Please check your connection and try again.';
          console.error('❌ [MobileAskMO] Request timeout after 60 seconds');
        } else if (error.message.includes('fetch') || error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
          console.error('❌ [MobileAskMO] Network error:', error);
        } else if (error.message.includes('Firebase') || error.message.includes('functions')) {
          // Firebase function error
          errorMessage = 'Service temporarily unavailable. Please try again in a moment.';
          console.error('❌ [MobileAskMO] Firebase function error:', {
            code: (error as any).code,
            details: (error as any).details,
          });
        } else if (error.message.includes('Google') || error.message.includes('genai') || error.message.includes('API')) {
          // Filter out Google Gen AI specific errors
          errorMessage = 'I apologize, but I encountered an issue processing your request. Please try again.';
          console.error('❌ [MobileAskMO] Google Gen AI error:', error);
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
      setLoadingText('');
      setIsSending(false);
    }
  }, [input, selectedImage, imagePreview, audioBlob, audioUrl, audioBase64, messages, user, planLimit, creditsUsed, showToast, lang, langMeta, currentConversationId, createConversation, saveMessages, updateCredits, messagesRef, creditsRemaining, businessSummary, loadBusinessData, isSending, isTranscribing]);

  const cancelPendingAction = useCallback(async () => {
    const cancelMsg: MOMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'bot',
      content: 'Action cancelled.',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, cancelMsg]);
    setPendingAction(null);
    setPendingMessageId(null);
    
    // Save conversation after cancellation
    if (currentConversationId) {
      await saveConversation();
    }
  }, [currentConversationId, saveConversation, setMessages]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  function formatContent(content: string, role: 'user' | 'bot' = 'bot') {
    // Split by newlines first
    const lines = content.split('\n');
    
    // For user messages, use white text (on purple background)
    // For bot messages, use text-1 color
    const textColor = role === 'user' ? 'white' : 'var(--text-1)';
    
    return lines.map((line, lineIndex) => {
      // Skip empty lines but preserve spacing
      if (!line.trim()) {
        return <div key={lineIndex} style={{ height: '0.5rem' }} />;
      }
      
      // Check for table row (starts with |)
      if (line.trim().startsWith('|')) {
        const cells = line.split('|').filter(cell => cell.trim() !== '');
        return (
          <div key={lineIndex} style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '13px', overflowX: 'auto' }}>
            {cells.map((cell, cellIndex) => (
              <div key={cellIndex} style={{
                flex: 1,
                minWidth: '80px',
                padding: '6px 8px',
                background: cellIndex === 0 ? 'var(--bg-3)' : 'var(--bg-2)',
                borderRadius: '4px',
                color: textColor,
                fontWeight: cellIndex === 0 ? 600 : 400,
                fontSize: cellIndex === 0 ? '12px' : '13px'
              }}>
                {cell.trim()}
              </div>
            ))}
          </div>
        );
      }
      
      // Check for list items (starts with - or *)
      if (line.trim().match(/^[-*]\s+/)) {
        const listContent = line.trim().replace(/^[-*]\s+/, '');
        return (
          <div key={lineIndex} style={{ display: 'flex', gap: '8px', marginBottom: '6px', color: textColor }}>
            <span style={{ color: role === 'user' ? 'rgba(255,255,255,0.8)' : 'var(--primary)', fontWeight: 600 }}>•</span>
            <span style={{ lineHeight: '1.6' }}>{formatInlineMarkdown(listContent, role)}</span>
          </div>
        );
      }
      
      // Check for headers (starts with #)
      if (line.trim().startsWith('#')) {
        const headerContent = line.trim().replace(/^#+\s+/, '');
        const headerLevel = line.match(/^#+/)?.[0].length || 1;
        const fontSize = headerLevel === 1 ? '18px' : headerLevel === 2 ? '16px' : '14px';
        return (
          <div key={lineIndex} style={{
            fontSize,
            fontWeight: 600,
            color: textColor,
            marginBottom: '12px',
            marginTop: '8px'
          }}>
            {formatInlineMarkdown(headerContent, role)}
          </div>
        );
      }
      
      // Regular paragraph with inline markdown
      return (
        <React.Fragment key={lineIndex}>
          <span style={{ lineHeight: '1.7', display: 'block', marginBottom: lineIndex < lines.length - 1 && lines[lineIndex + 1].trim() ? '0.75rem' : '0', color: textColor }}>
            {formatInlineMarkdown(line, role)}
          </span>
        </React.Fragment>
      );
    });
  }
  
  function formatInlineMarkdown(text: string, role: 'user' | 'bot' = 'bot') {
    // Bold with **text**
    let parts = text.split(/\*\*([^*]+)\*\*/g);
    const textColor = role === 'user' ? 'white' : 'var(--text-1)';
    const formatted = parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} style={{ fontWeight: 600, color: textColor }}>{part}</strong>;
      }
      // Italic with *text*
      const italicParts = part.split(/\*([^*]+)\*/g);
      if (italicParts.length > 1) {
        return italicParts.map((italicPart, i) => {
          if (i % 2 === 1) {
            return <em key={i} style={{ fontStyle: 'italic' }}>{italicPart}</em>;
          }
          return italicPart;
        });
      }
      return part;
    });
    return formatted;
  }

  function formatRecordingTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function shouldShowActionChips(message: MOMessage): boolean {
    // Only show action chips for bot messages with analytics/data content
    if (message.role !== 'bot') return false;
    
    const content = message.content.toLowerCase();
    const analyticsKeywords = ['sales', 'revenue', 'profit', 'inventory', 'stock', 'forecast', 'report', 'analytics', 'data', 'trend', 'growth', 'performance'];
    
    // Check if content contains analytics-related keywords
    const hasAnalyticsContent = analyticsKeywords.some(keyword => content.includes(keyword));
    
    // Don't show for greetings, confirmations, short answers, or errors
    const isShortResponse = message.content.length < 100;
    const isGreeting = /^(hi|hello|hey|good morning|good afternoon|good evening)/i.test(content);
    const isConfirmation = /^(yes|no|ok|sure|certainly|absolutely|of course|understood|got it)/i.test(content);
    const isError = content.includes('error') || content.includes('sorry') || content.includes('apologize');
    
    return hasAnalyticsContent && !isShortResponse && !isGreeting && !isConfirmation && !isError;
  }

  // Prevent mobile page from showing on desktop breakpoint
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Redirect to desktop Ask MO if on desktop
  useEffect(() => {
    if (!isMobile) {
      // On desktop, redirect to home page which will show the AI panel
      navigateTo('home');
    }
  }, [isMobile, navigateTo]);

  if (!isMobile) {
    return null;
  }

  const filteredConversations = conversations.filter((conv) =>
    (conv.title || '').toLowerCase().includes(historySearchQuery.toLowerCase())
  );

  const formatHistoryDate = (value: any) => {
    try {
      if (!value) return '';
      const d = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className={styles.container} data-theme={theme}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigateTo('home')} title="Back" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}>
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className={styles.moAvatar}>
          <MoIcon size={18} />
        </div>
        <h3 className={styles.headerTitle}>Ask MO</h3>
        <div className={styles.headerActions}>
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
            <span>{creditsRemaining === -1 ? 'Unlimited' : creditsRemaining.toLocaleString()}</span>
            {creditsRemaining !== -1 && (
              <span style={{ marginLeft: '2px', fontSize: '12px', color: 'var(--primary)' }}>+</span>
            )}
          </div>
          <button
            type="button"
            className={styles.historyBtn}
            onClick={() => setShowHistory(true)}
            title="Conversation history"
            aria-label="Conversation history"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18 }}>
              <path d="M12 8v4l3 3" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </button>
          <button
            type="button"
            className={styles.newChatBtn}
            onClick={handleNewChat}
            title="New chat"
            aria-label="New chat"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>

      <CreditPurchaseModal 
        isOpen={showCreditPurchase}
        onClose={() => setShowCreditPurchase(false)}
        onSuccess={handlePurchaseSuccess}
      />

      {/* Messages */}
      <div className={styles.messages} ref={messagesContainerRef}>
        {messages.length === 0 && conversationsLoaded && conversations.length === 0 && (
          <div className={styles.emptyChat}>
            <div className={styles.emptyChatContent}>
              <div className={styles.moAvatarLg}>
                <MoIcon size={48} />
              </div>
              <h3>Hi, I'm Mo</h3>
              <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-2)' }}>Your AI business assistant. Ask me anything about your business.</p>
              
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

        {messages.map(m => (
          <div
            key={m.id}
            className={`${styles.message} ${m.role === 'user' ? styles.user : styles.bot}`}
          >
            {m.role === 'bot' && (
              <div className={styles.botAvatarContainer}>
                <div className={styles.moAvatarSm}>
                  <MoIcon size={18} />
                </div>
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
              {formatContent(m.content, m.role)}
              {/* Sale Confirmation */}
              {m.role === 'bot' && m.saleCard && (
                <div style={{ marginTop: '12px' }}>
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
              {/* Product Confirmation */}
              {m.role === 'bot' && m.productCard && (
                <div style={{
                  marginTop: '12px',
                  background: pendingAction?.action === 'add_product' ? 'rgba(245,158,11,0.1)' : 'var(--primary-light, rgba(99,102,241,0.1))',
                  border: `1px solid ${pendingAction?.action === 'add_product' ? 'var(--amber, #F59E0B)' : 'var(--primary, #6366F1)'}`,
                  borderRadius: '8px',
                  padding: '16px',
                }}>
                  <h4 style={{ margin: '0 0 8px 0', color: pendingAction?.action === 'add_product' ? 'var(--amber, #F59E0B)' : 'var(--primary, #6366F1)', fontSize: '0.95rem' }}>
                    {pendingAction?.action === 'add_product' ? '📦 Confirm Add Product' : '✅ Product Added'}
                  </h4>
                  <p style={{ margin: '4px 0', fontWeight: 600 }}>{m.productCard.name}</p>
                  {m.productCard.imageUrl && (
                    <img
                      src={m.productCard.imageUrl}
                      alt={m.productCard.name}
                      style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', marginTop: '4px', display: 'block' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  <p style={{ margin: '4px 0', fontSize: '0.85rem', color: 'var(--text-2, #666)' }}>
                    Stock: {m.productCard.stock} units<br/>
                    Selling: ₦{m.productCard.price.toLocaleString()}<br/>
                    Cost: ₦{m.productCard.cost.toLocaleString()}
                    {m.productCard.sku && <><br/>SKU: {m.productCard.sku}</>}
                  </p>
                  {pendingAction && pendingMessageId === m.id && pendingAction.action === 'add_product' && !isExecutingAction && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button onClick={executePendingAction} style={{ flex: 1, padding: '10px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                        ✓ Confirm
                      </button>
                      <button onClick={cancelPendingAction} style={{ flex: 1, padding: '10px', background: 'var(--bg-2, #f1f5f9)', color: 'var(--text-1, #334155)', border: '1px solid var(--border, #e2e8f0)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
              {/* Expense Confirmation */}
              {m.role === 'bot' && m.expenseCard && (
                <div style={{
                  marginTop: '12px',
                  background: pendingAction?.action === 'add_expense' ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.1)',
                  border: `1px solid ${pendingAction?.action === 'add_expense' ? 'var(--amber, #F59E0B)' : 'var(--amber, #F59E0B)'}`,
                  borderRadius: '8px',
                  padding: '16px',
                }}>
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--amber, #F59E0B)', fontSize: '0.95rem' }}>
                    {pendingAction?.action === 'add_expense' ? '💰 Confirm Expense' : '✅ Expense Recorded'}
                  </h4>
                  <p style={{ margin: '4px 0', fontWeight: 600 }}>{m.expenseCard.category}</p>
                  <p style={{ margin: '4px 0', fontSize: '0.85rem', color: 'var(--text-2, #666)' }}>
                    Amount: ₦{m.expenseCard.amount.toLocaleString()}<br/>
                    Date: {m.expenseCard.date}
                  </p>
                  {pendingAction && pendingMessageId === m.id && pendingAction.action === 'add_expense' && !isExecutingAction && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button onClick={executePendingAction} style={{ flex: 1, padding: '10px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                        ✓ Confirm
                      </button>
                      <button onClick={cancelPendingAction} style={{ flex: 1, padding: '10px', background: 'var(--bg-2, #f1f5f9)', color: 'var(--text-1, #334155)', border: '1px solid var(--border, #e2e8f0)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
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
              {m.role === 'bot' && shouldShowActionChips(m) && m.quickActions && m.quickActions.length > 0 && (
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
              {m.role === 'bot' && shouldShowActionChips(m) && m.followUpSuggestions && m.followUpSuggestions.length > 0 && (
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
            </div>
          </div>
        ))}

        {isTyping && (
          <div className={`${styles.message} ${styles.bot}`}>
            <div className={styles.botAvatarContainer}>
              <div className={styles.moAvatarSm}>
                <MoIcon size={18} />
              </div>
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
                setRecordingTime(0);
              }}
            >
              ✕
            </button>
          </div>
        )}
        <div className={styles.inputWrapper}>
          <div style={{ position: 'relative' }}>
            <button
              className={styles.attachBtn}
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              title="Add attachment"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}>
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
            {showAttachmentMenu && (
              <div className={styles.attachmentMenu}>
                <button
                  className={styles.attachmentMenuItem}
                  onClick={() => {
                    setShowAttachmentMenu(false);
                    fileInputRef.current?.click();
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18 }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span>Image</span>
                </button>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageSelect}
          />
          <button
            className={`${styles.micBtn} ${isRecording ? styles.recording : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            title={isRecording ? "Stop recording" : "Record voice"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}>
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
            placeholder={isRecording ? "Recording..." : "Ask MO..."}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              if (textareaRef.current) autoResize(textareaRef.current);
            }}
            onKeyDown={handleKey}
            rows={1}
            disabled={isRecording || isTranscribing}
            inputMode="text"
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
            disabled={isSending || isTranscribing || (!input.trim() && !selectedImage && !audioBlob)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Conversation history drawer */}
      {showHistory && (
        <>
          <div className={styles.historyBackdrop} onClick={() => setShowHistory(false)} />
          <div className={styles.historyPanel} role="dialog" aria-label="Conversation history">
            <div className={styles.historyHeader}>
              <h3 className={styles.historyTitle}>Conversation History</h3>
              <div className={styles.historyHeaderActions}>
                <button
                  type="button"
                  className={styles.historyNewChatBtn}
                  onClick={() => {
                    handleNewChat();
                    setShowHistory(false);
                  }}
                >
                  New chat
                </button>
                <button
                  type="button"
                  className={styles.closeHistoryBtn}
                  onClick={() => setShowHistory(false)}
                  aria-label="Close history"
                >
                  ✕
                </button>
              </div>
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
                <div className={styles.historyEmpty}>
                  {conversations.length === 0
                    ? 'No conversations yet'
                    : 'No matches for your search'}
                </div>
              )}
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`${styles.historyItem}${
                    conv.id === currentConversationId ? ` ${styles.historyItemActive}` : ''
                  }`}
                  onClick={() => handleLoadConversation(conv.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleLoadConversation(conv.id);
                    }
                  }}
                >
                  <div className={styles.historyItemHeader}>
                    <span className={styles.historyItemTitle}>
                      {conv.title || 'Untitled conversation'}
                    </span>
                    <button
                      type="button"
                      className={styles.historyItemAction}
                      title="Delete conversation"
                      aria-label="Delete conversation"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await deleteConversation(conv.id);
                          if (conv.id === currentConversationId) {
                            handleNewChat();
                          }
                          showToast('Conversation deleted');
                        } catch (err) {
                          console.error(err);
                          showToast('Failed to delete conversation');
                        }
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={14} height={14}>
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>
                  <div className={styles.historyItemMeta}>
                    <span>{formatHistoryDate(conv.updatedAt || conv.createdAt)}</span>
                    {conv.id === currentConversationId && (
                      <span className={styles.historyItemCurrent}>Current</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

    
      {showSaleReceipt && saleReceiptData && (
        <ReceiptGenerator
          receiptData={saleReceiptData}
          onClose={() => {
            setShowSaleReceipt(false);
            setSaleReceiptData(null);
          }}
          receiptType={saleReceiptType}
        />
      )}
</div>
  );
}

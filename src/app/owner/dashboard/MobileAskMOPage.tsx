import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useTranslation } from './LangContext';
import { MoIcon } from './NavIcons';
import { initializeFirebase } from '@/firebase';
import { getFirestore, collection, query, where, getDocs, Timestamp, doc, getDoc, setDoc, addDoc, deleteDoc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { Lightbulb, BarChart, DollarSign, Package, Heart, Plus, Cpu, Settings, Trash2 } from 'lucide-react';
import styles from './MobileAskMOPage.module.css';
import { useAskMO } from './useAskMO';
import { CreditPurchaseModal } from '@/components/CreditPurchaseModal';
import { SaleConfirmationCard } from '@/components/SaleConfirmationCard';
import { triggerActionRefresh } from '@/utils/dataRefresh';

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
  const [dynamicSuggestions, setDynamicSuggestions] = useState([
    { label: "Analyze my sales", icon: <BarChart size={20} /> },
    { label: "Cash flow summary", icon: <DollarSign size={20} /> },
    { label: "Inventory insights", icon: <Package size={20} /> },
    { label: "Business health check", icon: <Heart size={20} /> },
  ]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showHistory, setShowHistory] = useState(false);
  const [showCreditPurchase, setShowCreditPurchase] = useState(false);
  const [loadingText, setLoadingText] = useState('MO is thinking...');
  const [isSending, setIsSending] = useState(false); // Prevent duplicate requests
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<MOMessage[]>([]);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-refresh function to trigger UI updates after successful MO actions
  const triggerDataRefresh = useCallback((actionType?: string, data?: any) => {
    if (actionType) {
      triggerActionRefresh(actionType, data);
    } else {
      triggerActionRefresh('general_update');
    }
  }, []);

  // Auto-load most recent conversation on mount to persist state across refresh/navigation
  useEffect(() => {
    if (conversations.length > 0 && !currentConversationId && messages.length === 0) {
      const mostRecent = conversations[0];
      if (mostRecent.messages && mostRecent.messages.length > 0) {
        console.log('📂 [MobileAskMO] Auto-loading most recent conversation:', mostRecent.id);
        loadConversation(mostRecent.id);
      }
    }
  }, [conversations, currentConversationId, messages.length, loadConversation]);

  // Execute pending action (sale confirmation)
  const executePendingAction = useCallback(async () => {
    if (!pendingAction || isExecutingAction) return;

    setIsExecutingAction(true);
    try {
      const { firestore } = initializeFirebase();
      
      if (pendingAction.action === 'record_sale') {
        const saleData = pendingAction.data;
        
        // Execute the sale via API
        const response = await fetch('/api/ask-mo', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: pendingAction,
            businessId: user.businessId || user.id,
            userId: user.id,
          }),
        });

        const result = await response.json();

        if (result.success) {
          showToast(`Sale recorded: ${result.message}`);
          
          // Add success message to chat
          const successMsg: MOMessage = {
            id: (Date.now()).toString(),
            role: 'bot',
            content: `✅ Sale recorded successfully!\n\n${result.message}\n\nProduct: ${saleData.productName}\nQuantity: ${saleData.quantity}\nRevenue: ₦${result.data.totalRevenue?.toLocaleString()}\nProfit: ₦${result.data.profit?.toLocaleString()}`,
            timestamp: new Date(),
            saleCard: {
              items: [{
                name: saleData.productName,
                quantity: saleData.quantity,
                price: result.data.product?.sellingPrice || saleData.price,
                costPrice: result.data.product?.costPrice,
              }],
              totalRevenue: result.data.totalRevenue,
              totalProfit: result.data.profit,
              timestamp: new Date(),
            },
          };

          setMessages(prev => [...prev, successMsg]);
          setPendingAction(null);
          
          // Trigger UI refresh after successful action
          triggerDataRefresh('sale_recorded', { 
            productId: result.data.productId, 
            quantity: saleData.quantity, 
            revenue: result.data.totalRevenue 
          });
          
          // Save conversation after successful action
          if (currentConversationId) {
            await saveConversation();
          }
        } else {
          showToast(`Failed to record sale: ${result.message}`);
          
          // Add error message to chat
          const errorMsg: MOMessage = {
            id: (Date.now()).toString(),
            role: 'bot',
            content: `❌ Failed to record sale: ${result.message}`,
            timestamp: new Date(),
          };

          setMessages(prev => [...prev, errorMsg]);
          setPendingAction(null);
          
          // Save conversation even on error
          if (currentConversationId) {
            await saveConversation();
          }
        }
      }
    } catch (error) {
      console.error('Error executing action:', error);
      showToast('Failed to execute action');
      setPendingAction(null);
      
      // Save conversation even on error
      if (currentConversationId) {
        await saveConversation();
      }
    } finally {
      setIsExecutingAction(false);
    }
  }, [pendingAction, isExecutingAction, user, showToast, currentConversationId, saveConversation, triggerDataRefresh]);

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

  // Auto-scroll to bottom when messages change
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
    await loadConversation(conversationId);
    setShowHistory(false);
    setIsTyping(false);
    setIsStreaming(false);
    setLoadingText('');
  }, [loadConversation]);

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

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
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

  const send = useCallback(async (message: string) => {
    const requestStartTime = Date.now();
    console.log('🚀 [MobileAskMO] send() called', { 
      hasText: !!message, 
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
    
    const msg = (message ?? input).trim();
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
      id: (Date.now()).toString(),
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
          
    // Set initial dynamic loading text based on message content
    if (finalMessage.toLowerCase().includes('sale') || finalMessage.toLowerCase().includes('sell')) {
      setLoadingText('Analyzing your sales data...');
    } else if (finalMessage.toLowerCase().includes('expense') || finalMessage.toLowerCase().includes('spend') || finalMessage.toLowerCase().includes('paid')) {
      setLoadingText('Processing your expense entry...');
    } else if (finalMessage.toLowerCase().includes('product') || finalMessage.toLowerCase().includes('add') || finalMessage.toLowerCase().includes('create')) {
      setLoadingText('Adding to your product catalog...');
    } else if (finalMessage.toLowerCase().includes('report') || finalMessage.toLowerCase().includes('show') || finalMessage.toLowerCase().includes('analyze') || finalMessage.toLowerCase().includes('how much') || finalMessage.toLowerCase().includes('what are')) {
      setLoadingText('Generating business insights...');
    } else if (finalMessage.toLowerCase().includes('inventory') || finalMessage.toLowerCase().includes('stock')) {
      setLoadingText('Checking your inventory...');
    } else if (finalMessage.toLowerCase().includes('customer') || finalMessage.toLowerCase().includes('client')) {
      setLoadingText('Looking up customer data...');
    } else {
      setLoadingText('MO is thinking...');
    }
    setLoadingText('Thinking');

    // Create conversation immediately on first message (before API call)
    if (!currentConversationId) {
      console.log('💾 [MobileAskMO] Creating new conversation on first message');
      const newConversationId = await createConversation(userMsg);
      if (newConversationId) {
        console.log('✅ [MobileAskMO] Conversation created:', newConversationId);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoadingText('Generating insights');

    try {
      console.log('💾 [MobileAskMO] Saving user message to conversation');
      // Note: Messages are now saved to conversation document, not individual mo_messages collection

      // Create a placeholder bot message for streaming
      const botMsgId = (Date.now() + 1).toString();
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
      
      const requestBody = {
        message: finalMessage,
        image: finalImageUrl,
        businessId: user.businessId || user.id,
        userId: user.id,
        conversationHistory: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        userPlan: user.plan || 'starter',
        language: lang,
        languageName: langMeta.name,
        businessCategory: businessCategory,
      };
      
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

      // Update the final message
      setMessages(prev => 
        prev.map(msg => 
          msg.id === botMsgId 
            ? { ...msg, content: fullContent }
            : msg
        )
      );

      // Save bot message to conversation immediately
      if (currentConversationId) {
        console.log('💾 [MobileAskMO] Saving bot message to conversation');
        // Explicitly construct full messages array including user and bot messages
        const updatedMessages = [...messagesRef.current, userMsg, { ...botMsg, content: fullContent }];
        await saveMessages(currentConversationId, updatedMessages);
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

      // Check if there's a pending action (sale confirmation)
      if (data.action && data.action.action === 'record_sale') {
        console.log('🎯 [MobileAskMO] Sale action detected, showing confirmation card');
        // Update the bot message with saleCard data so the UI can render the confirmation card
        const saleData = data.action.data;
        const botMsgWithCard: MOMessage = {
          ...botMsg,
          content: `I found the product in your inventory. Please confirm the sale details below:`,
          saleCard: {
            items: [{
              name: saleData.productName,
              quantity: saleData.quantity || 1,
              price: saleData.price || 0,
              costPrice: saleData.costPrice || 0,
            }],
            totalRevenue: (saleData.price || 0) * (saleData.quantity || 1),
            totalProfit: ((saleData.price || 0) - (saleData.costPrice || 0)) * (saleData.quantity || 1),
            timestamp: new Date(),
          },
        };
        setMessages(prev => prev.map(msg => 
          msg.id === botMsgId 
            ? botMsgWithCard
            : msg
        ));
        // Set pending action for confirmation
        setPendingAction(data.action);
        
        // Save the updated message with sale card to conversation
        if (currentConversationId) {
          const updatedMessagesWithCard = [...messages, userMsg, botMsgWithCard];
          await saveMessages(currentConversationId, updatedMessagesWithCard);
        }
      } else if (data.intent && (data.intent.intent === 'add_expense' || data.intent.intent === 'record_sale' || data.intent.intent === 'add_product')) {
        // Trigger UI refresh for successful actions that modify business data
        if (data.actionResult && data.actionResult.success) {
          console.log('🔄 [MobileAskMO] Data modification detected, triggering UI refresh');
          let actionType = 'general_update';
          switch(data.intent.intent) {
            case 'record_sale':
              actionType = 'sale_recorded';
              break;
            case 'add_expense':
              actionType = 'expense_added';
              break;
            case 'add_product':
              actionType = 'product_added';
              break;
          }
          triggerDataRefresh(actionType, data.actionResult.data);
        }
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
  }, [input, selectedImage, imagePreview, audioBlob, audioUrl, messages, user, planLimit, creditsUsed, showToast, lang, langMeta, currentConversationId, createConversation, saveMessages, updateCredits, messagesRef, triggerDataRefresh]);

  return (
    <div className={`${styles.container} ${theme}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button 
            className={styles.backButton} 
            onClick={() => navigateTo('home')}
            aria-label="Back to dashboard"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className={styles.headerTitle}>
            <div className={styles.moAvatarLg}>
              <MoIcon size={24} />
            </div>
            <div>
              <h2>MO AI Assistant</h2>
              <p className={styles.statusText}>Online • Ready to help</p>
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button 
            className={`${styles.historyBtn} ${showHistory ? styles.active : ''}`}
            onClick={() => setShowHistory(!showHistory)}
            aria-label="Chat history"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
          <button 
            className={styles.newChatBtn}
            onClick={resetToNewChat}
            aria-label="New chat"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${styles.mainContent} ${showHistory ? styles.historyOpen : ''}`}>
        {/* History Panel */}
        {showHistory && (
          <div className={styles.historyPanel}>
            <div className={styles.historyHeader}>
              <h3>Chat History</h3>
              <button onClick={() => setShowHistory(false)} className={styles.closeHistory}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className={styles.historyList}>
              {conversations.length > 0 ? (
                conversations.map((conv) => (
                  <div 
                    key={conv.id}
                    className={`${styles.historyItem} ${currentConversationId === conv.id ? styles.active : ''}`}
                    onClick={() => {
                      loadConversation(conv.id);
                      setShowHistory(false);
                    }}
                  >
                    <div className={styles.historyItemContent}>
                      <div className={styles.historyTitle}>{conv.title}</div>
                      <div className={styles.historyDate}>
                        {conv.updatedAt.toLocaleDateString(langMeta.code, { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                    <button
                      className={styles.deleteConv}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to delete this conversation?')) {
                          deleteConversation(conv.id);
                        }
                      }}
                      aria-label="Delete conversation"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6H21M19 6V20C19 21 18 22 17 22H7C6 22 5 21 5 20V6M8 6V4C8 3 9 2 10 2H14C15 2 16 3 16 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                ))
              ) : (
                <div className={styles.noHistory}>
                  <p>No conversations yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Suggestions Panel */}
        {!messages.length && !showHistory && (
          <div className={styles.suggestionsPanel}>
            <div className={styles.suggestionsHeader}>
              <h3>How can MO help you?</h3>
              <p>Quick examples to get started</p>
            </div>
            <div className={styles.suggestionsGrid}>
              <button className={styles.suggestionChip} onClick={() => send("Analyze my sales")}>
                <div className={styles.suggestionIcon}>📊</div>
                <span>Analyze sales</span>
              </button>
              <button className={styles.suggestionChip} onClick={() => send("Cash flow summary")}>
                <div className={styles.suggestionIcon}>📈</div>
                <span>Cash flow</span>
              </button>
              <button className={styles.suggestionChip} onClick={() => send("Inventory insights")}>
                <div className={styles.suggestionIcon}>📦</div>
                <span>Inventory</span>
              </button>
              <button className={styles.suggestionChip} onClick={() => send("Business health check")}>
                <div className={styles.suggestionIcon}>💡</div>
                <span>Health check</span>
              </button>
            </div>
          </div>
        )}

        {/* Chat Container */}
        <div className={styles.chatContainer} ref={messagesContainerRef}>
          {/* Messages will be rendered here */}
          {messages.map((m, index) => (
            <div key={m.id} className={`${styles.message} ${m.role}`}>
              <div className={styles.avatarContainer}>
                {m.role === 'user' ? (
                  <div className={styles.userAvatar}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                ) : (
                  <div className={styles.botAvatarContainer}>
                    <div className={styles.moAvatarSm}>
                      <MoIcon size={18} />
                    </div>
                  </div>
                )}
              </div>
              <div className={`${styles.bubble} ${m.role === 'user' ? styles.userBubble : styles.botBubble}`}>
                {m.imageUrl && (
                  <div className={styles.imageContainer}>
                    <img src={m.imageUrl} alt="Uploaded" />
                  </div>
                )}
                {m.audioUrl && (
                  <div className={styles.audioContainer}>
                    <audio controls>
                      <source src={m.audioUrl} type="audio/webm" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
                <div className={styles.content}>
                  {m.content.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
                {m.quickActions && (
                  <div className={styles.quickActions}>
                    {m.quickActions.map((action, i) => (
                      <button key={i} onClick={() => send(action.action)}>
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
                {m.metrics && (
                  <div className={styles.metrics}>
                    {m.metrics.map((metric, i) => (
                      <div key={i} className={styles.metric}>
                        <span className={styles.metricLabel}>{metric.label}</span>
                        <span className={styles.metricValue}>{metric.value}</span>
                        {metric.trend && (
                          <span className={styles.metricTrend}>
                            {metric.trend === 'up' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {m.followUpSuggestions && (
                  <div className={styles.followUpSuggestions}>
                    {m.followUpSuggestions.map((suggestion, i) => (
                      <button key={i} onClick={() => send(suggestion)}>
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                {m.expandableSections && (
                  <div className={styles.expandableSections}>
                    {m.expandableSections.map((section, i) => (
                      <div key={section.id} className={styles.expandableSection}>
                        <button 
                          className={styles.expandableHeader}
                          onClick={() => {
                            const newExpandedSections = new Set(expandedSections);
                            if (newExpandedSections.has(section.id)) {
                              newExpandedSections.delete(section.id);
                            } else {
                              newExpandedSections.add(section.id);
                            }
                            setExpandedSections(newExpandedSections);
                          }}
                        >
                          {section.title}
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 18L9 12L15 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        {expandedSections.has(section.id) && (
                          <div className={styles.expandableContent}>
                            {section.content.split('\n').map((line, i) => (
                              <p key={i}>{line}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {m.alerts && (
                  <div className={styles.alerts}>
                    {m.alerts.map((alert, i) => (
                      <div key={i} className={`${styles.alert} ${styles[`alert-${alert.type}`]}`}>
                        {alert.message}
                      </div>
                    ))}
                  </div>
                )}
                {m.saleCard && (
                  <SaleConfirmationCard 
                    items={m.saleCard.items}
                    totalRevenue={m.saleCard.totalRevenue}
                    totalProfit={m.saleCard.totalProfit}
                    timestamp={m.saleCard.timestamp}
                  />
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
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className={styles.loadingText}>{loadingText}</span>   
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={styles.inputContainer}>
          <div className={styles.inputWrapper}>
            <textarea 
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send('');
                }
              }}
            />
            <button 
              className={styles.sendBtn}
              onClick={() => send('')}
              disabled={isSending}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 12L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 2L12 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div className={styles.inputActions}>
            <button 
              className={styles.actionBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L12 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 15L12 12L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button 
              className={styles.actionBtn}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isSending}
            >
              {isRecording ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="6" width="12" height="12" fill="currentColor"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L12 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19 15L12 12L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            <button 
              className={styles.actionBtn}
              onClick={cancelRecording}
              disabled={isSending}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <input 
            type="file" 
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}

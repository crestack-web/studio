'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useTranslation } from './LangContext';
import { MoIcon } from './NavIcons';
import { initializeFirebase } from '@/firebase';
import { getFirestore, collection, query, where, getDocs, Timestamp, doc, getDoc, setDoc, addDoc, deleteDoc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { Lightbulb, BarChart, DollarSign, Package, Heart, Plus, Cpu, Settings } from 'lucide-react';
import styles from './MobileAskMOPage.module.css';
import { useAskMO } from './useAskMO';
import { CreditPurchaseModal } from '@/components/CreditPurchaseModal';
import { MobileBottomNav } from './MobileBottomNav';

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

export function MobileAskMOPage() {
  const { user, showToast, navigateTo } = useApp();
  const { formatMoney } = useCurrency();
  const { t, lang, langMeta } = useTranslation();

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
    loadConversation,
    deleteConversation,
    renameConversation,
    updateCredits,
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
  const [recordingTime, setRecordingTime] = useState(0);
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
  const [loadingStage, setLoadingStage] = useState<number>(0);
  const [loadingActions, setLoadingActions] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false); // Prevent duplicate requests
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Save state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('mo-show-history', showHistory.toString());
  }, [showHistory]);

  useEffect(() => {
    if (currentConversationId) {
      localStorage.setItem('mo-current-conversation-id', currentConversationId);
    } else {
      localStorage.removeItem('mo-current-conversation-id');
    }
  }, [currentConversationId]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('mo-current-messages', JSON.stringify(messages));
    } else {
      localStorage.removeItem('mo-current-messages');
    }
  }, [messages]);

  // Load showHistory from localStorage on mount
  useEffect(() => {
    const savedShowHistory = localStorage.getItem('mo-show-history');
    if (savedShowHistory === 'true') {
      setShowHistory(true);
    }
  }, []);

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
    setMessages([]);
    setInput('');
    setSelectedImage(null);
    setImagePreview(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setCurrentConversationId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

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
    // Prevent duplicate requests
    if (isSending) {
      console.log('Request already in progress, ignoring duplicate');
      return;
    }
    
    const msg = (text ?? input).trim();
    if (!msg && !selectedImage && !audioBlob) return;
    
    setIsSending(true);

    // Check credits: -1 means unlimited (pro plan), 0 or negative means no credits
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
    await new Promise(resolve => setTimeout(resolve, 600));
    setLoadingStage(2);

    // Stage 2: Analyzing Business Data (dynamic rotation)
    const analysisMessages = [
      'Analyzing your business...',
      'Retrieving sales data',
      'Checking inventory levels',
      'Reviewing cash flow',
      'Calculating performance metrics',
    ];
    
    for (let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setLoadingStage(3);

    // Stage 3: Progressive Business Actions
    const actions = [
      '✓ Retrieved sales records',
      '✓ Analyzed inventory data',
      '✓ Calculated profitability',
      '✓ Identified trends',
      '✓ Generating insights...',
    ];
    
    for (const action of actions) {
      await new Promise(resolve => setTimeout(resolve, 350));
      setLoadingActions(prev => [...prev, action]);
    }
    
    setLoadingStage(4);

    try {
      const { firestore } = initializeFirebase();

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

      // Create a placeholder bot message for streaming
      const botMsgId = (Date.now() + 1).toString();
      const botMsg: MOMessage = {
        id: botMsgId,
        role: 'bot',
        content: '',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);

      // Fetch with streaming and timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      const response = await fetch('/api/ask-mo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: finalMessage,
          image: finalImageUrl,
          businessId: user.businessId || user.id,
          userId: user.id,
          conversationHistory: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          userPlan: user.plan || 'starter',
          language: lang,
          languageName: langMeta.name,
        }),
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('MO API error response:', errorData);
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;

              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  fullContent += parsed.text;
                  setMessages(prev => 
                    prev.map(msg => 
                      msg.id === botMsgId 
                        ? { ...msg, content: fullContent }
                        : msg
                    )
                  );
                }
              } catch (e) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      }

      // Update the final message
      setMessages(prev => 
        prev.map(msg => 
          msg.id === botMsgId 
            ? { ...msg, content: fullContent || "I'm analysing your business data..." }
            : msg
        )
      );

      const botMessageData: any = {
        role: 'bot',
        content: fullContent || "I'm analysing your business data...",
        timestamp: Timestamp.now(),
      };
      await setDoc(doc(firestore, 'users', user.id, 'mo_messages', botMsgId), botMessageData);

      // Calculate and consume credits based on response length (simulating token usage)
      // Reduced to make 2500 credits last a week with 10 messages daily (~35 credits per message average)
      const estimatedTokens = Math.ceil((fullContent.length / 4) * 0.7);
      const creditsConsumed = Math.max(5, Math.min(100, estimatedTokens));
      await updateCredits(creditsConsumed);

      // Auto-save conversation
      await saveConversation();
    } catch (error) {
      console.error('MO API error:', error);
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Please check your connection and try again.';
          console.error('Request timeout after 60 seconds');
        } else if (error.message.includes('fetch') || error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
          console.error('Network error:', error);
        } else if (error.message.includes('Google') || error.message.includes('genai') || error.message.includes('API')) {
          // Filter out Google Gen AI specific errors
          errorMessage = 'I apologize, but I encountered an issue processing your request. Please try again.';
          console.error('Google Gen AI error:', error);
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
  }, [input, selectedImage, imagePreview, audioBlob, audioUrl, messages, user, planLimit, creditsUsed, showToast, lang, langMeta]);

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

  function formatContent(content: string) {
    // Split by newlines first
    const lines = content.split('\n');
    
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
                color: 'var(--text-1)',
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
          <div key={lineIndex} style={{ display: 'flex', gap: '8px', marginBottom: '6px', color: 'var(--text-1)' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>•</span>
            <span style={{ lineHeight: '1.6' }}>{formatInlineMarkdown(listContent)}</span>
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
            color: 'var(--text-1)',
            marginBottom: '12px',
            marginTop: '8px'
          }}>
            {formatInlineMarkdown(headerContent)}
          </div>
        );
      }
      
      // Regular paragraph with inline markdown
      return (
        <React.Fragment key={lineIndex}>
          <span style={{ lineHeight: '1.7', display: 'block', marginBottom: lineIndex < lines.length - 1 && lines[lineIndex + 1].trim() ? '0.75rem' : '0', color: 'var(--text-1)' }}>
            {formatInlineMarkdown(line)}
          </span>
        </React.Fragment>
      );
    });
  }
  
  function formatInlineMarkdown(text: string) {
    // Bold with **text**
    let parts = text.split(/\*\*([^*]+)\*\*/g);
    const formatted = parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} style={{ fontWeight: 600, color: 'var(--text-1)' }}>{part}</strong>;
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

  function handleHistory() {
    setShowHistory(!showHistory);
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

  return (
    <div className={styles.container}>
      {/* App Bar */}
      <div className={styles.appBar}>
        <div className={styles.appBarLeft}>
          <button className={styles.backBtn} onClick={() => navigateTo('home')} title="Back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}>
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className={styles.appBarTitle}>
            <div className={styles.moAvatarSm}>
              <MoIcon size={24} />
            </div>
            <div>
              <h3 className={styles.appBarTitleText}>Ask MO</h3>
              <p className={styles.appBarSubtitle}>Your AI Business Assistant</p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className={styles.appBarBtn} onClick={handleNewChat} title="New chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}>
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
          <button className={styles.appBarBtn} onClick={handleHistory} title="Chat history">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}>
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </button>
        </div>
      </div>

      <CreditPurchaseModal 
        isOpen={showCreditPurchase}
        onClose={() => setShowCreditPurchase(false)}
        onSuccess={handlePurchaseSuccess}
      />

      {/* Business Context Header */}
      {businessSummary && messages.length > 0 && (
        <div className={styles.businessContextHeader}>
          <div className={styles.contextItem}>
            <span className={styles.contextIcon}>💰</span>
            <span className={styles.contextValue}>₦{(businessSummary.totalSales || 0).toLocaleString()}</span>
          </div>
          <div className={styles.contextItem}>
            <span className={styles.contextIcon}>📊</span>
            <span className={styles.contextValue}>₦{(businessSummary.totalProfit || 0).toLocaleString()}</span>
          </div>
          <div className={styles.contextItem}>
            <span className={styles.contextIcon}>📦</span>
            <span className={styles.contextValue}>{(businessSummary.totalProducts || 0).toLocaleString()}</span>
          </div>
          <div className={styles.contextItem}>
            <span className={styles.contextIcon}>⚡</span>
            <span className={styles.contextValue}>{creditsRemaining === -1 ? '∞' : creditsRemaining.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className={styles.messages} ref={messagesContainerRef}>
        {messages.length === 0 && (
          <div className={styles.emptyChat}>
            <div className={styles.emptyChatContent}>
              <div className={styles.moAvatarLg}>
                <MoIcon size={48} />
              </div>
              <h3>Hi, I'm Mo</h3>
              {businessSummary ? (
                <div style={{ marginTop: '16px' }}>
                  <p style={{ marginBottom: '12px', fontSize: '14px' }}>Here's your business snapshot:</p>
                  <div className={styles.businessSnapshot}>
                    <div className={styles.snapshotItem}>
                      <span className={styles.snapshotLabel}>Total Sales</span>
                      <span className={styles.snapshotValue}>₦{(businessSummary.totalSales || 0).toLocaleString()}</span>
                    </div>
                    <div className={styles.snapshotItem}>
                      <span className={styles.snapshotLabel}>Total Profit</span>
                      <span className={styles.snapshotValue}>₦{(businessSummary.totalProfit || 0).toLocaleString()}</span>
                    </div>
                    <div className={styles.snapshotItem}>
                      <span className={styles.snapshotLabel}>Products</span>
                      <span className={styles.snapshotValue}>{(businessSummary.totalProducts || 0).toLocaleString()}</span>
                    </div>
                    <div className={styles.snapshotItem}>
                      <span className={styles.snapshotLabel}>Low Stock</span>
                      <span className={styles.snapshotValue} style={{ color: 'var(--red)' }}>{(businessSummary.lowStockProducts || []).length}</span>
                    </div>
                  </div>
                  
                  {/* Business Insight Cards */}
                  <div className={styles.insightCards}>
                    <div className={styles.insightCard}>
                      <div className={styles.insightCardHeader}>
                        <span className={styles.insightCardIcon}>🏆</span>
                        <span className={styles.insightCardTitle}>Top Products</span>
                      </div>
                      <div className={styles.insightCardContent}>
                        {(businessSummary.topProducts || []).slice(0, 3).map((product: any, idx: number) => (
                          <div key={idx} className={styles.insightCardItem}>
                            <span className={styles.insightCardItemName}>{product.name}</span>
                            <span className={styles.insightCardItemValue}>₦{(product.sales || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className={styles.insightCard}>
                      <div className={styles.insightCardHeader}>
                        <span className={styles.insightCardIcon}>💵</span>
                        <span className={styles.insightCardTitle}>Cash Flow</span>
                      </div>
                      <div className={styles.insightCardContent}>
                        <div className={styles.insightCardItem}>
                          <span className={styles.insightCardItemName}>This Month</span>
                          <span className={styles.insightCardItemValue}>₦{(businessSummary.monthlyCashFlow || 0).toLocaleString()}</span>
                        </div>
                        <div className={styles.insightCardItem}>
                          <span className={styles.insightCardItemName}>Runway</span>
                          <span className={styles.insightCardItemValue}>{businessSummary.cashRunway || 'N/A'} days</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={styles.insightCard}>
                      <div className={styles.insightCardHeader}>
                        <span className={styles.insightCardIcon}>📦</span>
                        <span className={styles.insightCardTitle}>Inventory Health</span>
                      </div>
                      <div className={styles.insightCardContent}>
                        <div className={styles.insightCardItem}>
                          <span className={styles.insightCardItemName}>Total Stock</span>
                          <span className={styles.insightCardItemValue}>{(businessSummary.totalStock || 0).toLocaleString()}</span>
                        </div>
                        <div className={styles.insightCardItem}>
                          <span className={styles.insightCardItemName}>Low Stock Items</span>
                          <span className={styles.insightCardItemValue} style={{ color: 'var(--red)' }}>{(businessSummary.lowStockProducts || []).length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p style={{ marginTop: '12px', fontSize: '14px' }}>Ask me about your sales, cash flow, inventory, or any business questions!</p>
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
                </div>
              ) : (
                <p>Your AI business assistant. I can help you understand your sales, cash flow, inventory, customer trends, and overall business performance. What would you like to explore today?</p>
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
              <div className={styles.msgText}>
                {formatContent(m.content)}
              </div>
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
              {m.role === 'bot' && (
                <div className={styles.followUpSuggestions}>
                  <span className={styles.followUpLabel}>Explore:</span>
                  {m.followUpSuggestions && m.followUpSuggestions.length > 0 ? (
                    m.followUpSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        className={styles.followUpSuggestion}
                        onClick={() => send(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))
                  ) : (
                    <>
                      <button
                        className={styles.followUpSuggestion}
                        onClick={() => send('Tell me more about this')}
                      >
                        Tell me more
                      </button>
                      <button
                        className={styles.followUpSuggestion}
                        onClick={() => send('What should I focus on next?')}
                      >
                        What should I focus on next?
                      </button>
                      <button
                        className={styles.followUpSuggestion}
                        onClick={() => send('Show me the data')}
                      >
                        Show me the data
                      </button>
                    </>
                  )}
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
              {loadingStage === 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu size={20} className={styles.loadingIcon} />
                  <span>Analyzing your request...</span>
                </div>
              )}
              {loadingStage === 2 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lightbulb size={20} className={styles.loadingIcon} />
                  <span>Reviewing business data...</span>
                </div>
              )}
              {loadingStage === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Settings size={20} className={styles.loadingIcon} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Processing business data</span>
                  </div>
                  {loadingActions.map((action, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-2)', paddingLeft: '28px' }}>
                      <span style={{ color: 'var(--green)', fontWeight: 600 }}>✓</span>
                      <span>{action.replace('✓ ', '')}</span>
                    </div>
                  ))}
                </div>
              )}
              {loadingStage === 4 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>✨</span>
                  <span>Generating insights...</span>
                </div>
              )}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Conversation History Modal */}
      {showHistory && (
        <div className={styles.historyOverlay} onClick={() => setShowHistory(false)}>
          <div className={styles.historyModal} onClick={e => e.stopPropagation()}>
            <div className={styles.historyHeader}>
              <h3 className={styles.historyTitle}>Conversations</h3>
              <button className={styles.closeHistoryBtn} onClick={() => setShowHistory(false)}>
                ✕
              </button>
            </div>
            <div className={styles.historyList}>
              {conversations.length === 0 ? (
                <div className={styles.historyEmpty}>
                  <p>No conversations yet</p>
                </div>
              ) : (
                conversations.map(conv => (
                  <button
                    key={conv.id}
                    className={`${styles.historyItem} ${currentConversationId === conv.id ? styles.historyItemActive : ''}`}
                    onClick={() => loadConversation(conv.id)}
                  >
                    <div className={styles.historyItemContent}>
                      <div className={styles.historyItemTitle}>{conv.title}</div>
                      <div className={styles.historyItemDate}>
                        {conv.updatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <button
                      className={styles.historyItemDelete}
                      onClick={e => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                    >
                      🗑
                    </button>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
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
            style={{ display: 'none' }}
            onChange={handleImageSelect}
          />
          <button
            className={styles.micBtn}
            onClick={isRecording ? stopRecording : startRecording}
            title={isRecording ? "Stop recording" : "Record voice"}
            style={{ background: isRecording ? 'var(--red)' : 'var(--bg-2)', color: isRecording ? 'var(--white)' : 'var(--text-2)' }}
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
            placeholder={isRecording ? "Recording..." : "Ask MO anything about your business..."}
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
            disabled={!input.trim() && !selectedImage && !audioBlob}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

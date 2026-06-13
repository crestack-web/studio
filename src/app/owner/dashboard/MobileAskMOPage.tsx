'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useTranslation } from './LangContext';
import { MoIcon } from './NavIcons';
import { initializeFirebase } from '@/firebase';
import { getFirestore, collection, query, where, getDocs, Timestamp, doc, getDoc, setDoc, addDoc, deleteDoc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { Lightbulb, BarChart, DollarSign, Package, Heart } from 'lucide-react';
import styles from './MobileAskMOPage.module.css';
import { useAskMO } from './useAskMO';

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

  // Load persisted state from localStorage on mount
  useEffect(() => {
    const savedShowHistory = localStorage.getItem('mo-show-history');
    const savedConversationId = localStorage.getItem('mo-current-conversation-id');
    const savedMessages = localStorage.getItem('mo-current-messages');
    
    if (savedShowHistory === 'true') {
      setShowHistory(true);
    }
    if (savedConversationId) {
      setCurrentConversationId(savedConversationId);
    }
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error('Failed to load saved messages');
      }
    }
  }, [setCurrentConversationId, setMessages]);

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
    return "Voice message (transcription not available)";
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
        }),
      });

      const data = await response.json();

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

      setMessages(prev => [...prev, botMsg]);

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

      // Calculate and consume credits based on response length (simulating token usage)
      const estimatedTokens = Math.ceil((botMsg.content.length / 4) * 1.5);
      const creditsConsumed = Math.max(10, Math.min(500, estimatedTokens));
      await updateCredits(creditsConsumed);

      // Auto-save conversation
      await saveConversation();
    } catch (error) {
      console.error('MO API error:', error);
      const botMsg: MOMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
      setIsStreaming(false);
      setStreamedContent('');
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

  // Prevent mobile page from showing on desktop breakpoint
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
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
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.moAvatar}>
            <MoIcon size={28} />
          </div>
          <div className={styles.headerInfo}>
            <h3 className={styles.headerTitle}>Ask MO</h3>
            <div className={styles.tokenCounter}>
              <img
                src="https://res.cloudinary.com/dzjoqbg2u/image/upload/q_auto/f_auto/v1781081246/Untitled_design_1_aphwas.png"
                alt="Token"
                width={14}
                height={14}
                style={{ borderRadius: '50%' }}
              />
              <span>{creditsRemaining === -1 ? 'Unlimited' : creditsRemaining.toLocaleString()} Credits</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className={styles.newChatBtn} onClick={handleNewChat} title="New chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}>
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
          <button className={styles.historyBtn} onClick={handleHistory} title="Chat history">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}>
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messages} ref={messagesContainerRef}>
        {messages.length === 0 && (
          <div className={styles.emptyChat}>
            <div className={styles.emptyChatContent}>
              <div className={styles.moAvatarLg}>
                <MoIcon size={48} />
              </div>
              <h3>Hi, I'm Mo</h3>
              <p>Your AI business assistant. I can help you understand your sales, cash flow, inventory, customer trends, and overall business performance. What would you like to explore today?</p>
            </div>
          </div>
        )}

        {messages.map(m => (
          <div
            key={m.id}
            className={`${styles.message} ${m.role === 'user' ? styles.user : styles.bot}`}
          >
            {m.role === 'bot' && (
              <div className={styles.botHeader}>
                <div className={styles.moAvatarSm}>
                  <MoIcon size={18} />
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
            <div className={styles.moAvatarSm}>
              <MoIcon size={18} />
            </div>
            <div className={`${styles.bubble} ${styles.botBubble}`}>
              <div className={styles.typingIndicator}>
                <span></span>
                <span></span>
                <span></span>
              </div>
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
            style={{ background: isRecording ? 'var(--red)' : 'var(--bg-2)', color: isRecording ? '#fff' : 'var(--text-2)' }}
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
        {planLimit !== -1 && (
          <div className={styles.planLimit}>
            {creditsRemaining === -1 ? 'Unlimited' : creditsRemaining.toLocaleString()} credits remaining
          </div>
        )}
      </div>
    </div>
  );
}

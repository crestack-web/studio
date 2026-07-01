'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from './AppContext';
import { useAskMO } from './useAskMO';
import { MoIcon } from './NavIcons';
import { Trash2, Pencil, MessageSquare, Plus } from 'lucide-react';
import styles from './ConversationHistoryPage.module.css';

export function ConversationHistoryPage() {
  const { user, showToast, navigateTo, theme } = useApp();
  const {
    conversations,
    currentConversationId,
    loadConversation,
    deleteConversation,
    renameConversation,
    messages,
    setMessages,
    setCurrentConversationId,
    creditsRemaining,
  } = useAskMO({
    userId: user.id,
    userPlan: user.plan,
    businessId: user.businessId,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConversationClick = async (conversationId: string) => {
    await loadConversation(conversationId);
    setSelectedConversationId(conversationId);
  };

  const handleBackToList = () => {
    setSelectedConversationId(null);
  };

  const handleBackToChat = () => {
    setSelectedConversationId(null);
    navigateTo('mo');
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setSelectedConversationId(null);
    navigateTo('mo');
  };

  const handleDelete = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (confirm('Delete this conversation?')) {
      await deleteConversation(conversationId);
      showToast('Conversation deleted');
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
      }
    }
  };

  const handleRename = async (e: React.MouseEvent, conversationId: string, currentTitle: string) => {
    e.stopPropagation();
    const newTitle = prompt('Rename conversation:', currentTitle);
    if (newTitle && newTitle.trim()) {
      await renameConversation(conversationId, newTitle.trim());
      showToast('Conversation renamed');
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Show chat view when a conversation is selected
  if (selectedConversationId && messages.length > 0) {
    const conversation = conversations.find(c => c.id === selectedConversationId);
    
    return (
      <div className={styles.chatView} data-theme={theme}>
        <div className={styles.chatHeader}>
          <button className={styles.backButton} onClick={handleBackToList} title="Back to conversations">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}>
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <button className={styles.homeButton} onClick={handleBackToChat} title="Back to Ask MO">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18 }}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </button>
          <div className={styles.moAvatar}>
            <MoIcon size={20} />
          </div>
          <div className={styles.chatHeaderText}>
            <h3 className={styles.chatTitle}>{conversation?.title || 'Conversation'}</h3>
            <p className={styles.chatSubtitle}>
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
              {conversation?.branchName && ` • ${conversation.branchName}`}
            </p>
          </div>
        </div>

        <div className={styles.chatMessages}>
          {messages.map(m => (
            <div
              key={m.id}
              className={`${styles.chatMessage} ${m.role === 'user' ? styles.userMessage : styles.botMessage}`}
            >
              {m.role === 'bot' && (
                <div className={styles.botAvatar}>
                  <MoIcon size={16} />
                </div>
              )}
              <div className={`${styles.chatBubble} ${m.role === 'user' ? styles.userBubble : styles.botBubble}`}>
                <div className={styles.messageContent}>
                  {m.content}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    );
  }

  // Show conversation list by default
  return (
    <div className={styles.container} data-theme={theme}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.moAvatar}>
            <MoIcon size={24} />
          </div>
          <div>
            <h1 className={styles.title}>Conversation History</h1>
            <p className={styles.subtitle}>
              {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
            </p>
          </div>
        </div>
        <button className={styles.newChatBtn} onClick={handleNewChat}>
          <Plus size={20} />
          <span>New Chat</span>
        </button>
      </div>

      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.conversationList}>
        {filteredConversations.length === 0 ? (
          <div className={styles.emptyState}>
            <MessageSquare size={48} />
            <h3>No conversations yet</h3>
            <p>Start a chat with MO to see your conversation history here.</p>
            <button className={styles.startChatBtn} onClick={handleNewChat}>
              Start Your First Chat
            </button>
          </div>
        ) : (
          filteredConversations.map(conv => (
            <div
              key={conv.id}
              className={`${styles.conversationItem} ${currentConversationId === conv.id ? styles.active : ''}`}
              onClick={() => handleConversationClick(conv.id)}
            >
              <div className={styles.conversationContent}>
                <div className={styles.conversationHeader}>
                  <h3 className={styles.conversationTitle}>{conv.title}</h3>
                  <div className={styles.conversationActions}>
                    <button
                      className={styles.actionBtn}
                      onClick={(e) => handleRename(e, conv.id, conv.title)}
                      title="Rename"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={(e) => handleDelete(e, conv.id)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className={styles.conversationMeta}>
                  <span>{conv.branchName || 'Main Branch'}</span>
                  <span>•</span>
                  <span>{conv.messageCount || 0} messages</span>
                  <span>•</span>
                  <span>{conv.updatedAt.toLocaleDateString()}</span>
                </div>
                {conv.preview && (
                  <p className={styles.conversationPreview}>{conv.preview}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
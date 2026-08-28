'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styles from './ChatPanel.module.css';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
  initials: string;
  online: boolean;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'owner' | 'staff';
  text: string;
  timestamp: number;
  imageUrl?: string;
  audioUrl?: string;
  reactions?: Array<{ emoji: string; userId: string }>;
  read?: boolean;
  readAt?: number;
}

interface ChatPanelProps {
  staffMembers: StaffMember[];
  conversations: { [key: string]: { id: string; messages: ChatMessage[] } };
  setConversations: React.Dispatch<
    React.SetStateAction<{ [key: string]: { id: string; messages: ChatMessage[] } }>
  >;
  initialSelectedChat?: string;
  businessId?: string | null;
  ownerId?: string | null;
  ownerName?: string;
}

function formatTime(ts: number) {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatListTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return formatTime(ts);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function dayKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const yday = new Date();
  yday.setDate(today.getDate() - 1);
  if (dayKey(ts) === dayKey(today.getTime())) return 'Today';
  if (dayKey(ts) === dayKey(yday.getTime())) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export function ChatPanel({
  staffMembers,
  conversations,
  setConversations,
  initialSelectedChat,
  businessId,
  ownerId,
  ownerName = 'Owner',
}: ChatPanelProps) {
  const [selectedChat, setSelectedChat] = useState(initialSelectedChat || 'team');
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [listQuery, setListQuery] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialSelectedChat) {
      setSelectedChat(initialSelectedChat);
      setMobileChatOpen(true);
    }
  }, [initialSelectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, selectedChat]);

  const ensureConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        if (prev[id]) return prev;
        return { ...prev, [id]: { id, messages: [] } };
      });
    },
    [setConversations]
  );

  const openChat = (id: string) => {
    ensureConversation(id);
    setSelectedChat(id);
    setMobileChatOpen(true);
    setSendError(null);
  };

  const currentMessages = conversations[selectedChat]?.messages || [];

  const selectedMeta = useMemo(() => {
    if (selectedChat === 'team') {
      const online = staffMembers.filter((s) => s.online).length;
      return {
        name: 'Team channel',
        sub: online > 0 ? `${online} online · Everyone` : 'Everyone on your team',
        initials: '👥',
        color: 'linear-gradient(135deg, #6B3FE7, #8B5CF6)',
        online: online > 0,
      };
    }
    const m = staffMembers.find((s) => s.id === selectedChat);
    return {
      name: m?.name || 'Staff',
      sub: m?.online ? `${m.role || 'Staff'} · Online` : m?.role || 'Staff',
      initials: m?.initials || 'ST',
      color: m?.avatarColor || '#6B3FE7',
      online: !!m?.online,
    };
  }, [selectedChat, staffMembers]);

  const threads = useMemo(() => {
    const teamMsgs = conversations.team?.messages || [];
    const teamLast = teamMsgs[teamMsgs.length - 1];
    const items: Array<{
      id: string;
      name: string;
      initials: string;
      color: string;
      online: boolean;
      preview: string;
      time: number;
      unread: number;
      isTeam?: boolean;
    }> = [
      {
        id: 'team',
        name: 'Team channel',
        initials: '👥',
        color: 'linear-gradient(135deg, #6B3FE7, #8B5CF6)',
        online: staffMembers.some((s) => s.online),
        preview: teamLast?.text || 'Broadcast to every staff member',
        time: teamLast?.timestamp || 0,
        unread: 0,
        isTeam: true,
      },
    ];

    const q = listQuery.trim().toLowerCase();
    for (const m of staffMembers) {
      if (q && !m.name.toLowerCase().includes(q) && !m.role.toLowerCase().includes(q)) {
        continue;
      }
      const msgs = conversations[m.id]?.messages || [];
      const last = msgs[msgs.length - 1];
      items.push({
        id: m.id,
        name: m.name,
        initials: m.initials,
        color: m.avatarColor,
        online: m.online,
        preview: last?.text || 'No messages yet — say hello',
        time: last?.timestamp || 0,
        unread: 0,
      });
    }

    // Sort DMs by latest activity (team stays first)
    const team = items[0];
    const rest = items.slice(1).sort((a, b) => (b.time || 0) - (a.time || 0));
    return [team, ...rest];
  }, [staffMembers, conversations, listQuery]);

  const sendMessage = useCallback(async () => {
    const text = messageInput.trim();
    if (!text || sending) return;
    if (!businessId) {
      setSendError('Business not loaded. Refresh and try again.');
      return;
    }

    const newMessage: ChatMessage = {
      id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      senderId: ownerId || 'owner',
      senderName: ownerName || 'Owner',
      senderType: 'owner',
      text,
      timestamp: Date.now(),
    };

    // Optimistic UI
    setConversations((prev) => {
      const existing = prev[selectedChat] || { id: selectedChat, messages: [] };
      return {
        ...prev,
        [selectedChat]: {
          ...existing,
          messages: [...existing.messages, newMessage],
        },
      };
    });
    setMessageInput('');
    setSendError(null);
    setSending(true);

    try {
      const { appendConversationMessage } = await import('@/lib/teamChat');
      await appendConversationMessage(businessId, {
        conversationKey: selectedChat === 'team' ? 'team' : selectedChat,
        message: {
          id: newMessage.id,
          senderId: newMessage.senderId,
          senderName: newMessage.senderName,
          senderType: 'owner',
          text: newMessage.text,
          timestamp: newMessage.timestamp,
        },
        staffIdForDm: selectedChat === 'team' ? undefined : selectedChat,
      });
    } catch (e: any) {
      console.error('[ChatPanel] send failed', e);
      setSendError(e?.message || 'Message failed to send. Check connection.');
    } finally {
      setSending(false);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [
    messageInput,
    sending,
    businessId,
    ownerId,
    ownerName,
    selectedChat,
    setConversations,
  ]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const renderMessages = () => {
    if (!currentMessages.length) {
      return (
        <div className={styles.emptyThread}>
          <div className={styles.emptyIcon}>💬</div>
          <p className={styles.emptyTitle}>
            {selectedChat === 'team' ? 'Start a team update' : `Message ${selectedMeta.name}`}
          </p>
          <p className={styles.emptyHint}>
            {selectedChat === 'team'
              ? 'Everyone on staff will see messages here.'
              : 'Direct messages stay between you and this staff member.'}
          </p>
        </div>
      );
    }

    let lastDay = '';
    return currentMessages.map((msg) => {
      const day = dayKey(msg.timestamp);
      const showDay = day !== lastDay;
      lastDay = day;
      const mine = msg.senderType === 'owner';
      return (
        <React.Fragment key={msg.id}>
          {showDay && <div className={styles.dayChip}>{dayLabel(msg.timestamp)}</div>}
          <div className={`${styles.bubbleRow} ${mine ? styles.mine : styles.theirs}`}>
            {!mine && (
              <div
                className={styles.msgAvatar}
                style={{
                  background:
                    staffMembers.find((s) => s.id === msg.senderId)?.avatarColor ||
                    '#94a3b8',
                }}
              >
                {(msg.senderName || 'S').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className={`${styles.bubble} ${mine ? styles.bubbleMine : styles.bubbleTheirs}`}>
              {!mine && selectedChat === 'team' && (
                <div className={styles.bubbleName}>{msg.senderName}</div>
              )}
              <div className={styles.bubbleText}>{msg.text}</div>
              <div className={styles.bubbleMeta}>{formatTime(msg.timestamp)}</div>
            </div>
          </div>
        </React.Fragment>
      );
    });
  };

  return (
    <div className={styles.shell}>
      {/* Sidebar / conversation list */}
      <aside className={`${styles.sidebar} ${mobileChatOpen ? styles.sidebarHiddenMobile : ''}`}>
        <div className={styles.sideHeader}>
          <div>
            <h3 className={styles.sideTitle}>Team chat</h3>
            <p className={styles.sideSub}>Owner ↔ staff in real time</p>
          </div>
        </div>

        <div className={styles.searchWrap}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            className={styles.searchInput}
            placeholder="Search staff…"
            value={listQuery}
            onChange={(e) => setListQuery(e.target.value)}
          />
        </div>

        <div className={styles.threadList}>
          {threads.map((th) => {
            const active = selectedChat === th.id;
            return (
              <button
                key={th.id}
                type="button"
                className={`${styles.threadItem} ${active ? styles.threadActive : ''} ${
                  th.isTeam ? styles.threadTeam : ''
                }`}
                onClick={() => openChat(th.id)}
              >
                <div
                  className={styles.threadAvatar}
                  style={{ background: th.color }}
                >
                  {th.initials}
                  {th.online && th.id !== 'team' && <span className={styles.onlineDot} />}
                </div>
                <div className={styles.threadBody}>
                  <div className={styles.threadTop}>
                    <span className={styles.threadName}>{th.name}</span>
                    {th.time > 0 && (
                      <span className={styles.threadTime}>{formatListTime(th.time)}</span>
                    )}
                  </div>
                  <div className={styles.threadPreview}>{th.preview}</div>
                </div>
              </button>
            );
          })}
          {staffMembers.length === 0 && (
            <div className={styles.noStaff}>
              Add staff members to start direct chats. Team channel still works for broadcasts.
            </div>
          )}
        </div>
      </aside>

      {/* Main thread */}
      <section className={`${styles.main} ${mobileChatOpen ? styles.mainOpenMobile : ''}`}>
        <header className={styles.chatHeader}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => setMobileChatOpen(false)}
            aria-label="Back to conversations"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div
            className={styles.headerAvatar}
            style={{ background: selectedMeta.color }}
          >
            {selectedMeta.initials}
            {selectedMeta.online && selectedChat !== 'team' && (
              <span className={styles.onlineDot} />
            )}
          </div>
          <div className={styles.headerInfo}>
            <p className={styles.headerName}>{selectedMeta.name}</p>
            <p className={styles.headerSub}>{selectedMeta.sub}</p>
          </div>
        </header>

        <div className={styles.messages}>
          {renderMessages()}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.composer}>
          {sendError && <div className={styles.sendError}>{sendError}</div>}
          <div className={styles.composerRow}>
            <textarea
              ref={textareaRef}
              className={styles.composerInput}
              placeholder={
                selectedChat === 'team'
                  ? 'Message the whole team…'
                  : `Message ${selectedMeta.name}…`
              }
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              disabled={sending}
            />
            <button
              type="button"
              className={styles.sendBtn}
              onClick={() => void sendMessage()}
              disabled={sending || !messageInput.trim()}
              aria-label="Send message"
            >
              {sending ? (
                <span className={styles.sendSpinner} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </button>
          </div>
          <p className={styles.composerHint}>Enter to send · Shift+Enter for new line</p>
        </div>
      </section>
    </div>
  );
}

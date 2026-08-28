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

const COMMON_EMOJIS = ['😀', '😂', '👍', '👎', '❤️', '🎉', '🔥', '💯', '🙏', '👋', '✅', '❗', '😊', '🤝', '💪', '👏'];

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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [listQuery, setListQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

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
    setShowEmojiPicker(false);
  };

  const sendMessage = useCallback(async () => {
    const text = messageInput.trim();
    if (!text && !imagePreview && !audioUrl) return;

    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      senderId: 'owner',
      senderName: 'You',
      senderType: 'owner',
      text: text || (imagePreview ? '📷 Photo' : audioUrl ? '🎤 Voice note' : ''),
      timestamp: Date.now(),
      imageUrl: imagePreview || undefined,
      audioUrl: audioUrl || undefined,
      read: false,
    };

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

    try {
      window.dispatchEvent(
        new CustomEvent('owner-chat-message', {
          detail: { conversationId: selectedChat, message: newMessage },
        })
      );
    } catch {
      /* ignore */
    }

    // Persist so staff portal receives the message
    if (businessId) {
      try {
        const { appendConversationMessage } = await import('@/lib/teamChat');
        await appendConversationMessage(businessId, {
          conversationKey: selectedChat,
          message: {
            id: newMessage.id,
            senderId: ownerId || 'owner',
            senderName: ownerName || 'Owner',
            senderType: 'owner',
            text: newMessage.text,
            timestamp: newMessage.timestamp,
            imageUrl: newMessage.imageUrl,
            audioUrl: newMessage.audioUrl,
          },
          staffIdForDm: selectedChat === 'team' ? undefined : selectedChat,
        });
      } catch (persistErr) {
        console.error('[ChatPanel] persist message failed', persistErr);
      }
    }

    setMessageInput('');
    setSelectedImage(null);
    setImagePreview(null);
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }
  }, [messageInput, imagePreview, audioUrl, selectedChat, setConversations, businessId, ownerId, ownerName]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (err) {
      console.error('Mic access failed', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const autoGrow = (el: HTMLTextAreaElement) => {
    el.style.height = '40px';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const filteredStaff = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    if (!q) return staffMembers;
    return staffMembers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.role || '').toLowerCase().includes(q)
    );
  }, [staffMembers, listQuery]);

  const messages = conversations[selectedChat]?.messages || [];

  const selectedMeta = useMemo(() => {
    if (selectedChat === 'team') {
      return {
        name: 'Team Chat',
        sub: `${staffMembers.length} member${staffMembers.length === 1 ? '' : 's'}`,
        color: 'var(--teal, #0d9488)',
        initials: '👥',
        online: staffMembers.some((s) => s.online),
      };
    }
    const s = staffMembers.find((m) => m.id === selectedChat);
    return {
      name: s?.name || 'Staff',
      sub: s?.online ? 'Online' : s?.role || 'Staff',
      color: s?.avatarColor || 'var(--purple)',
      initials: s?.initials || 'ST',
      online: !!s?.online,
    };
  }, [selectedChat, staffMembers]);

  const canSend = Boolean(messageInput.trim() || imagePreview || audioUrl);

  const renderMessages = () => {
    if (messages.length === 0) {
      return (
        <div className={styles.emptyMessages}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={40} height={40} style={{ opacity: 0.35 }}>
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <p>No messages yet. Say hello to your team.</p>
        </div>
      );
    }

    let lastDay = '';
    return messages.map((msg) => {
      const dk = dayKey(msg.timestamp);
      const showDay = dk !== lastDay;
      lastDay = dk;
      const isOwn = msg.senderType === 'owner';
      return (
        <React.Fragment key={msg.id}>
          {showDay && <div className={styles.dayDivider}>{dayLabel(msg.timestamp)}</div>}
          <div className={`${styles.msgRow} ${isOwn ? styles.msgRowOwn : styles.msgRowOther}`}>
            {!isOwn && selectedChat === 'team' && (
              <span className={styles.msgSender}>{msg.senderName}</span>
            )}
            <div className={`${styles.bubble} ${isOwn ? styles.bubbleOwn : styles.bubbleOther}`}>
              {msg.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={msg.imageUrl} alt="" className={styles.msgImage} />
              )}
              {msg.audioUrl && (
                <audio controls src={msg.audioUrl} style={{ maxWidth: '100%', marginBottom: 4 }} />
              )}
              {msg.text && !(msg.imageUrl && msg.text === '📷 Photo') && !(msg.audioUrl && msg.text === '🎤 Voice note') && (
                <span>{msg.text}</span>
              )}
            </div>
            <span className={styles.msgTime}>{formatTime(msg.timestamp)}</span>
          </div>
        </React.Fragment>
      );
    });
  };

  const teamLast = conversations.team?.messages?.[conversations.team.messages.length - 1];

  return (
    <div className={`${styles.chatContainer} ${mobileChatOpen ? styles.mobileChatOpen : ''}`}>
      {/* Conversation list */}
      <aside className={styles.sidebar} aria-label="Conversations">
        <div className={styles.sidebarHeader}>
          <h3 className={styles.sidebarTitle}>Messages</h3>
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Search team…"
              value={listQuery}
              onChange={(e) => setListQuery(e.target.value)}
              aria-label="Search conversations"
            />
          </div>
        </div>
        <div className={styles.sidebarContent}>
          <button
            type="button"
            className={`${styles.convoItem} ${selectedChat === 'team' ? styles.convoItemActive : ''}`}
            onClick={() => openChat('team')}
          >
            <div className={styles.avatar} style={{ background: 'var(--teal, #0d9488)' }}>
              👥
            </div>
            <div className={styles.convoMeta}>
              <div className={styles.convoNameRow}>
                <span className={styles.convoName}>Team Chat</span>
                {teamLast && (
                  <span className={styles.convoTime}>{formatListTime(teamLast.timestamp)}</span>
                )}
              </div>
              <div className={styles.convoPreview}>
                {teamLast?.text || 'Group conversation with all staff'}
              </div>
            </div>
          </button>

          {filteredStaff.map((staff) => {
            const last = conversations[staff.id]?.messages?.[conversations[staff.id].messages.length - 1];
            return (
              <button
                key={staff.id}
                type="button"
                className={`${styles.convoItem} ${selectedChat === staff.id ? styles.convoItemActive : ''}`}
                onClick={() => openChat(staff.id)}
              >
                <div className={styles.avatar} style={{ background: staff.avatarColor || 'var(--purple)' }}>
                  {staff.initials}
                  {staff.online && <span className={styles.onlineDot} title="Online" />}
                </div>
                <div className={styles.convoMeta}>
                  <div className={styles.convoNameRow}>
                    <span className={styles.convoName}>{staff.name}</span>
                    {last && (
                      <span className={styles.convoTime}>{formatListTime(last.timestamp)}</span>
                    )}
                  </div>
                  <div className={styles.convoPreview}>{last?.text || staff.role || 'No messages yet'}</div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Chat thread */}
      <section className={styles.chatArea} aria-label="Chat">
        <div className={styles.chatHeader}>
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
          <div className={styles.avatar} style={{ background: selectedMeta.color, width: 40, height: 40, fontSize: '0.8rem' }}>
            {selectedMeta.initials}
            {selectedMeta.online && selectedChat !== 'team' && <span className={styles.onlineDot} />}
          </div>
          <div className={styles.headerInfo}>
            <p className={styles.headerName}>{selectedMeta.name}</p>
            <p className={styles.headerSub}>{selectedMeta.sub}</p>
          </div>
        </div>

        <div className={styles.messagesContainer}>
          {renderMessages()}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputArea}>
          {(imagePreview || audioUrl) && (
            <div className={styles.previewBar}>
              {imagePreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="Preview" className={styles.previewImg} />
              )}
              {audioUrl && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>
                  🎤 Voice note {recordingTime > 0 ? `(${recordingTime}s)` : ''}
                </span>
              )}
              <button
                type="button"
                className={styles.previewClear}
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                  setAudioBlob(null);
                  if (audioUrl) URL.revokeObjectURL(audioUrl);
                  setAudioUrl(null);
                }}
                aria-label="Remove attachment"
              >
                ✕
              </button>
            </div>
          )}

          <div className={styles.composerWrap}>
            {showEmojiPicker && (
              <div className={styles.emojiPicker} role="listbox" aria-label="Emojis">
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={styles.emojiBtn}
                    onClick={() => {
                      setMessageInput((v) => v + emoji);
                      setShowEmojiPicker(false);
                      textareaRef.current?.focus();
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            <div className={styles.composer}>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => setShowEmojiPicker((v) => !v)}
                aria-label="Emoji"
              >
                😊
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach image"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageSelect}
              />
              <textarea
                ref={textareaRef}
                className={styles.composerInput}
                placeholder={selectedChat === 'team' ? 'Message the team…' : 'Type a message…'}
                value={messageInput}
                onChange={(e) => {
                  setMessageInput(e.target.value);
                  autoGrow(e.target);
                }}
                onKeyDown={handleKey}
                rows={1}
              />
              <button
                type="button"
                className={`${styles.iconBtn} ${isRecording ? styles.iconBtnActive : ''}`}
                onClick={isRecording ? stopRecording : startRecording}
                aria-label={isRecording ? 'Stop recording' : 'Record voice note'}
              >
                {isRecording ? '⏹' : '🎤'}
              </button>
              <button
                type="button"
                className={styles.sendBtn}
                onClick={sendMessage}
                disabled={!canSend}
                aria-label="Send message"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

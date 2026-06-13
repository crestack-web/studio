'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

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
  setConversations: React.Dispatch<React.SetStateAction<{ [key: string]: { id: string; messages: ChatMessage[] } }>>;
  initialSelectedChat?: string;
}

export function ChatPanel({ staffMembers, conversations, setConversations, initialSelectedChat }: ChatPanelProps) {
  const [selectedChat, setSelectedChat] = useState<string>(initialSelectedChat || 'team');
  const [messageInput, setMessageInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update selectedChat when initialSelectedChat changes
  useEffect(() => {
    if (initialSelectedChat) {
      setSelectedChat(initialSelectedChat);
    }
  }, [initialSelectedChat]);

  // Common emojis
  const commonEmojis = ['😀', '😂', '👍', '👎', '❤️', '🎉', '🔥', '💯', '🙏', '👋', '🤝', '💪', '✨', '🎯', '🚀'];

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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [conversations, selectedChat]);

  const sendMessage = useCallback(() => {
    if (!messageInput.trim() && !selectedImage && !audioBlob) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'owner',
      senderName: 'Owner',
      senderType: 'owner',
      text: messageInput.trim(),
      timestamp: Date.now(),
      imageUrl: imagePreview || undefined,
      audioUrl: audioUrl || undefined,
      read: false,
    };

    setConversations((prev) => ({
      ...prev,
      [selectedChat]: {
        ...prev[selectedChat],
        messages: [...prev[selectedChat].messages, newMessage],
      },
    }));

    setMessageInput('');
    setSelectedImage(null);
    setImagePreview(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setShowEmojiPicker(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    window.dispatchEvent(new CustomEvent('owner-chat-message', {
      detail: {
        conversationId: selectedChat,
        message: newMessage,
      },
    }));
  }, [messageInput, selectedImage, imagePreview, audioBlob, audioUrl, selectedChat, setConversations]);

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

  const addReaction = (messageId: string, emoji: string) => {
    setConversations((prev) => ({
      ...prev,
      [selectedChat]: {
        ...prev[selectedChat],
        messages: prev[selectedChat].messages.map((msg) => {
          if (msg.id === messageId) {
            const existingReaction = msg.reactions?.find(r => r.emoji === emoji && r.userId === 'owner');
            if (existingReaction) {
              return {
                ...msg,
                reactions: msg.reactions?.filter(r => !(r.emoji === emoji && r.userId === 'owner')),
              };
            }
            return {
              ...msg,
              reactions: [...(msg.reactions || []), { emoji, userId: 'owner' }],
            };
          }
          return msg;
        }),
      },
    }));
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSelectedConversation = () => {
    return conversations[selectedChat];
  };

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      height: 'calc(100vh - 250px)',
      minHeight: '500px',
    }}>
      {/* Conversations Sidebar */}
      <div style={{
        width: '280px',
        flexShrink: 0,
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px',
          borderBottom: '1px solid var(--border)',
        }}>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.9rem',
            fontWeight: 700,
            color: 'var(--text-1)',
            margin: 0,
          }}>Conversations</h3>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Team Chat */}
          <button
            onClick={() => setSelectedChat('team')}
            style={{
              width: '100%',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: selectedChat === 'team' ? 'var(--purple-lt)' : 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'background 0.2s',
              textAlign: 'left',
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}>
              👥
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '2px' }}>
                Team Chat
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>
                {staffMembers.length + 1} members
              </div>
            </div>
          </button>

          {/* Individual Staff Chats */}
          {staffMembers.map((staff) => {
            const conv = conversations[staff.id];
            const lastMessage = conv?.messages[conv?.messages.length - 1];
            return (
              <button
                key={staff.id}
                onClick={() => setSelectedChat(staff.id)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: selectedChat === staff.id ? 'var(--purple-lt)' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  textAlign: 'left',
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: staff.avatarColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  position: 'relative',
                }}>
                  {staff.initials}
                  {staff.online && (
                    <div style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#22c55e',
                      border: '2px solid var(--surface)',
                    }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '2px' }}>
                    {staff.name}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-3)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {lastMessage ? lastMessage.text : 'No messages yet'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{
        flex: 1,
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {getSelectedConversation() ? (
          <>
            {/* Chat Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: selectedChat === 'team' ? 'var(--teal)' : staffMembers.find((s) => s.id === selectedChat)?.avatarColor || 'var(--purple)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}>
                {selectedChat === 'team' ? '👥' : staffMembers.find((s) => s.id === selectedChat)?.initials || 'ST'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                  {selectedChat === 'team' ? 'Team Chat' : staffMembers.find((s) => s.id === selectedChat)?.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>
                  {selectedChat === 'team' ? `${staffMembers.length} staff members` : staffMembers.find((s) => s.id === selectedChat)?.role}
                  {typingUsers.size > 0 && ' • typing...'}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                background: 'var(--bg)',
                scrollBehavior: 'smooth',
              }}
            >
              {getSelectedConversation().messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: msg.senderType === 'owner' ? 'flex-end' : 'flex-start',
                    gap: '8px',
                  }}
                >
                  <div style={{
                    maxWidth: '70%',
                    display: 'flex',
                    flexDirection: msg.senderType === 'owner' ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                    gap: '8px',
                  }}>
                    {msg.senderType !== 'owner' && selectedChat === 'team' && (
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: staffMembers.find(s => s.id === msg.senderId)?.avatarColor || 'var(--purple)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        flexShrink: 0,
                      }}>
                        {staffMembers.find(s => s.id === msg.senderId)?.initials || 'ST'}
                      </div>
                    )}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      alignItems: msg.senderType === 'owner' ? 'flex-end' : 'flex-start',
                    }}>
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: msg.senderType === 'owner' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: msg.senderType === 'owner' ? 'var(--purple)' : 'var(--surface)',
                        color: msg.senderType === 'owner' ? '#fff' : 'var(--text-1)',
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        wordBreak: 'break-word',
                      }}>
                        {msg.senderType !== 'owner' && selectedChat === 'team' && (
                          <div style={{ fontSize: '0.7rem', fontWeight: 600, marginBottom: '4px', opacity: 0.8 }}>
                            {msg.senderName}
                          </div>
                        )}
                        {msg.text}
                        {msg.imageUrl && (
                          <img
                            src={msg.imageUrl}
                            alt="Shared image"
                            style={{
                              maxWidth: '200px',
                              borderRadius: '8px',
                              marginTop: '8px',
                              display: 'block',
                            }}
                          />
                        )}
                        {msg.audioUrl && (
                          <audio
                            src={msg.audioUrl}
                            controls
                            style={{
                              width: '100%',
                              maxWidth: '250px',
                              marginTop: '8px',
                            }}
                          />
                        )}
                        <div style={{
                          fontSize: '0.65rem',
                          opacity: 0.7,
                          marginTop: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          justifyContent: msg.senderType === 'owner' ? 'flex-end' : 'flex-start',
                        }}>
                          {formatTime(msg.timestamp)}
                          {msg.senderType === 'owner' && msg.read && (
                            <span style={{ color: msg.senderType === 'owner' ? '#fff' : 'var(--text-3)' }}>
                              ✓✓
                            </span>
                          )}
                        </div>
                      </div>
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div style={{
                          display: 'flex',
                          gap: '4px',
                          flexWrap: 'wrap',
                        }}>
                          {msg.reactions.map((reaction, idx) => (
                            <button
                              key={idx}
                              onClick={() => addReaction(msg.id, reaction.emoji)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                background: reaction.userId === 'owner' ? 'var(--purple-lt)' : 'var(--bg)',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                            >
                              {reaction.emoji} {reaction.userId === 'owner' ? '1' : ''}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{
              padding: '16px 20px 24px 20px',
              borderTop: '1px solid var(--border)',
              background: 'var(--surface)',
            }}>
              {imagePreview && (
                <div style={{
                  position: 'relative',
                  display: 'inline-block',
                  marginBottom: '12px',
                }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      maxWidth: '100px',
                      maxHeight: '100px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                    }}
                  />
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                    }}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: 'none',
                      background: 'var(--red)',
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
              {audioUrl && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                  padding: '8px',
                  background: 'var(--bg)',
                  borderRadius: '8px',
                }}>
                  <audio
                    src={audioUrl}
                    controls
                    style={{ flex: 1, maxWidth: '200px' }}
                  />
                  <button
                    onClick={() => {
                      setAudioBlob(null);
                      setAudioUrl(null);
                      setRecordingTime(0);
                    }}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: 'none',
                      background: 'var(--red)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'var(--bg)',
                    color: 'var(--text-2)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s',
                  }}
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
                  style={{ display: 'none' }}
                  onChange={handleImageSelect}
                />
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: 'none',
                    background: isRecording ? 'var(--red)' : 'var(--bg)',
                    color: isRecording ? '#fff' : 'var(--text-2)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s',
                  }}
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
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--red)' }}>
                    {formatRecordingTime(recordingTime)}
                  </span>
                )}
                {isRecording && (
                  <button
                    onClick={cancelRecording}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: 'none',
                      background: 'var(--bg)',
                      color: 'var(--text-2)',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                    title="Cancel recording"
                  >
                    ✕
                  </button>
                )}
                <div style={{ flex: 1, position: 'relative' }}>
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Type a message..."
                    rows={1}
                    style={{
                      width: '100%',
                      padding: '12px 16px 20px 16px',
                      borderRadius: '24px',
                      border: '1.5px solid var(--border)',
                      background: 'var(--bg)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      resize: 'none',
                      fontFamily: 'inherit',
                      lineHeight: 1.4,
                      maxHeight: '120px',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--purple)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: 'none',
                    background: showEmojiPicker ? 'var(--purple-lt)' : 'var(--bg)',
                    color: 'var(--text-2)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    transition: 'background 0.2s',
                  }}
                  title="Add emoji"
                >
                  😊
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim() && !selectedImage && !audioBlob}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: (messageInput.trim() || selectedImage || audioBlob) ? 'var(--purple)' : 'var(--text-3)',
                    color: '#fff',
                    border: 'none',
                    cursor: (messageInput.trim() || selectedImage || audioBlob) ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18 }}>
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
              {showEmojiPicker && (
                <div style={{
                  position: 'absolute',
                  bottom: '80px',
                  right: '20px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  zIndex: 100,
                }}>
                  {commonEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setMessageInput(prev => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      style={{
                        fontSize: '1.5rem',
                        padding: '8px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-3)',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 64, height: 64, opacity: 0.3 }}>
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}

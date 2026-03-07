'use client';

import React, { useState, useEffect, useRef } from 'react';

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
}

interface ChatPanelProps {
  staffMembers: StaffMember[];
  conversations: { [key: string]: { id: string; messages: ChatMessage[] } };
  setConversations: React.Dispatch<React.SetStateAction<{ [key: string]: { id: string; messages: ChatMessage[] } }>>;
}

export function ChatPanel({ staffMembers, conversations, setConversations }: ChatPanelProps) {
  const [selectedChat, setSelectedChat] = useState<string>('team');
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = () => {
    if (!messageInput.trim()) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'owner',
      senderName: 'Owner',
      senderType: 'owner',
      text: messageInput.trim(),
      timestamp: Date.now(),
    };

    setConversations((prev) => ({
      ...prev,
      [selectedChat]: {
        ...prev[selectedChat],
        messages: [...prev[selectedChat].messages, newMessage],
      },
    }));

    setMessageInput('');

    window.dispatchEvent(new CustomEvent('owner-chat-message', {
      detail: {
        conversationId: selectedChat,
        message: newMessage,
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

  const getSelectedConversation = () => {
    return conversations[selectedChat];
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, selectedChat]);

  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      height: 'calc(100vh - 300px)',
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
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: 'var(--bg)',
            }}>
              {getSelectedConversation().messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: msg.senderType === 'owner' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={{
                    maxWidth: '70%',
                    padding: '10px 14px',
                    borderRadius: '16px',
                    background: msg.senderType === 'owner' ? 'var(--purple)' : 'var(--surface)',
                    color: msg.senderType === 'owner' ? '#fff' : 'var(--text-1)',
                    fontSize: '0.85rem',
                    lineHeight: 1.4,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}>
                    {msg.senderType !== 'owner' && selectedChat === 'team' && (
                      <div style={{ fontSize: '0.65rem', opacity: 0.7, marginBottom: '4px' }}>
                        {msg.senderName}
                      </div>
                    )}
                    {msg.text}
                    <div style={{
                      fontSize: '0.65rem',
                      opacity: 0.7,
                      marginTop: '4px',
                      textAlign: 'right',
                    }}>
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid var(--border)',
              background: 'var(--surface)',
            }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '24px',
                    border: '1.5px solid var(--border)',
                    background: 'var(--bg)',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--purple)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim()}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: messageInput.trim() ? 'var(--purple)' : 'var(--text-3)',
                    color: '#fff',
                    border: 'none',
                    cursor: messageInput.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 64, height: 64, opacity: 0.3 }}>
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}

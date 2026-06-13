'use client';

import React, { useState, useMemo, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import {
  Send,
  ArrowLeft,
  Loader2,
  ImageIcon,
  Bot,
  User,
} from 'lucide-react';
import { useLanguage } from '@/context/language-provider';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, useUser, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, doc, orderBy, serverTimestamp, where, type Timestamp, getDocs } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import imageCompression from 'browser-image-compression';
import { usePathname } from 'next/navigation';
import { Button } from '@/app/welcome/components/Button';

const BOT_ID = 'busmo-bot';
const BOT_NAME = 'Busmo Bot';

export function ChatWidget() {
  const pathname = usePathname();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [chatView, setChatView] = useState<'initial' | 'chat' | 'ticket'>('initial');
  const [chatInput, setChatInput] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<{ senderId: string; senderName: string; text: string; createdAt: Date }[]>([]);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useUser();
  const firestore = useFirestore();
  const { language } = useLanguage();

  // Example: Fetch agents from Firestore (adjust collection name as needed)
  const [allAgents, setAllAgents] = useState<{ status: string }[] | null>(null);

  useEffect(() => {
    if (!firestore) return;
    const fetchAgents = async () => {
      const agentsSnapshot = await getDocs(collection(firestore, 'agents'));
      setAllAgents(agentsSnapshot.docs.map(doc => doc.data() as { status: string }));
    };
    fetchAgents();
  }, [firestore]);

  const onlineAgents = allAgents?.filter(a => a.status === 'online') || [];

  // Scroll to bottom when messages update
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, open]);

  // Prevent widget on admin pages
  if (pathname.startsWith('/admin')) {
    return null;
  }

  // Handle sending a message
  const handleSend = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    setLocalMessages(msgs => [
      ...msgs,
      {
        senderId: user?.uid || 'user',
        senderName: user?.displayName || 'You',
        text: chatInput,
        createdAt: new Date(),
      },
    ]);
    setChatInput('');
    // Simulate bot reply
    setTimeout(() => {
      setLocalMessages(msgs => [
        ...msgs,
        {
          senderId: BOT_ID,
          senderName: BOT_NAME,
          text: "Sorry, MO can only answer business-related questions for now. Try asking about sales, profit, expenses, or stock.",
          createdAt: new Date(),
        },
      ]);
    }, 1200);
  };

  // --- Modern UI Chat Widget (right-aligned, modern bot icon, bot fallback) ---
  return (
    <>
      {/* Floating Chat Button */}
      {!open && (
        <Button
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl bg-white hover:bg-gray-100 z-50 flex items-center justify-center border border-yellow-400"
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          style={{ padding: 0 }}
        >
          {/* Custom SVG Icon from prompt */}
          <span className="block">
            <svg width="56" height="56" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="38" fill="#100A00"></circle>
              <circle cx="40" cy="40" r="36" fill="none" stroke="#F4A535" strokeWidth="1.5"></circle>
              {/* chat bubbles */}
              <rect x="8" y="10" width="28" height="16" rx="5" fill="rgba(29,185,84,0.2)" stroke="#1DB954" strokeWidth="1"></rect>
              <circle cx="14" cy="18" r="2" fill="#1DB954"></circle>
              <circle cx="20" cy="18" r="2" fill="#1DB954"></circle>
              <circle cx="26" cy="18" r="2" fill="#1DB954"></circle>
              <path d="M12 26 L16 26 L14 30 Z" fill="#1DB954" opacity="0.6"></path>
              <rect x="44" y="10" width="28" height="16" rx="5" fill="rgba(244,165,53,0.2)" stroke="#F4A535" strokeWidth="1"></rect>
              <circle cx="50" cy="18" r="2" fill="#F4A535"></circle>
              <circle cx="56" cy="18" r="2" fill="#F4A535"></circle>
              <circle cx="62" cy="18" r="2" fill="#F4A535"></circle>
              <path d="M68 26 L64 26 L66 30 Z" fill="#F4A535" opacity="0.6"></path>
              {/* Mo left */}
              <circle cx="24" cy="48" r="14" fill="#F5C9A0"></circle>
              <path d="M10 44 C10 34 38 34 38 44 L38 39 C38 30 10 30 10 39 Z" fill="#2C1A0E"></path>
              <circle cx="19" cy="47" r="2.5" fill="#1A2B3C"></circle>
              <circle cx="29" cy="47" r="2.5" fill="#1A2B3C"></circle>
              <path d="M19 53 Q24 57 29 53" stroke="#CC7A3A" strokeWidth="1.5" strokeLinecap="round" fill="none"></path>
              <ellipse cx="24" cy="66" rx="10" ry="4" fill="#1DB954" opacity="0.8"></ellipse>
              <rect x="18" y="62" width="12" height="6" rx="3" fill="#F5C9A0"></rect>
              {/* Customer right */}
              <circle cx="56" cy="48" r="14" fill="#D4956A"></circle>
              <path d="M42 44 C42 34 70 34 70 44 L70 39 C70 30 42 30 42 39 Z" fill="#1A0A06"></path>
              <circle cx="51" cy="47" r="2.5" fill="#1A2B3C"></circle>
              <circle cx="61" cy="47" r="2.5" fill="#1A2B3C"></circle>
              <path d="M51 53 Q56 57 61 53" stroke="#996040" strokeWidth="1.5" strokeLinecap="round" fill="none"></path>
              <ellipse cx="56" cy="66" rx="10" ry="4" fill="#E8503A" opacity="0.8"></ellipse>
              <rect x="50" y="62" width="12" height="6" rx="3" fill="#D4956A"></rect>
            </svg>
          </span>
        </Button>
      )}

      {/* Chat Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/30 backdrop-blur-sm">
          <div className="relative w-full max-w-xs sm:max-w-md mx-4 mb-6 sm:mb-8">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col h-[480px]">
              {/* Header */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-purple-700 to-indigo-600 rounded-t-2xl">
                {/* MO Avatar SVG */}
                <span className="rounded-full w-10 h-10 flex items-center justify-center bg-white shadow border-2 border-green-400">
                  <svg width="40" height="40" viewBox="0 0 80 80" fill="none">
                    <circle cx="40" cy="40" r="38" fill="none" stroke="#1DB954" strokeWidth="2" strokeDasharray="6 3"></circle>
                    <circle cx="40" cy="34" r="15" fill="#F5C9A0"></circle>
                    <path d="M25 30 C25 21 55 21 55 30 L55 26 C55 18 25 18 25 26 Z" fill="#2C1A0E"></path>
                    <ellipse cx="33.5" cy="33" rx="2.8" ry="3.2" fill="#1A2B3C"></ellipse>
                    <ellipse cx="46.5" cy="33" rx="2.8" ry="3.2" fill="#1A2B3C"></ellipse>
                    <circle cx="34.5" cy="31.5" r="1" fill="white"></circle>
                    <circle cx="47.5" cy="31.5" r="1" fill="white"></circle>
                    <path d="M33 39 Q40 44 47 39" stroke="#CC7A3A" strokeWidth="1.8" strokeLinecap="round" fill="none"></path>
                    <ellipse cx="40" cy="61" rx="13" ry="5.5" fill="rgba(29,185,84,0.3)" stroke="#1DB954" strokeWidth="1"></ellipse>
                    <rect x="33" y="49" width="14" height="10" rx="5" fill="#F5C9A0"></rect>
                    {/* online dot */}
                    <circle cx="58" cy="22" r="5" fill="#1DB954"></circle>
                    <circle cx="58" cy="22" r="3" fill="#4AEF84"></circle>
                  </svg>
                </span>
                <span className="font-bold text-white text-base flex-1">Talk to Mo</span>
                <button
                  className="ml-auto text-white hover:text-purple-200 transition"
                  onClick={() => setOpen(false)}
                  aria-label="Close chat"
                  type="button"
                >
                  <ArrowLeft className="h-6 w-6 rotate-180" />
                </button>
              </div>

              {/* Main Content */}
              <div className="flex-1 flex flex-col px-5 py-4 overflow-y-auto">
                {localMessages.length === 0 && (
                  <div className="text-gray-500 text-sm mb-4">
                    Hi! I'm MO, your business assistant. Ask me anything about your sales, profit, expenses, or stock.
                  </div>
                )}
                {localMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "mb-2 flex",
                      msg.senderId === BOT_ID ? "justify-start" : "justify-end"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] px-4 py-2 rounded-lg text-sm",
                        msg.senderId === BOT_ID
                          ? "bg-gray-100 text-gray-900"
                          : "bg-purple-700 text-white"
                      )}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatMessagesEndRef} />
              </div>

              {/* Input */}
              <form
                className="flex items-center gap-2 px-5 py-3 border-t border-gray-100 dark:border-gray-800"
                onSubmit={handleSend}
              >
                <input
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  type="text"
                  placeholder="Type your question…"
                  value={chatInput}
                  onChange={(e: any) => setChatInput(e.target.value)}
                  autoFocus
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!chatInput.trim()}
                  className="p-2 rounded-full bg-purple-700 text-white hover:bg-purple-800"
                  aria-label="Send"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
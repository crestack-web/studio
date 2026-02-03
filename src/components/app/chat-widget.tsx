'use client';

import React, { useState, useMemo, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Loader2,
  ImageIcon,
  User,
} from 'lucide-react';
import { useLanguage } from '@/context/language-provider';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, doc, orderBy, serverTimestamp, where, type Timestamp } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import imageCompression from 'browser-image-compression';


// Interfaces
interface SupportAgent {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    status: 'online' | 'offline';
    language?: 'en' | 'fr';
}

interface ChatConversation {
    id: string;
    userId: string;
    agentId?: string;
    status: 'open' | 'in-progress' | 'closed';
    lastMessage: string;
    lastMessageAt: { toDate: () => Date };
}

interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    text?: string;
    imageUrl?: string;
    createdAt: Timestamp;
}

export function ChatWidget() {
  const { toast } = useToast();
  
  const [chatView, setChatView] = useState('initial'); // 'initial', 'chat', 'ticket'
  const [chatInput, setChatInput] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useUser();
  const firestore = useFirestore();
  const { language } = useLanguage();

  const agentsQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'supportAgents'));
  }, [firestore]);
  const { data: allAgents, isLoading: isLoadingAgents } = useCollection<SupportAgent>(agentsQuery);

  const agentsMap = useMemo(() => {
      if (!allAgents) return new Map();
      return new Map(allAgents.map(a => [a.userId, a]));
  }, [allAgents]);

  const assignedAgent = useMemo(() => {
      if (!allAgents) return null;
      const onlineLanguageMatches = allAgents.filter(a => a.status === 'online' && a.language === language);
      if (onlineLanguageMatches.length > 0) return onlineLanguageMatches[0];
      
      const anyOnline = allAgents.filter(a => a.status === 'online');
      if (anyOnline.length > 0) return anyOnline[0];

      return null;
  }, [allAgents, language]);

  const canChat = useMemo(() => {
      if(!allAgents) return false;
      return allAgents.some(a => a.status === 'online');
  }, [allAgents]);

  const conversationQuery = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return query(
          collection(firestore, 'chatConversations'),
          where('userId', '==', user.uid),
          where('status', '!=', 'closed')
      );
  }, [firestore, user]);
  const { data: conversations } = useCollection<ChatConversation>(conversationQuery);
  
  useEffect(() => {
      if (conversations && conversations.length > 0) {
          setConversationId(conversations[0].id);
      } else {
          setConversationId(null);
      }
  }, [conversations]);

  const messagesQuery = useMemoFirebase(() => {
      if (!firestore || !conversationId) return null;
      return query(
          collection(firestore, `chatConversations/${conversationId}/messages`),
          orderBy('createdAt', 'asc')
      );
  }, [firestore, conversationId]);
  const { data: messages, isLoading: isLoadingMessages } = useCollection<ChatMessage>(messagesQuery);
  
  useEffect(() => {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoadingMessages]);

  const handleStartChat = async () => {
      if (!user) {
          toast({ variant: 'destructive', title: 'Please sign in', description: 'You need to be logged in to start a chat.'});
          return;
      }
      if (!firestore) return;

      if (conversationId) {
          const conversationRef = doc(firestore, 'chatConversations', conversationId);
          updateDocumentNonBlocking(conversationRef, { status: 'open' }); // Re-open existing chat
          setChatView('chat');
          return;
      }

      const newConversation = {
          userId: user.uid,
          userName: user.displayName || user.email || 'Anonymous',
          agentId: assignedAgent?.userId || null,
          status: 'open' as 'open',
          lastMessage: 'Started a new chat.',
          lastMessageAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
      };

      try {
          const newDocRef = await addDocumentNonBlocking(collection(firestore, 'chatConversations'), newConversation);
          if (newDocRef) {
              setConversationId(newDocRef.id);
              setChatView('chat');
          }
      } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not start chat. Please try again.' });
      }
  };
  
  const handleSendMessage = async (e: FormEvent, text: string, imageUrl?: string) => {
      e.preventDefault();
      if ((!text.trim() && !imageUrl) || !conversationId || !user || !firestore) return;

      const messagesColRef = collection(firestore, `chatConversations/${conversationId}/messages`);
      const conversationRef = doc(firestore, 'chatConversations', conversationId);
      
      const newMessage: {
          senderId: string;
          senderName: string;
          createdAt: any;
          text?: string;
          imageUrl?: string;
      } = {
          senderId: user.uid,
          senderName: user.displayName || 'User',
          createdAt: serverTimestamp(),
      };

      if (text.trim()) {
          newMessage.text = text.trim();
      }
      if (imageUrl) {
          newMessage.imageUrl = imageUrl;
      }

      const lastMessageText = text ? text.trim() : 'Sent an image';

      setChatInput('');
      await addDocumentNonBlocking(messagesColRef, newMessage);
      updateDocumentNonBlocking(conversationRef, {
          lastMessage: lastMessageText,
          lastMessageAt: serverTimestamp(),
          status: 'open',
      });
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      
      const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
      };

      try {
          toast({ title: 'Compressing image...' });
          const compressedFile = await imageCompression(file, options);
          const reader = new FileReader();
          reader.onloadend = () => {
              handleSendMessage(new Event('submit'), '', reader.result as string);
              toast({ title: 'Image sent!' });
          };
          reader.readAsDataURL(compressedFile);
      } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not upload image.' });
      }
  };

  const handleSubmitTicket = async (e: FormEvent) => {
      e.preventDefault();
      if (!ticketSubject.trim() || !ticketMessage.trim() || !firestore) return;

      const ticketData = {
          subject: ticketSubject,
          message: ticketMessage,
          status: 'open',
          createdAt: serverTimestamp(),
          userId: user?.uid || 'anonymous',
          userName: user?.displayName || 'Anonymous',
          userEmail: user?.email || 'anonymous',
      };

      try {
          await addDocumentNonBlocking(collection(firestore, 'supportTickets'), ticketData);
          toast({ title: 'Ticket Submitted', description: 'We have received your message and will get back to you shortly.'});
          setChatView('initial');
          setTicketSubject('');
          setTicketMessage('');
      } catch (error) {
           toast({ variant: 'destructive', title: 'Error', description: 'Could not submit your ticket. Please try again.' });
      }
  };

  return (
    <Sheet>
        <SheetTrigger asChild>
            <Button className="fixed bottom-4 right-4 h-16 w-16 rounded-full shadow-lg">
                <MessageSquare className="h-8 w-8" />
            </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col p-0">
            {chatView === 'initial' && (
                <>
                    <SheetHeader className="p-4 border-b">
                        <SheetTitle>Busmo Support</SheetTitle>
                        <SheetDescription>How can we help you today?</SheetDescription>
                    </SheetHeader>
                    <div className="p-6 flex-1 space-y-4">
                        {isLoadingAgents ? (
                            <Skeleton className="h-24 w-full" />
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold mb-2">
                                        {canChat ? "Our agents are online" : "We're currently offline"}
                                    </h3>
                                    {canChat && (
                                        <div className="flex -space-x-2 overflow-hidden mb-4">
                                            {allAgents?.filter(a => a.status === 'online').map(agent => (
                                                <Avatar key={agent.userId} className="inline-block h-10 w-10 rounded-full ring-2 ring-background">
                                                    <AvatarFallback>{agent.displayName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                            ))}
                                        </div>
                                    )}
                                    <Button className="w-full" onClick={handleStartChat} disabled={!canChat}>
                                        Start Live Chat
                                    </Button>
                                    {!canChat && <p className="text-xs text-muted-foreground mt-1 text-center">No agents available right now.</p>}
                                </div>
                                
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground mb-2 text-center">Leave us a message and we'll get back to you via email.</p>
                                    <Button className="w-full" variant="outline" onClick={() => setChatView('ticket')}>
                                        Submit a Ticket
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {chatView === 'chat' && (
                <>
                    <SheetHeader className="p-4 border-b flex-row items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setChatView('initial')}><ArrowLeft className="h-5 w-5" /></Button>
                        {assignedAgent ? (
                            <>
                                <Avatar className="h-9 w-9"><AvatarFallback>{assignedAgent.displayName.charAt(0)}</AvatarFallback></Avatar>
                                <div>
                                    <SheetTitle className="text-base">{assignedAgent.displayName}</SheetTitle>
                                    <SheetDescription className="text-xs">Support Agent</SheetDescription>
                                </div>
                            </>
                        ) : (
                            <SheetTitle>Live Chat</SheetTitle>
                        )}
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {isLoadingMessages ? (
                            <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/></div>
                        ) : messages && messages.length > 0 ? (
                            messages.map(msg => (
                                <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === user?.uid ? "justify-end" : "justify-start")}>
                                    {msg.senderId !== user?.uid && (
                                        <Avatar className="h-8 w-8"><AvatarFallback>{agentsMap.get(msg.senderId)?.displayName.charAt(0) || 'A'}</AvatarFallback></Avatar>
                                    )}
                                    <div className={cn("max-w-xs rounded-2xl p-3 text-sm", msg.senderId === user?.uid ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none")}>
                                        {msg.text && <p>{msg.text}</p>}
                                        {msg.imageUrl && (
                                            <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                                                <Image src={msg.imageUrl} alt="User upload" width={200} height={200} className="rounded-lg mt-2 cursor-pointer" />
                                            </a>
                                        )}
                                        {msg.createdAt && <p className="text-xs opacity-70 mt-1">{formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: true })}</p>}
                                    </div>
                                </div>
                            ))
                        ) : (
                        <div className="text-center text-sm text-muted-foreground pt-10">Start the conversation...</div>
                        )}
                        <div ref={chatMessagesEndRef} />
                    </div>
                    <SheetFooter className="p-4 border-t">
                        <form onSubmit={(e) => handleSendMessage(e, chatInput)} className="flex items-center gap-2 w-full">
                            <Input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type your message..." className="h-11" />
                            <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}><ImageIcon className="h-5 w-5" /></Button>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                            <Button type="submit" size="icon" className="h-11 w-11 shrink-0"><Send className="h-5 w-5" /></Button>
                        </form>
                    </SheetFooter>
                </>
            )}

            {chatView === 'ticket' && (
                <>
                    <SheetHeader className="p-4 border-b flex-row items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setChatView('initial')}><ArrowLeft className="h-5 w-5" /></Button>
                        <SheetTitle>Leave a Message</SheetTitle>
                    </SheetHeader>
                    <form onSubmit={handleSubmitTicket} className="p-6 flex-1 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="ticket-subject">Subject</Label>
                            <Input id="ticket-subject" value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)} placeholder="e.g., Issue with my subscription" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ticket-message">How can we help?</Label>
                            <Textarea id="ticket-message" value={ticketMessage} onChange={(e) => setTicketMessage(e.target.value)} placeholder="Please describe your issue in detail..." rows={6}/>
                        </div>
                        <Button type="submit" className="w-full">Submit Ticket</Button>
                    </form>
                </>
            )}
        </SheetContent>
    </Sheet>
  );
}

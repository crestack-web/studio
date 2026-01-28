'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking, useUser } from '@/firebase';
import { collection, query, doc, orderBy, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Send, MessageSquare, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// Interfaces based on backend.json
interface ChatConversation {
    id: string;
    userId: string;
    userName: string;
    agentId?: string;
    status: 'open' | 'in-progress' | 'closed';
    lastMessage: string;
    lastMessageAt: { toDate: () => Date };
    createdAt: { toDate: () => Date };
}

interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    createdAt: { toDate: () => Date };
}

const statusVariant: { [key in ChatConversation['status']]: "default" | "secondary" | "destructive" } = {
    open: 'destructive',
    'in-progress': 'secondary',
    closed: 'default',
};


const ChatInterface = () => {
    const firestore = useFirestore();
    const { user: adminUser, isUserLoading } = useUser();
    const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch conversations
    const conversationsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'chatConversations'), orderBy('lastMessageAt', 'desc'));
    }, [firestore]);
    const { data: conversations, isLoading: isLoadingConversations } = useCollection<ChatConversation>(conversationsQuery);

    // Fetch messages for the selected conversation
    const messagesQuery = useMemoFirebase(() => {
        if (!firestore || !selectedConversation) return null;
        return query(collection(firestore, `chatConversations/${selectedConversation.id}/messages`), orderBy('createdAt', 'asc'));
    }, [firestore, selectedConversation]);
    const { data: messages, isLoading: isLoadingMessages } = useCollection<ChatMessage>(messagesQuery);
    
    // Auto-assign agent on selecting a conversation
    useEffect(() => {
        if (selectedConversation && !selectedConversation.agentId && adminUser?.uid && firestore) {
            const conversationRef = doc(firestore, 'chatConversations', selectedConversation.id);
            updateDocumentNonBlocking(conversationRef, { agentId: adminUser.uid, status: 'in-progress' });
        }
    }, [selectedConversation, adminUser, firestore]);
    
    // Scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedConversation || !adminUser || isUserLoading || !firestore) return;

        const messagesRef = collection(firestore, `chatConversations/${selectedConversation.id}/messages`);
        const conversationRef = doc(firestore, 'chatConversations', selectedConversation.id);
        
        const newMessage = {
            senderId: adminUser.uid,
            senderName: 'Support', // Or adminUser.displayName
            text: messageInput.trim(),
            createdAt: serverTimestamp(),
        };

        await addDocumentNonBlocking(messagesRef, newMessage);
        updateDocumentNonBlocking(conversationRef, {
            lastMessage: messageInput.trim(),
            lastMessageAt: serverTimestamp(),
            status: 'in-progress'
        });

        setMessageInput('');
    };


    return (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 h-[calc(100vh-10rem)]">
            {/* Conversations List */}
            <Card className="md:col-span-1 xl:col-span-1 flex flex-col">
                <CardHeader>
                    <CardTitle>Conversations</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-2">
                    {isLoadingConversations ? (
                         <div className="space-y-2 p-2"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground"/></div>
                    ) : conversations && conversations.length > 0 ? (
                        <div className="space-y-2">
                            {conversations.map(convo => (
                                <button key={convo.id} onClick={() => setSelectedConversation(convo)} className={cn("w-full text-left p-3 rounded-lg border transition-colors", selectedConversation?.id === convo.id ? "bg-accent border-primary" : "hover:bg-muted/50")}>
                                    <div className="flex justify-between items-start">
                                        <p className="font-semibold text-sm">{convo.userName}</p>
                                        <Badge variant={statusVariant[convo.status] || 'default'} className="capitalize text-xs">{convo.status}</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate pr-4">{convo.lastMessage}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{convo.lastMessageAt ? formatDistanceToNow(convo.lastMessageAt.toDate(), { addSuffix: true }) : ''}</p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex h-full items-center justify-center text-center">
                            <p className="text-sm text-muted-foreground">No active conversations.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Chat Window */}
            <Card className="md:col-span-2 xl:col-span-3 flex flex-col">
                {selectedConversation ? (
                    <>
                        <CardHeader className="flex-row items-center justify-between border-b">
                             <div>
                                <CardTitle>{selectedConversation.userName}</CardTitle>
                                <CardDescription>User ID: {selectedConversation.userId.substring(0, 6)}...</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                             {isLoadingMessages ? (
                                <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                            ) : messages && messages.length > 0 ? (
                                messages.map(msg => (
                                    <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === adminUser?.uid ? "justify-end" : "justify-start")}>
                                        {msg.senderId !== adminUser?.uid && (
                                            <Avatar className="h-8 w-8"><AvatarFallback><User className="h-4 w-4"/></AvatarFallback></Avatar>
                                        )}
                                        <div className={cn("max-w-xs lg:max-w-md rounded-2xl p-3 text-sm", msg.senderId === adminUser?.uid ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none")}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex h-full items-center justify-center"><p className="text-sm text-muted-foreground">No messages in this conversation yet.</p></div>
                            )}
                            <div ref={messagesEndRef} />
                        </CardContent>
                        <div className="p-4 border-t">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                <Input value={messageInput} onChange={e => setMessageInput(e.target.value)} placeholder="Type your reply..." className="h-11" disabled={isUserLoading} />
                                <Button type="submit" size="icon" className="h-11 w-11" disabled={!messageInput.trim() || isUserLoading}>
                                    <Send className="h-5 w-5" />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col h-full items-center justify-center text-center">
                        <MessageSquare className="h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">Select a conversation</h3>
                        <p className="text-sm text-muted-foreground">Choose a conversation from the left to start chatting.</p>
                    </div>
                )}
            </Card>
        </div>
    );
}


export default function AdminSupportPage() {
    return (
        <main className="flex-1 p-4 sm:p-6">
            <h1 className="text-2xl font-bold font-headline mb-6">Live Chat Support</h1>
            <ChatInterface />
        </main>
    );
}

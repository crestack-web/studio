'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking, useUser, useDoc } from '@/firebase';
import { collection, query, doc, orderBy, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Send, MessageSquare, User, Loader2, Eye, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';

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
    text?: string;
    imageUrl?: string;
    createdAt: { toDate: () => Date };
}

interface SupportTicket {
    id: string;
    subject: string;
    message: string;
    status: 'open' | 'in-progress' | 'closed';
    createdAt: { toDate: () => Date };
    userId: string;
    userName: string;
    userEmail: string;
}

interface SupportAgent {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    status: 'online' | 'offline';
    language?: 'en' | 'fr';
}

const statusVariant: { [key in ChatConversation['status']]: "default" | "secondary" | "destructive" } = {
    open: 'destructive',
    'in-progress': 'secondary',
    closed: 'default',
};

const AgentStatusControl = () => {
    const firestore = useFirestore();
    const { user: adminUser, isUserLoading } = useUser();
    const { toast } = useToast();

    const agentRef = useMemoFirebase(() => {
        if (!firestore || !adminUser) return null;
        return doc(firestore, 'supportAgents', adminUser.uid);
    }, [firestore, adminUser]);

    const { data: agentProfile, isLoading: isLoadingAgent } = useDoc<SupportAgent>(agentRef);

    const handleStatusChange = async (isOnline: boolean) => {
        if (!agentRef) return;
        const newStatus = isOnline ? 'online' : 'offline';
        await updateDocumentNonBlocking(agentRef, { status: newStatus });
        toast({
            title: `You are now ${newStatus}.`,
            description: isOnline ? "You will now receive incoming chats." : "You will not receive new chats.",
        });
    };

    if (isUserLoading || isLoadingAgent) {
        return <Skeleton className="h-8 w-24" />;
    }

    if (!agentProfile) {
        return null;
    }

    return (
        <div className="flex items-center space-x-2">
            <Switch
                id="agent-status"
                checked={agentProfile.status === 'online'}
                onCheckedChange={handleStatusChange}
            />
            <Label htmlFor="agent-status" className="font-medium capitalize">
                {agentProfile.status}
            </Label>
        </div>
    );
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
        
        const newMessage: Omit<ChatMessage, 'id' | 'createdAt'> = {
            senderId: adminUser.uid,
            senderName: 'Support', // Or adminUser.displayName
            text: messageInput.trim(),
        };

        await addDocumentNonBlocking(messagesRef, { ...newMessage, createdAt: serverTimestamp() });
        updateDocumentNonBlocking(conversationRef, {
            lastMessage: messageInput.trim(),
            lastMessageAt: serverTimestamp(),
            status: 'in-progress'
        });

        setMessageInput('');
    };


    return (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 h-[calc(100vh-14rem)]">
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
                                    <p className="text-xs text-muted-foreground truncate pr-4 flex items-center gap-1">
                                        {convo.lastMessage.startsWith('data:image') ? <><ImageIcon className="w-3 h-3" /> Image</> : convo.lastMessage}
                                    </p>
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
                                            {msg.text && <p>{msg.text}</p>}
                                            {msg.imageUrl && (
                                                <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                                                    <Image src={msg.imageUrl} alt="User upload" width={200} height={200} className="rounded-lg mt-2 cursor-pointer" />
                                                </a>
                                            )}
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
};

const SupportTickets = () => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

    const ticketsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'supportTickets'), orderBy('createdAt', 'desc'));
    }, [firestore]);
    const { data: tickets, isLoading } = useCollection<SupportTicket>(ticketsQuery);

    const handleUpdateStatus = async (ticketId: string, status: SupportTicket['status']) => {
        if (!firestore) return;
        const ticketRef = doc(firestore, 'supportTickets', ticketId);
        await updateDoc(ticketRef, { status });
        toast({ title: 'Ticket Status Updated' });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Support Tickets</CardTitle>
                <CardDescription>View and manage all submitted support tickets.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading tickets...</TableCell></TableRow>
                        ) : tickets && tickets.length > 0 ? tickets.map(ticket => (
                            <TableRow key={ticket.id}>
                                <TableCell>{format(ticket.createdAt.toDate(), 'PPP')}</TableCell>
                                <TableCell>
                                    <div className="font-medium">{ticket.userName}</div>
                                    <div className="text-xs text-muted-foreground">{ticket.userEmail}</div>
                                </TableCell>
                                <TableCell>{ticket.subject}</TableCell>
                                <TableCell>
                                    <Select defaultValue={ticket.status} onValueChange={(val) => handleUpdateStatus(ticket.id, val as SupportTicket['status'])}>
                                        <SelectTrigger className="w-32 h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="open">Open</SelectItem>
                                            <SelectItem value="in-progress">In Progress</SelectItem>
                                            <SelectItem value="closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" onClick={() => setSelectedTicket(ticket)}><Eye className="mr-2 h-4 w-4"/>View</Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">No tickets found.</TableCell></TableRow>
                        )}
                    </TableBody>
                 </Table>
                 <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
                     <DialogContent className="sm:max-w-lg">
                         <DialogHeader>
                             <DialogTitle>{selectedTicket?.subject}</DialogTitle>
                             <DialogDescription>
                                From: {selectedTicket?.userName} ({selectedTicket?.userEmail}) <br/>
                                Submitted: {selectedTicket && format(selectedTicket.createdAt.toDate(), 'PPpp')}
                             </DialogDescription>
                         </DialogHeader>
                         <div className="py-4 whitespace-pre-wrap bg-muted p-4 rounded-md">
                            {selectedTicket?.message}
                         </div>
                     </DialogContent>
                 </Dialog>
            </CardContent>
        </Card>
    );
};


export default function AdminSupportPage() {
    return (
        <main className="flex-1 p-4 sm:p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold font-headline">Support Center</h1>
                <AgentStatusControl />
            </div>
            <Tabs defaultValue="live-chat">
                <TabsList>
                    <TabsTrigger value="live-chat">Live Chat</TabsTrigger>
                    <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
                </TabsList>
                <TabsContent value="live-chat" className="mt-6">
                    <ChatInterface />
                </TabsContent>
                <TabsContent value="tickets" className="mt-6">
                    <SupportTickets />
                </TabsContent>
            </Tabs>
        </main>
    );
}

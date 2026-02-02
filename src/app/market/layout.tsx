'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/app/logo';
import { Menu, Search, ShoppingCart, Megaphone, Instagram, Facebook, Box, Tag, ArrowLeft, Send, ImageIcon, Loader2, User } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { LanguageSwitcher } from '@/components/app/language-switcher';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { useLanguage } from '@/context/language-provider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/cart-provider';
import { MarketSwitcher } from '@/components/app/market-switcher';
import { useMarket } from '@/context/market-provider';
import { formatCurrency } from '@/lib/currency';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, limit, where, orderBy, serverTimestamp, doc } from 'firebase/firestore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import React, { useState, useMemo, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import { MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface MarketProduct {
    id: string;
    productName: string;
    images?: string[];
    price: number;
}
interface MarketCategory {
    id: string;
    name: string;
}

interface Announcement {
    id: string;
    text: string;
    href: string;
}

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
    createdAt: { toDate: () => Date };
}


export default function MarketLayout({ 
    children, 
}: { 
    children: React.ReactNode, 
}) {
    const { t } = useLanguage();
    const { totalItems } = useCart();
    const { market, searchQuery, setSearchQuery } = useMarket();
    const router = useRouter();
    const firestore = useFirestore();

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());

    const { toast } = useToast();
  
    const [chatView, setChatView] = useState('initial'); // 'initial', 'chat', 'ticket'
    const [chatInput, setChatInput] = useState('');
    const [ticketSubject, setTicketSubject] = useState('');
    const [ticketMessage, setTicketMessage] = useState('');
    const [conversationId, setConversationId] = useState<string | null>(null);
    const chatMessagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { user } = useUser();
    const { language } = useLanguage();

    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile } = useDoc(userProfileRef);

    const agentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'supportAgents'));
    }, [firestore]);
    const { data: allAgents, isLoading: isLoadingAgents, error: agentsError } = useCollection<SupportAgent>(agentsQuery);

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
            where('userId', '==', user.uid)
        );
    }, [firestore, user]);
    const { data: conversations, isLoading: isLoadingConversation } = useCollection<ChatConversation>(conversationQuery);
    
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
            newDocRef.then(ref => {
                 setConversationId(ref.id);
                 setChatView('chat');
            });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not start chat. Please try again.' });
        }
    };
    
    const handleSendMessage = async (e: FormEvent, text: string, imageUrl?: string) => {
        e.preventDefault();
        if ((!text.trim() && !imageUrl) || !conversationId || !user || !firestore) return;

        const messagesColRef = collection(firestore, `chatConversations/${conversationId}/messages`);
        const conversationRef = doc(firestore, 'chatConversations', conversationId);
        
        const newMessage = {
            senderId: user.uid,
            senderName: user.displayName || 'User',
            text: text ? text.trim() : undefined,
            imageUrl: imageUrl || undefined,
            createdAt: serverTimestamp(),
        };

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

    useEffect(() => {
        setCurrentYear(new Date().getFullYear());
    }, []);

    const productsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // Fetch a set of products to use for suggestions.
        return query(collection(firestore, 'marketProducts'), limit(100));
    }, [firestore]);
    const { data: allProducts } = useCollection<MarketProduct>(productsQuery);

    const categoriesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // Fetch all categories for suggestions
        return query(collection(firestore, 'marketCategories'));
    }, [firestore]);
    const { data: allCategories } = useCollection<{id: string, name: string}>(categoriesQuery);

     const { data: announcements } = useCollection<Announcement>(
        useMemoFirebase(() => {
            if (!firestore) return null;
            return query(collection(firestore, 'announcements'), where('isActive', '==', true), where('page', '==', 'market'));
        }, [firestore])
    );

    const suggestions = useMemo(() => {
        if (!searchQuery) {
            return { products: [], categories: [] };
        }
        const lowercasedQuery = searchQuery.toLowerCase();
        const products = (allProducts || [])
            .filter(p => p.productName.toLowerCase().includes(lowercasedQuery))
            .slice(0, 5);
        const categories = (allCategories || [])
            .filter(c => c.name.toLowerCase().includes(lowercasedQuery))
            .slice(0, 3);

        return { products, categories };
    }, [searchQuery, allProducts, allCategories]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        setIsSearchOpen(!!query);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery) {
            setIsSearchOpen(false);
            e.currentTarget.blur();
            router.push(`/market/search?q=${searchQuery}`);
        }
    };
    
    const closeAndClear = () => {
        setIsSearchOpen(false);
    }

    return (
        <div className="flex flex-col min-h-screen bg-muted/20">
            <div className="sticky top-0 z-40">
                 {announcements && announcements.length > 0 && (
                    <div className="bg-primary text-primary-foreground">
                        <Carousel
                            plugins={[ Autoplay({ delay: 8000, stopOnInteraction: true }) ]}
                            opts={{ align: "start", loop: true }}
                            className="w-full"
                        >
                            <CarouselContent>
                                {announcements.map((announcement) => (
                                    <CarouselItem key={announcement.id}>
                                        <Link href={announcement.href || '#'}>
                                            <div className="flex items-center justify-center gap-2 text-center py-2 px-4 text-sm font-medium">
                                                <Megaphone className="h-4 w-4" />
                                                <span>{announcement.text}</span>
                                            </div>
                                        </Link>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                        </Carousel>
                    </div>
                )}
                <header className="bg-card border-b">
                    <div className="container mx-auto">
                        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 px-4 py-3 md:h-16 md:flex-nowrap md:py-0">
                            {/* Logo & Desktop Market Switcher */}
                            <div className="flex items-center gap-6">
                                <Link href="/market"><Logo className="h-8" /></Link>
                                <div className="hidden md:block">
                                    <MarketSwitcher />
                                </div>
                            </div>
                            
                            {/* Search bar */}
                            <div className="order-last w-full md:order-2 md:flex-1 md:max-w-xl">
                                <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                                    <PopoverTrigger asChild>
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                placeholder="Search products, stores, or categories"
                                                className="pl-12 h-12 text-base rounded-md"
                                                value={searchQuery}
                                                onChange={handleSearchChange}
                                                onKeyDown={handleKeyDown}
                                            />
                                        </div>
                                    </PopoverTrigger>
                                     <PopoverContent onOpenAutoFocus={(e) => e.preventDefault()} className="w-[var(--radix-popover-trigger-width)] p-0">
                                        {searchQuery && (suggestions.products.length === 0 && suggestions.categories.length === 0) ? (
                                            <div className="p-4 text-sm text-center text-muted-foreground">No results found for "{searchQuery}"</div>
                                        ) : (
                                            <div className="flex flex-col">
                                                {suggestions.categories.length > 0 && (
                                                    <div className="p-2">
                                                        <h4 className="px-2 text-xs font-semibold text-muted-foreground">Categories</h4>
                                                        <div className="mt-1">
                                                            {suggestions.categories.map(cat => (
                                                                <Link key={cat.id} href={`/market/search?q=${cat.name}`} onClick={closeAndClear} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
                                                                    <Tag className="h-4 w-4 text-muted-foreground"/>
                                                                    <span className="text-sm font-medium">{cat.name}</span>
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                 {suggestions.products.length > 0 && (
                                                    <div className="p-2">
                                                        <h4 className="px-2 text-xs font-semibold text-muted-foreground">Products</h4>
                                                         <div className="mt-1">
                                                            {suggestions.products.map(prod => (
                                                                <Link key={prod.id} href={`/market/product/${prod.id}`} onClick={closeAndClear} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
                                                                    <div className="relative h-10 w-10 shrink-0 rounded-md overflow-hidden bg-muted">
                                                                        <Image src={prod.images?.[0] || `https://picsum.photos/seed/${prod.id}/100`} alt={prod.productName} fill className="object-cover" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-medium line-clamp-1">{prod.productName}</p>
                                                                        <p className="text-xs text-muted-foreground">{formatCurrency(prod.price, market.country)}</p>
                                                                    </div>
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 order-2 md:order-3">
                                <Link href="/market/cart" passHref>
                                    <Button variant="ghost" size="icon" className="relative">
                                        <ShoppingCart className="h-6 w-6" />
                                        {totalItems > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{totalItems}</Badge>}
                                        <span className="sr-only">Cart</span>
                                    </Button>
                                </Link>
                                <div className="hidden sm:flex items-center gap-2">
                                    <Button asChild variant="ghost"><Link href="/login">Log In</Link></Button>
                                    <Button asChild><Link href="/signup">Sign Up</Link></Button>
                                </div>
                                <div className="sm:hidden">
                                    <Sheet>
                                        <SheetTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <Menu className="h-6 w-6" />
                                            </Button>
                                        </SheetTrigger>
                                        <SheetContent>
                                            <SheetHeader>
                                                <SheetTitle className="sr-only">Menu</SheetTitle>
                                                <SheetDescription className="sr-only">Login or sign up.</SheetDescription>
                                            </SheetHeader>
                                            <nav className="flex flex-col gap-4 mt-8">
                                                <Link href="/login" passHref className="w-full">
                                                    <Button variant="outline" className="w-full justify-center text-lg h-12">Log In</Button>
                                                </Link>
                                                <Link href="/signup" passHref className="w-full">
                                                    <Button className="w-full justify-center text-lg h-12">Sign Up</Button>
                                                </Link>
                                            </nav>
                                        </SheetContent>
                                    </Sheet>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
            </div>
            <main className="flex-1 flex flex-col items-center p-4 sm:p-6">{children}</main>
            <footer className="bg-card border-t">
                <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 items-center justify-between gap-4 py-8 px-4 text-center md:text-left">
                    <Logo className="h-7 mx-auto md:mx-0" />
                    <div className="flex items-center gap-4 justify-center text-sm text-muted-foreground">
                        <Link href="/terms" className="hover:underline">{t('footer.privacy')}</Link>
                        <Link href="/terms" className="hover:underline">{t('footer.terms')}</Link>
                    </div>
                    <div className="flex items-center gap-4 mx-auto md:ml-auto md:mr-0">
                        <a href="https://x.com/busmo_io" target="_blank" rel="noopener noreferrer" aria-label="X (formerly Twitter)">
                            <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground hover:text-foreground fill-current"><title>X</title><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
                        </a>
                        <a href="https://instagram.com/busmo.io" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                            <Instagram className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                        </a>
                        <a href="https://facebook.com/busmo.io" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                            <Facebook className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                        </a>
                    </div>
                </div>
                <p className="text-center text-xs text-muted-foreground pb-4">&copy; {currentYear} busmo.</p>
            </footer>
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
                                    <Skeleton className="h-10 w-full" />
                                ) : canChat ? (
                                    <div>
                                        <h3 className="font-semibold mb-2">Our agents are online</h3>
                                        <div className="flex -space-x-2 overflow-hidden mb-4">
                                            {allAgents?.filter(a => a.status === 'online').map(agent => (
                                                <Avatar key={agent.userId} className="inline-block h-10 w-10 rounded-full ring-2 ring-background">
                                                    <AvatarFallback>{agent.displayName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                            ))}
                                        </div>
                                        <Button className="w-full" onClick={handleStartChat}>Start Live Chat</Button>
                                    </div>
                                ) : (
                                    <div>
                                        <h3 className="font-semibold mb-2">We're currently offline</h3>
                                        <p className="text-sm text-muted-foreground mb-4">Please leave a message and we'll get back to you as soon as possible.</p>
                                        <Button className="w-full" variant="outline" onClick={() => setChatView('ticket')}>Leave a Message</Button>
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
                                                <p className="text-xs opacity-70 mt-1">{formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: true })}</p>
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
        </div>
    );
}

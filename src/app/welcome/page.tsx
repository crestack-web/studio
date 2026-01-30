'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/app/logo';
import { Activity, BarChart, Building, CheckCircle, HelpCircle, Landmark, Menu, MessageSquare, Package, Send, ShoppingCart, Store, TrendingUp, UtensilsCrossed, XCircle, ArrowLeft, CreditCard, Loader2, FileUp, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useState, useEffect, useRef, FormEvent, useMemo } from 'react';
import Autoplay from "embla-carousel-autoplay";
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { DashboardMockup } from '@/components/app/dashboard-mockup';
import { MarketMockup } from '@/components/app/market-mockup';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { InvestorMockup } from '@/components/app/investor-mockup';
import { useLanguage } from '@/context/language-provider';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { LanguageSwitcher } from '@/components/app/language-switcher';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUser, useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase, updateDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, where, serverTimestamp, doc, limit, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import imageCompression from 'browser-image-compression';
import { Badge } from '@/components/ui/badge';


const testimonialsDataRaw = [
  {
    id: 'testimonial-food-vendor',
    quoteKey: "welcome.testimonial_1_quote",
    nameKey: "welcome.testimonial_1_name",
    businessKey: "welcome.testimonial_1_biz",
  },
  {
    id: 'testimonial-retail-shop',
    quoteKey: "welcome.testimonial_2_quote",
    nameKey: "welcome.testimonial_2_name",
    businessKey: "welcome.testimonial_2_biz",
  },
  {
    id: 'testimonial-supermarket-owner',
    quoteKey: "welcome.testimonial_3_quote",
    nameKey: "welcome.testimonial_3_name",
    businessKey: "welcome.testimonial_3_biz",
  },
];

const testimonialsWithImages = testimonialsDataRaw.map(t => {
    const img = PlaceHolderImages.find(img => img.id === t.id);
    return {...t, imageUrl: img?.imageUrl, imageHint: img?.imageHint };
});

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

// The new landing page component
export default function LandingPage() {
  const [testimonials, setTestimonials] = useState<any[]>(testimonialsWithImages);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const { t } = useLanguage();
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


  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);
  
  const activeConversationQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'chatConversations'),
        where('userId', '==', user.uid),
        where('status', 'in', ['open', 'in-progress']),
        limit(1)
    );
  }, [firestore, user]);
  const { data: activeConversations } = useCollection<ChatConversation>(activeConversationQuery);
  const activeConversation = activeConversations?.[0];

  const allConversationsQuery = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return query(
          collection(firestore, 'chatConversations'),
          where('userId', '==', user.uid),
          orderBy('lastMessageAt', 'desc')
      );
  }, [firestore, user]);
  const { data: allUserConversations, isLoading: isLoadingConversations } = useCollection<ChatConversation>(allConversationsQuery);
  
  const pastConversations = useMemo(() => {
    if (!allUserConversations) return [];
    if (activeConversation) {
        return allUserConversations.filter(c => c.id !== activeConversation.id);
    }
    return allUserConversations;
  }, [allUserConversations, activeConversation]);

  const activeChatAgent = useMemo(() => {
    if (!activeConversation?.agentId || !agentsMap) return null;
    return agentsMap.get(activeConversation.agentId);
  }, [activeConversation, agentsMap]);


  useEffect(() => {
      if (activeConversation) {
          setConversationId(activeConversation.id);
      } else {
          setConversationId(null);
      }
  }, [activeConversation]);
  
  const chatMessagesQuery = useMemoFirebase(() => {
    if (!firestore || !conversationId) return null;
    return query(collection(firestore, `chatConversations/${conversationId}/messages`), orderBy('createdAt', 'asc'));
  }, [firestore, conversationId]);
  const { data: realChatMessages, isLoading: isLoadingMessages } = useCollection<ChatMessage>(chatMessagesQuery);
  
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [realChatMessages]);

  const handleStartChat = async () => {
    if (!firestore || !user || !userProfile) {
        toast({ title: "Please log in", description: "You must be logged in to start a chat.", variant: "destructive" });
        return;
    }
    setChatView('chat');
    // Don't create a new conversation if there's an active one.
    // Instead, allow users to explicitly start a new one if they want.
    if (activeConversation && conversationId) {
        // A new conversation is needed
        setConversationId(null); // Reset to trigger new creation
    }

    const newConversation = {
        userId: user.uid,
        userName: userProfile.displayName,
        agentId: null,
        status: 'open',
        lastMessage: 'User initiated chat',
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    const newConversationRef = await addDocumentNonBlocking(collection(firestore, 'chatConversations'), newConversation);
    setConversationId(newConversationRef.id);
  };
  
  const handleSendChatMessage = async (message: { text?: string; imageUrl?: string }) => {
    if (!firestore || !conversationId || !user || !userProfile) return;

    const messageData = {
        senderId: user.uid,
        senderName: userProfile.displayName,
        ...message,
        createdAt: serverTimestamp(),
    };

    const messagesRef = collection(firestore, `chatConversations/${conversationId}/messages`);
    const conversationRef = doc(firestore, 'chatConversations', conversationId);
    
    await addDocumentNonBlocking(messagesRef, messageData);
    updateDocumentNonBlocking(conversationRef, {
        lastMessage: message.imageUrl ? 'Image' : message.text,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
  };

  const handleSendTextMessage = (e: FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim()) return;
      handleSendChatMessage({ text: chatInput.trim() });
      setChatInput('');
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
    };

    try {
        const compressedFile = await imageCompression(file, options);
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            handleSendChatMessage({ imageUrl: dataUrl });
        };
        reader.readAsDataURL(compressedFile);
    } catch (error) {
        console.error('Error compressing image:', error);
        toast({
            variant: 'destructive',
            title: 'Image Upload Failed',
            description: 'There was an error processing your image.',
        });
    } finally {
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  };


  const handleCreateTicket = (e: FormEvent) => {
    e.preventDefault();
    if (!firestore) {
        toast({ title: "Error", description: "Could not connect to our services. Please try again later.", variant: "destructive" });
        return;
    }
    if (!user) {
        toast({ title: "Please log in", description: "You need to be logged in to create a support ticket.", variant: "destructive" });
        return;
    }
    const ticketsCollectionRef = collection(firestore, 'supportTickets');
    addDocumentNonBlocking(ticketsCollectionRef, {
        subject: ticketSubject,
        message: ticketMessage,
        status: 'open',
        createdAt: serverTimestamp(),
        userId: user.uid,
        userName: userProfile?.displayName || 'N/A',
        userEmail: user.email || 'N/A'
    });

    toast({ title: "Ticket Submitted", description: "Our team will review your request and get back to you shortly." });
    setTicketSubject('');
    setTicketMessage('');
    setChatView('initial');
  };

  const handleConversationClick = (convoId: string) => {
      setConversationId(convoId);
      setChatView('chat');
  };

  const faqItems = [
    { value: 'item-1', question: t('welcome.faq_1_q'), answer: t('welcome.faq_1_a') },
    { value: 'item-2', question: t('welcome.faq_2_q'), answer: t('welcome.faq_2_a') },
    { value: 'item-3', question: t('welcome.faq_3_q'), answer: t('welcome.faq_3_a') },
    { value: 'item-4', question: t('welcome.faq_4_q'), answer: t('welcome.faq_4_a') },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo className="h-8" />
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/welcome" passHref><Button variant="ghost">{t('nav.home')}</Button></Link>
            <Link href="/busmopay" passHref><Button variant="ghost">BusmoPay</Button></Link>
            <Link href="/market" passHref><Button variant="ghost">{t('nav.market')}</Button></Link>
            <Link href="/invest" passHref><Button variant="ghost">{t('nav.investors')}</Button></Link>
            <Link href="/blog" passHref><Button variant="ghost">Blog</Button></Link>
            <Link href="/pricing" passHref><Button variant="ghost">{t('nav.pricing')}</Button></Link>
            <ThemeToggle />
            <LanguageSwitcher />
            <Separator orientation="vertical" className="h-8" />
            <Link href="/login" passHref><Button variant="ghost">{t('nav.login')}</Button></Link>
            <Link href="/signup" passHref><Button>{t('nav.signup')}</Button></Link>
          </nav>
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-xs">
                  <SheetHeader>
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <SheetDescription className="sr-only">Main navigation links for the site.</SheetDescription>
                  </SheetHeader>
                  <Logo className="h-8 mb-8" />
                  <nav className="flex flex-col items-start gap-4">
                      <Link href="/welcome" passHref className="w-full"><Button variant="ghost" className="w-full justify-start text-lg">{t('nav.home')}</Button></Link>
                      <Link href="/busmopay" passHref className="w-full"><Button variant="ghost" className="w-full justify-start text-lg">BusmoPay</Button></Link>
                      <Link href="/market" passHref className="w-full"><Button variant="ghost" className="w-full justify-start text-lg">{t('nav.market')}</Button></Link>
                      <Link href="/invest" passHref className="w-full"><Button variant="ghost" className="w-full justify-start text-lg">{t('nav.investors')}</Button></Link>
                      <Link href="/blog" passHref className="w-full"><Button variant="ghost" className="w-full justify-start text-lg">Blog</Button></Link>
                      <Link href="/pricing" passHref className="w-full"><Button variant="ghost" className="w-full justify-start text-lg">{t('nav.pricing')}</Button></Link>
                      <Link href="/login" passHref className="w-full"><Button variant="ghost" className="w-full justify-start text-lg">{t('nav.login')}</Button></Link>
                      <Link href="/signup" passHref className="w-full"><Button className="w-full mt-4 text-lg h-12">{t('nav.signup')}</Button></Link>
                  </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32">
           <div
            aria-hidden="true"
            className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20"
          >
            <div className="blur-[106px] h-56 bg-gradient-to-br from-primary to-purple-400 dark:from-blue-700"></div>
            <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300 dark:to-indigo-600"></div>
          </div>
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl font-headline"
                dangerouslySetInnerHTML={{ __html: t('welcome.title') }}
            />
            <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
              {t('welcome.subtitle')}
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/signup" passHref>
                <Button size="lg" className="h-14 text-lg px-8">
                  {t('welcome.cta')}
                </Button>
              </Link>
            </div>
          </div>
           <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-16">
            <div className="relative mx-auto w-full max-w-5xl h-[450px] md:h-[650px]">
                 <DashboardMockup />
            </div>
        </div>
        </section>
        
        {/* Features Section */}
        <section className="py-24 sm:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">
                {t('welcome.features_title')}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t('welcome.features_subtitle')}
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-start p-6 border rounded-lg bg-card/50">
                <Package className="h-10 w-10 text-accent mb-4" />
                <h3 className="text-xl font-semibold font-headline">{t('welcome.feature_1_title')}</h3>
                <p className="mt-2 text-muted-foreground">
                  {t('welcome.feature_1_desc')}
                </p>
              </div>
              <div className="flex flex-col items-start p-6 border rounded-lg bg-card/50">
                <ShoppingCart className="h-10 w-10 text-accent mb-4" />
                <h3 className="text-xl font-semibold font-headline">{t('welcome.feature_2_title')}</h3>
                <p className="mt-2 text-muted-foreground">
                  {t('welcome.feature_2_desc')}
                </p>
              </div>
              <div className="flex flex-col items-start p-6 border rounded-lg bg-card/50">
                <BarChart className="h-10 w-10 text-accent mb-4" />
                <h3 className="text-xl font-semibold font-headline">{t('welcome.feature_3_title')}</h3>
                <p className="mt-2 text-muted-foreground">
                  {t('welcome.feature_3_desc')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Marketplace Section */}
        <section className="bg-card/30 py-24 sm:py-32">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div>
                 <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl"
                    dangerouslySetInnerHTML={{ __html: t('welcome.market_title') }}
                 />
                <p className="mt-4 text-lg text-muted-foreground">
                    {t('welcome.market_subtitle')}
                </p>
                <ul className="mt-6 space-y-3 text-muted-foreground">
                    {(t('welcome.market_features', { returnObjects: true }) as string[]).map((feature, i) => (
                        <li key={i} className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-accent"/>
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
                 <Link href="/market" passHref>
                    <Button size="lg" className="mt-8 h-12 text-base">
                        {t('welcome.market_cta')}
                    </Button>
                </Link>
              </div>
              <div className="relative mx-auto w-full max-w-[340px] h-[600px] flex items-center justify-center">
                <MarketMockup />
              </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 sm:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">
                {t('welcome.testimonials_title')}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t('welcome.testimonials_subtitle')}
              </p>
            </div>
            <div className="mt-16">
              <Carousel
                plugins={[
                  Autoplay({
                    delay: 4000,
                    stopOnInteraction: true,
                  }),
                ]}
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-4">
                  {testimonials.map((testimonial) => (
                    <CarouselItem key={testimonial.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                      <div className="h-full p-px">
                        <Card className="flex flex-col h-full shadow-lg">
                          <CardContent className="flex-1 flex flex-col p-6">
                            <p className="flex-1 text-muted-foreground italic">"{t(testimonial.quoteKey)}"</p>
                            <div className="mt-6 flex items-center gap-4">
                              {testimonial.imageUrl && <Image
                                src={testimonial.imageUrl}
                                alt={`Photo of ${t(testimonial.nameKey)}`}
                                width={48}
                                height={48}
                                className="rounded-full object-cover"
                                data-ai-hint={testimonial.imageHint}
                              />}
                              <div>
                                <p className="font-semibold">{t(testimonial.nameKey)}</p>
                                <p className="text-sm text-muted-foreground">{t(testimonial.businessKey)}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          </div>
        </section>

        {/* AI Section */}
        <section className="bg-card/30 py-24 sm:py-32">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">
                {t('welcome.ai_title')}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t('welcome.ai_subtitle')}
              </p>
              <Link href="/signup" passHref>
                <Button size="lg" className="mt-8 h-12 text-base">
                  {t('welcome.ai_cta')}
                </Button>
              </Link>
            </div>
            <div className="space-y-4">
              <Card className="shadow-lg">
                <CardHeader className="flex-row items-center gap-4">
                  <p className="font-semibold">{t('welcome.ai_q1')}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-primary font-medium">{t('welcome.ai_a1')}</p>
                </CardContent>
              </Card>
              <Card className="shadow-lg">
                 <CardHeader className="flex-row items-center gap-4">
                  <p className="font-semibold">{t('welcome.ai_q2')}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-success font-medium">{t('welcome.ai_a2')}</p>
                </CardContent>
              </Card>
               <Card className="shadow-lg">
                 <CardHeader className="flex-row items-center gap-4">
                  <p className="font-semibold">{t('welcome.ai_q3')}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-warning font-medium">{t('welcome.ai_a3')}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* BusmoPay Section */}
        <section className="py-24 sm:py-32">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="md:order-last">
              <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">
                 Sell products & share profits<br/><Logo variant="busmopay" className="inline-block text-[1em]" />
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                  The integrated payment solution for the Busmo marketplace. Accept payments via popular payment gateways and mobile money, and automatically distribute profits to your investors.
              </p>
              <ul className="mt-6 space-y-3 text-muted-foreground">
                  <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-accent"/>
                      <span>Enable payments and start selling online in minutes.</span>
                  </li>
                  <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-accent"/>
                      <span>Customers enjoy a unified and secure checkout experience.</span>
                  </li>
                   <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-accent"/>
                      <span>Get paid and see profit shares tracked automatically.</span>
                  </li>
              </ul>
              <Link href="/busmopay" passHref>
                <Button size="lg" className="mt-8 h-12 text-base">
                    Learn about BusmoPay
                </Button>
              </Link>
            </div>
            <div className="relative mx-auto w-full max-w-lg h-[550px] flex items-center justify-center">
                 <Card className="w-full h-4/5 flex flex-col p-4 shadow-lg">
                    <div className="text-center p-2 border-b">
                        <p className="text-sm font-semibold">Aisha's Crafts</p>
                    </div>
                    <div className="flex-1 flex flex-col justify-center items-center text-center space-y-2">
                        <CreditCard className="w-16 h-16 text-primary" />
                        <p className="text-3xl font-bold">₦12,500</p>
                        <p className="text-muted-foreground">Payment for Handmade Leather Bag</p>
                    </div>
                    <div className="p-2">
                        <Button className="w-full bg-primary hover:bg-primary/90">Pay Now</Button>
                    </div>
                </Card>
            </div>
          </div>
        </section>

        {/* Investor Section */}
        <section className="bg-card/30 py-24 sm:py-32">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="relative mx-auto w-full max-w-lg h-[550px] flex items-center justify-center">
                <InvestorMockup />
            </div>
            <div className="md:order-first">
                 <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl"
                    dangerouslySetInnerHTML={{ __html: t('welcome.investor_title') }}
                 />
                <p className="mt-4 text-lg text-muted-foreground">
                    {t('welcome.investor_subtitle')}
                </p>
                <ul className="mt-6 space-y-3 text-muted-foreground">
                    {(t('welcome.investor_features', { returnObjects: true }) as string[]).map((feature, i) => (
                        <li key={i} className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-accent"/>
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
                 <Link href="/invest" passHref>
                    <Button size="lg" className="mt-8 h-12 text-base">
                        {t('welcome.investor_cta')}
                    </Button>
                </Link>
            </div>
          </div>
        </section>

        {/* Why Busmo Section */}
        <section className="py-24 sm:py-32">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">{t('welcome.why_title')}</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        {t('welcome.why_subtitle')}
                    </p>
                </div>

                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <Card className="bg-card/30">
                        <CardHeader>
                            <CardTitle className="text-center font-headline text-destructive">{t('welcome.why_old_way')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <XCircle className="w-6 h-6 text-destructive mt-1 shrink-0" />
                                <div>
                                    <h4 className="font-semibold">{t('welcome.why_old_1_title')}</h4>
                                    <p className="text-sm text-muted-foreground">{t('welcome.why_old_1_desc')}</p>
                                </div>
                            </div>
                             <div className="flex items-start gap-3">
                                <XCircle className="w-6 h-6 text-destructive mt-1 shrink-0" />
                                <div>
                                    <h4 className="font-semibold">{t('welcome.why_old_2_title')}</h4>
                                    <p className="text-sm text-muted-foreground">{t('welcome.why_old_2_desc')}</p>
                                </div>
                            </div>
                             <div className="flex items-start gap-3">
                                <XCircle className="w-6 h-6 text-destructive mt-1 shrink-0" />
                                <div>
                                    <h4 className="font-semibold">{t('welcome.why_old_3_title')}</h4>
                                    <p className="text-sm text-muted-foreground">{t('welcome.why_old_3_desc')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-accent shadow-accent/20 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-center font-headline text-accent">{t('welcome.why_busmo_way')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-6 h-6 text-accent mt-1 shrink-0" />
                                <div>
                                    <h4 className="font-semibold">{t('welcome.why_busmo_1_title')}</h4>
                                    <p className="text-sm text-muted-foreground">{t('welcome.why_busmo_1_desc')}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-6 h-6 text-accent mt-1 shrink-0" />
                                <div>
                                    <h4 className="font-semibold">{t('welcome.why_busmo_2_title')}</h4>
                                    <p className="text-sm text-muted-foreground">{t('welcome.why_busmo_2_desc')}</p>
                                </div>
                            </div>
                             <div className="flex items-start gap-3">
                                <CheckCircle className="w-6 h-6 text-accent mt-1 shrink-0" />
                                <div>
                                    <h4 className="font-semibold">{t('welcome.why_busmo_3_title')}</h4>
                                    <p className="text-sm text-muted-foreground">{t('welcome.why_busmo_3_desc')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                 <div className="mt-20 text-center">
                    <h3 className="text-2xl font-bold tracking-tight font-headline">{t('welcome.who_title')}</h3>
                     <p className="mt-2 text-muted-foreground max-w-xl mx-auto">{t('welcome.who_subtitle')}</p>
                    <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
                        <div className="flex flex-col items-center gap-3">
                            <Store className="w-10 h-10 text-primary"/>
                            <p className="font-semibold">{t('welcome.who_1')}</p>
                        </div>
                         <div className="flex flex-col items-center gap-3">
                            <UtensilsCrossed className="w-10 h-10 text-primary"/>
                            <p className="font-semibold">{t('welcome.who_2')}</p>
                        </div>
                         <div className="flex flex-col items-center gap-3">
                            <ShoppingCart className="w-10 h-10 text-primary"/>
                            <p className="font-semibold">{t('welcome.who_3')}</p>
                        </div>
                         <div className="flex flex-col items-center gap-3">
                            <Building className="w-10 h-10 text-primary"/>
                            <p className="font-semibold">{t('welcome.who_4')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-card/30 py-24 sm:py-32">
            <div className="container mx-auto px-4 max-w-3xl">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">
                        {t('welcome.faq_title')}
                    </h2>
                </div>
                <Accordion type="single" collapsible className="w-full mt-12">
                     {faqItems.map(item => (
                        <AccordionItem key={item.value} value={item.value}>
                            <AccordionTrigger className="text-lg font-semibold">{item.question}</AccordionTrigger>
                            <AccordionContent className="text-base text-muted-foreground">
                                {item.answer}
                            </AccordionContent>
                        </AccordionItem>
                     ))}
                </Accordion>
            </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 sm:py-32 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">
              {t('welcome.final_cta_title')}
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-lg text-primary-foreground/80">
              {t('welcome.final_cta_subtitle')}
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/signup" passHref>
                <Button size="lg" variant="secondary" className="h-14 text-lg px-8">
                  {t('welcome.cta')}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 items-center justify-between gap-4 py-8 px-4 text-center md:text-left">
          <Logo className="h-7 mx-auto md:mx-0" />
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} business money.
          </p>
          <div className="flex items-center gap-4 mx-auto md:ml-auto md:mr-0">
            <Link href="/terms" className="text-sm hover:underline">{t('footer.privacy')}</Link>
             <Link href="/terms" className="text-sm hover:underline">{t('footer.terms')}</Link>
          </div>
        </div>
      </footer>
      <Sheet onOpenChange={(isOpen) => { if (!isOpen) setChatView('initial') }}>
        <SheetTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50"
            size="icon"
            aria-label="Chat with support"
          >
            <MessageSquare className="h-8 w-8" />
            <span className="sr-only">Chat with support</span>
          </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col">
            {chatView === 'initial' && (
            <>
                <SheetHeader>
                <SheetTitle>Customer Support</SheetTitle>
                <SheetDescription>
                   {activeConversation ? 'Continue your active conversation or start a new one.' : 'Our team is here to help. How can we assist you?'}
                </SheetDescription>
                </SheetHeader>
                <div className="flex-1 py-4 overflow-y-auto pr-2 -mr-6 space-y-6">
                    {user && activeConversation && (
                         <div>
                            <h3 className="font-semibold text-sm text-muted-foreground mb-2">Active Conversation</h3>
                            <button
                                onClick={() => handleConversationClick(activeConversation.id)}
                                className="w-full text-left p-3 rounded-lg border bg-primary/50 border-primary/50 hover:bg-primary/60"
                            >
                                <div className="flex items-center gap-3">
                                    {activeChatAgent ? (
                                        <Avatar className="h-10 w-10">
                                            {activeChatAgent.avatarUrl ? (
                                                <Image src={activeChatAgent.avatarUrl} alt={activeChatAgent.displayName} width={40} height={40} data-ai-hint="support agent" />
                                            ) : (
                                                <AvatarFallback>{activeChatAgent.displayName.charAt(0)}</AvatarFallback>
                                            )}
                                        </Avatar>
                                    ) : (
                                        <Avatar className="h-10 w-10"><AvatarFallback>?</AvatarFallback></Avatar>
                                    )}
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">
                                            Chat with {activeChatAgent ? activeChatAgent.displayName : 'an agent'}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate mt-1 flex items-center">
                                            {activeConversation.lastMessage === 'Image' && <ImageIcon className="w-3 h-3 mr-1.5 inline-block shrink-0" />}
                                            <span className="truncate">{activeConversation.lastMessage === 'Image' ? 'Image Sent' : activeConversation.lastMessage}</span>
                                        </p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    )}
                    {user && pastConversations && pastConversations.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-sm text-muted-foreground mb-2">{activeConversation ? 'Past Conversations' : 'Your Conversations'}</h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                {pastConversations.map(convo => (
                                    <button key={convo.id} onClick={() => handleConversationClick(convo.id)} className="w-full text-left p-2 rounded-md border hover:bg-muted/50">
                                        <div className="text-sm font-medium truncate flex items-center">
                                            {convo.lastMessage === 'Image' && <ImageIcon className="w-4 h-4 mr-2 inline-block shrink-0" />}
                                            <span className="flex-1 truncate">{convo.lastMessage === 'Image' ? 'Image Sent' : convo.lastMessage}</span>
                                            {convo.status === 'closed' && <Badge variant="secondary" className="ml-2">Closed</Badge>}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">{convo.lastMessageAt?.toDate().toLocaleString()}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div>
                        <h3 className="font-semibold text-sm text-muted-foreground mb-2">Available Agents</h3>
                        <div className="space-y-3">
                        {isLoadingAgents ? (
                            <>
                                <div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-1"><Skeleton className="h-4 w-20" /><Skeleton className="h-3 w-16" /></div></div>
                            </>
                        ) : agentsError ? (
                            <p className="text-sm text-destructive text-center py-4">Could not load agent list.</p>
                        ) : allAgents && allAgents.length > 0 ? (
                            allAgents.map(agent => (
                                <div key={agent.userId} className="flex items-center gap-3">
                                    <div className="relative">
                                    <Avatar className="h-10 w-10">
                                        {agent.avatarUrl ? (
                                            <Image src={agent.avatarUrl} alt={agent.displayName} width={40} height={40} data-ai-hint="support agent" />
                                        ) : (
                                            <AvatarFallback>{agent.displayName.charAt(0)}</AvatarFallback>
                                        )}
                                    </Avatar>
                                    {agent.status === 'online' ? (
                                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                                    ) : (
                                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-yellow-400 ring-2 ring-background" />
                                    )}
                                    </div>
                                    <div>
                                    <p className="font-semibold">{agent.displayName}</p>
                                    <p className="text-xs text-muted-foreground capitalize">Support Agent ({agent.status}) {agent.language && `- ${agent.language.toUpperCase()}`}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No support agents have been set up yet.</p>
                        )}
                        </div>
                    </div>
                </div>
                <SheetFooter className="flex-col-reverse sm:flex-col-reverse gap-2 pt-4 border-t">
                <Button onClick={handleStartChat} className="w-full h-12 text-base" disabled={isLoadingAgents || !!agentsError || !canChat}>Start New Conversation</Button>
                <Button onClick={() => setChatView('ticket')} variant="outline" className="w-full h-12 text-base">Create Support Ticket</Button>
                </SheetFooter>
            </>
            )}
            {chatView === 'chat' && (
            <>
                <SheetHeader className="flex-row items-center gap-3 pb-2 border-b">
                    <Button variant="ghost" size="icon" className="-ml-2" onClick={() => setChatView('initial')}>
                    <ArrowLeft className="h-5 w-5" />
                    </Button>
                     {assignedAgent ? (
                        <div className="flex items-center gap-3">
                            <div className="relative">
                            <Avatar className="h-10 w-10">
                                {assignedAgent.avatarUrl ? (
                                    <Image src={assignedAgent.avatarUrl} alt={assignedAgent.displayName} width={40} height={40} data-ai-hint="support agent" />
                                ) : (
                                    <AvatarFallback>{assignedAgent.displayName.charAt(0)}</AvatarFallback>
                                )}
                            </Avatar>
                            {assignedAgent.status === 'online' && <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />}
                            </div>
                            <div>
                            <SheetTitle>{assignedAgent.displayName}</SheetTitle>
                            <SheetDescription>Support Agent</SheetDescription>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <SheetTitle>Connecting...</SheetTitle>
                            <SheetDescription>Waiting for an agent.</SheetDescription>
                        </div>
                    )}
                </SheetHeader>
                <div className="flex-1 space-y-4 py-4 pr-4 overflow-y-auto -mr-6">
                {isLoadingMessages ? (
                  <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : realChatMessages ? (
                  realChatMessages.map(msg => (
                    <div key={msg.id} className={`flex items-start gap-3 ${msg.senderId === user?.uid ? 'justify-end' : ''}`}>
                      {msg.senderId !== user?.uid && assignedAgent && (
                        <Avatar className="w-8 h-8 border">
                             {assignedAgent.avatarUrl ? (
                                <Image src={assignedAgent.avatarUrl} alt={assignedAgent.displayName} width={32} height={32} data-ai-hint="support agent" />
                            ) : (
                                <AvatarFallback>{assignedAgent.displayName.charAt(0)}</AvatarFallback>
                            )}
                        </Avatar>
                      )}
                      <div className={`rounded-xl p-3 text-sm max-w-[80%] ${msg.senderId === user?.uid ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card border rounded-bl-none'}`}>
                        {msg.text && <p>{msg.text}</p>}
                        {msg.imageUrl && (
                            <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                                <Image src={msg.imageUrl} alt="User upload" width={200} height={200} className="rounded-lg mt-2 cursor-pointer" />
                            </a>
                        )}
                      </div>
                    </div>
                  ))
                ) : null}
                <div ref={chatMessagesEndRef} />
                </div>
                <SheetFooter className="pt-4 -mx-6 px-6 pb-6 border-t bg-background">
                <form
                    onSubmit={handleSendTextMessage}
                    className="flex w-full items-center gap-2"
                >
                    <Button variant="ghost" size="icon" type="button" onClick={() => fileInputRef.current?.click()} className="shrink-0 h-12 w-12"><FileUp className="h-6 w-6" /></Button>
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type your message..."
                      className="h-12 flex-1 text-base"
                    />
                    <Input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    <Button type="submit" size="icon" className="h-12 w-12 shrink-0">
                        <Send className="h-6 w-6" />
                    </Button>
                </form>
                </SheetFooter>
            </>
            )}
            {chatView === 'ticket' && (
            <>
                <SheetHeader className="flex-row items-center gap-3 pb-2 border-b">
                    <Button variant="ghost" size="icon" className="-ml-2" onClick={() => setChatView('initial')}>
                    <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                    <SheetTitle>Create a Support Ticket</SheetTitle>
                    <SheetDescription>We'll get back to you via email.</SheetDescription>
                    </div>
                </SheetHeader>
                <form onSubmit={handleCreateTicket} className="flex-1 py-4 flex flex-col gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="ticket-subject">Subject</Label>
                        <Input id="ticket-subject" value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} placeholder="e.g., Issue with my latest report" required />
                    </div>
                    <div className="space-y-2 flex-1 flex flex-col">
                        <Label htmlFor="ticket-message">Message</Label>
                        <Textarea id="ticket-message" value={ticketMessage} onChange={e => setTicketMessage(e.target.value)} placeholder="Please describe your issue in detail..." className="flex-1" required />
                    </div>
                    <SheetFooter className="pt-4">
                    <Button type="submit" className="w-full h-12 text-base">Submit Ticket</Button>
                    </SheetFooter>
                </form>
            </>
            )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

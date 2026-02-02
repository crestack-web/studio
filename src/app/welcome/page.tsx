'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/app/logo';
import { Activity, BarChart, Building, CheckCircle, HelpCircle, Landmark, Menu, MessageSquare, Package, Send, ShoppingCart, Store, TrendingUp, UtensilsCrossed, XCircle, ArrowLeft, CreditCard, Loader2, FileUp, Image as ImageIcon, Instagram, Facebook } from 'lucide-react';
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
import { collection, query, where, serverTimestamp, doc } from 'firebase/firestore';
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
             <Link href="/welcome" passHref>
              <Button variant="ghost">{t('nav.home')}</Button>
            </Link>
             <Link href="/invest" passHref>
              <Button variant="ghost">{t('nav.investors')}</Button>
            </Link>
            <Link href="/pricing" passHref>
              <Button variant="ghost">{t('nav.pricing')}</Button>
            </Link>
            <ThemeToggle />
            <LanguageSwitcher />
            <Separator orientation="vertical" className="h-8" />
            <Link href="/login" passHref>
              <Button variant="ghost">{t('nav.login')}</Button>
            </Link>
            <Link href="/signup" passHref>
              <Button>{t('nav.signup')}</Button>
            </Link>
          </nav>
           <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        
        

        
        
      </main>

      {/* Footer */}
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
      
    </div>
  );
}

'use client';

import { useUser, useCollection, useMemoFirebase, useFirestore, useDoc } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import {
  BotMessageSquare,
  CreditCard,
  FileText,
  Gift,
  Landmark,
  LayoutDashboard,
  Loader2,
  Menu,
  Store,
  Users,
} from 'lucide-react';
import { collection, query, Timestamp, doc, orderBy, limit } from 'firebase/firestore';
import Link from 'next/link';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/app/logo';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { LanguageSwitcher } from '@/components/app/language-switcher';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useLanguage } from '@/context/language-provider';

const LoadingScreen = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

interface Subscription {
  id: string;
  planId: string;
  status: 'active' | 'trialing' | 'cancelled' | 'past_due';
  currentPeriodEnd: Timestamp;
}

interface UserProfile {
  businessId?: string;
}

interface BusinessProfile {
  plan?: string;
  onboardingCompleted?: boolean;
  businessName?: string;
  country?: string;
}

type OwnerMenuItem = {
  id: string;
  label: string;
  href: string;
  icon: any;
  show?: (ctx: { businessCountry?: string }) => boolean;
};

function OwnerAppShell({
  children,
  userDisplayName,
  businessName,
  businessCountry,
}: {
  children: React.ReactNode;
  userDisplayName?: string;
  businessName?: string;
  businessCountry?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { t } = useLanguage();
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  const menuItems: OwnerMenuItem[] = useMemo(
    () => [
      { id: 'home', label: 'Home', href: '/owner/home', icon: LayoutDashboard },
      { id: 'statement', label: t('ownerHome.viewStatement'), href: '/owner/summary', icon: FileText },
      { id: 'ask', label: t('askBusmo.title'), href: '/owner/ask', icon: BotMessageSquare },
      { id: 'referrals', label: t('ownerHome.referralTitle'), href: '/owner/referrals', icon: Gift },
      { id: 'market', label: t('ownerHome.manageMyMarket'), href: '/owner/market', icon: Store },
      {
        id: 'busmopay',
        label: 'BusmoPay',
        href: '/owner/busmopay',
        icon: CreditCard,
        show: ({ businessCountry }) => businessCountry === 'NG',
      },
      { id: 'staff', label: t('ownerHome.manageStaff'), href: '/owner/staff', icon: Users },
      { id: 'capital', label: t('ownerHome.accessCapitalTitle'), href: '/owner/invest', icon: Landmark },
    ],
    [t]
  );

  const visibleMenuItems = menuItems.filter((item) => (item.show ? item.show({ businessCountry }) : true));

  const SidebarContent = () => (
    <>
      <SidebarHeader>
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center p-2">
          <Logo className="h-8 group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarHeader>
      <SidebarMenu className="flex-1 px-2">
        {visibleMenuItems.map((item) => (
          <SidebarMenuItem key={item.id}>
            <Link
              href={item.href}
              onClick={() => {
                setIsMobileSheetOpen(false);
              }}
            >
              <SidebarMenuButton
                isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                tooltip={item.label}
                className="justify-start group-data-[collapsible=icon]:justify-center"
              >
                <item.icon />
                <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </>
  );

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
    }
    router.push('/login');
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar collapsible="icon">
          <SidebarContent />
        </Sidebar>

        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-2 border-b bg-background px-4">
            <div className="flex items-center gap-2">
              <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full max-w-xs p-0">
                  <Sidebar className="[&>div]:hidden">
                    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
                      <SidebarContent />
                    </div>
                  </Sidebar>
                </SheetContent>
              </Sheet>
              <SidebarTrigger className="hidden md:flex" />
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageSwitcher />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 p-1 h-auto">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {(userDisplayName || '')
                          .split(' ')
                          .filter(Boolean)
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="font-semibold text-sm">{userDisplayName}</span>
                      <span className="text-xs text-muted-foreground">{businessName}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t('ownerHome.myAccount')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/owner/pricing">{t('ownerHome.billing')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    {t('ownerHome.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

const ProtectedOwnerLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const subscriptionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, `users/${user.uid}/subscriptions`),
      orderBy('currentPeriodEnd', 'desc'),
      limit(1)
    );
  }, [firestore, user]);
  const { data: subscriptions, isLoading: isLoadingSubscriptions } = useCollection<Subscription>(subscriptionsQuery);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isLoadingUserProfile } = useDoc<UserProfile>(userProfileRef);

  const businessProfileRef = useMemoFirebase(() => {
    if (!firestore || !userProfile?.businessId) return null;
    return doc(firestore, `businesses/${userProfile.businessId}`);
  }, [firestore, userProfile?.businessId]);
  const { data: businessProfile, isLoading: isLoadingBusiness } = useDoc<BusinessProfile>(businessProfileRef);

  const isLoading = isUserLoading || isLoadingSubscriptions || isLoadingUserProfile || isLoadingBusiness;
  const hasPlan = Boolean(businessProfile?.plan);
  const onboardingCompleted = Boolean(businessProfile?.onboardingCompleted);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      if (!pathname.startsWith('/login')) {
        router.replace('/login');
      }
      return;
    }

    const subscription = subscriptions?.[0];
    const isBillingRoute = pathname.startsWith('/owner/pricing') || pathname.startsWith('/owner/subscribe');

    if (!subscription) {
      // During onboarding, force plan selection.
      if (!onboardingCompleted && !hasPlan) {
        if (!isBillingRoute) {
          router.replace('/owner/pricing');
        }
        return;
      }

      // If onboarding is complete (or a plan exists) but the subscription doc is missing,
      // treat it as a billing issue and route to subscribe.
      if (!pathname.startsWith('/owner/subscribe')) {
        router.replace('/owner/subscribe');
      }
      return;
    }

    const isExpired = new Date() > subscription.currentPeriodEnd.toDate();
    const isTrialing = subscription.status === 'trialing';
    const isActive = subscription.status === 'active';
    const isInvalid = subscription.status === 'cancelled'
      || subscription.status === 'past_due'
      || ((isTrialing || isActive) && isExpired);

    if (isTrialing && !isExpired && isBillingRoute) {
      router.replace('/owner/home');
      return;
    }

    if (isInvalid && !isBillingRoute) {
      router.replace('/owner/subscribe');
      return;
    }
  }, [isLoading, user, subscriptions, pathname, router, hasPlan, onboardingCompleted]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (user) {
    // The Market area already has an internal sidebar + header.
    // Rendering the global owner shell there would create a nested sidebar UX.
    if (pathname.startsWith('/owner/market')) {
      return <>{children}</>;
    }

    return (
      <OwnerAppShell
        userDisplayName={(userProfile as any)?.displayName}
        businessName={businessProfile?.businessName}
        businessCountry={businessProfile?.country}
      >
        {children}
      </OwnerAppShell>
    );
  }

  return <LoadingScreen />;
};

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedOwnerLayout>{children}</ProtectedOwnerLayout>;
}

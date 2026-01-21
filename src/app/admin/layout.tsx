'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc } from 'firebase/firestore';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { LayoutDashboard, Newspaper, Mail } from 'lucide-react';
import { Logo } from '@/components/app/logo';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface UserProfile {
    role?: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
  
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authCheckCompleted, setAuthCheckCompleted] = useState(false);
  
  useEffect(() => {
    if (isUserLoading || isProfileLoading) {
      return; // Still loading, do nothing
    }

    if (user && userProfile?.role === 'Admin') {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
      router.replace('/admin/login');
    }
    setAuthCheckCompleted(true);
    
  }, [user, userProfile, isUserLoading, isProfileLoading, router]);

  // Show a loader until the initial authentication check is complete.
  if (!authCheckCompleted) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If authorized, render the admin layout.
  if (isAuthorized) {
    const menuItems = [
      { id: 'dashboard', label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { id: 'blog', label: 'Blog', href: '/admin/blog', icon: Newspaper },
      { id: 'support', label: 'Support', href: '/admin/support', icon: Mail },
    ];

    return (
      <SidebarProvider>
          <div className="flex min-h-screen bg-background text-foreground">
              <Sidebar>
                  <SidebarHeader>
                      <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center p-2">
                          <Logo className="h-8 group-data-[collapsible=icon]:hidden" />
                          <SidebarTrigger className="hidden md:flex" />
                      </div>
                  </SidebarHeader>
                  <SidebarMenu className="flex-1 px-2">
                      {menuItems.map((item) => (
                          <SidebarMenuItem key={item.id}>
                              <Link href={item.href}>
                                  <SidebarMenuButton
                                      isActive={pathname.startsWith(item.href)}
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
              </Sidebar>

              <SidebarInset>
                  {children}
              </SidebarInset>
          </div>
      </SidebarProvider>
    );
  }

  // If not authorized, show a loader while redirecting.
  return (
    <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

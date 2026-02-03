
'use client';

import { SidebarProvider, Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { LayoutDashboard, Newspaper, Mail, Users, Loader2, Store, Package, LayoutGrid, Menu, Contact, Ticket, ShieldCheck, ShoppingCart, Truck, Megaphone, Briefcase } from 'lucide-react';
import { Logo } from '@/components/app/logo';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface AppUser {
  role?: string;
}

interface AdminPermission {
  isSuperAdmin?: boolean;
  canManageUsers?: boolean;
  canManageVerifications?: boolean;
  canManageOrders?: boolean;
  canManageMarketplace?: boolean;
  canManageBlog?: boolean;
  canManageSupport?: boolean;
  canManageCoupons?: boolean;
  canManageAnnouncements?: boolean;
  canManageServices?: boolean;
}

const LoadingScreen = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// This component is a wrapper to contain the auth logic.
const ProtectedAdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);

  const permissionsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, `admin_permissions/${user.uid}`);
  }, [firestore, user]);
  const { data: permissions, isLoading: isLoadingPermissions } = useDoc<AdminPermission>(permissionsRef);
  
  const isLoading = isUserLoading || (user && (isProfileLoading || isLoadingPermissions));

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      if (!pathname.startsWith('/admin/login') && !pathname.startsWith('/admin/finish-signin')) {
        router.replace('/admin/login');
      }
      return;
    }
    
    const isSuperAdmin = user.email === 'crestack@gmail.com' || permissions?.isSuperAdmin;
    const isAdmin = userProfile?.role === 'Admin' || isSuperAdmin;
    
    if (!isAdmin) {
      // If the user is authenticated but not an admin, redirect them to their correct dashboard.
      switch (userProfile?.role) {
        case 'Owner':
          router.replace('/owner/home');
          break;
        case 'Staff':
          router.replace('/staff/home');
          break;
        case 'Investor':
          router.replace('/investor/dashboard');
          break;
        case 'Delivery Agent':
          router.replace('/delivery-agent/dashboard');
          break;
        default:
          // If role is unknown or not set, redirect to the general login page.
          router.replace('/login');
          break;
      }
    }
  }, [user, userProfile, permissions, isLoading, pathname, router]);
  
  // These pages don't need the protected layout
  if (pathname.startsWith('/admin/login') || pathname.startsWith('/admin/finish-signin')) {
    return <>{children}</>;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }
  
  const isSuperAdmin = user?.email === 'crestack@gmail.com' || permissions?.isSuperAdmin;
  if(user && (userProfile?.role === 'Admin' || isSuperAdmin)) {
    return (
      <AdminLayout permissions={permissions || {}} isSuperAdmin={!!isSuperAdmin}>
        {children}
      </AdminLayout>
    );
  }

  return <LoadingScreen />;
};


function AdminLayout({
  children,
  permissions,
  isSuperAdmin,
}: {
  children: React.ReactNode;
  permissions: AdminPermission;
  isSuperAdmin: boolean;
}) {
  const pathname = usePathname();
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', href: '/admin/users', icon: Users, permission: 'canManageUsers' },
    { id: 'verifications', label: 'Verifications', href: '/admin/verifications', icon: ShieldCheck, permission: 'canManageVerifications' },
    { id: 'orders', label: 'Orders', href: '/admin/orders', icon: ShoppingCart, permission: 'canManageOrders' },
    { id: 'delivery-agents', label: 'Delivery Agents', href: '/admin/delivery-agents', icon: Truck, permission: 'canManageOrders' },
    { id: 'market', label: 'Market', href: '/admin/market', icon: Store, permission: 'canManageMarketplace' },
    { id: 'products', label: 'Products', href: '/admin/products', icon: Package, permission: 'canManageMarketplace' },
    { id: 'categories', label: 'Categories', href: '/admin/categories', icon: LayoutGrid, permission: 'canManageMarketplace' },
    { id: 'announcements', label: 'Announcements', href: '/admin/announcements', icon: Megaphone, permission: 'canManageAnnouncements' },
    { id: 'coupons', label: 'Coupons', href: '/admin/coupons', icon: Ticket, permission: 'canManageCoupons' },
    { id: 'services', label: 'Services', href: '/admin/services', icon: Briefcase, permission: 'canManageServices' },
    { id: 'blog', label: 'Blog', href: '/admin/blog', icon: Newspaper, permission: 'canManageBlog' },
    { id: 'support', label: 'Support', href: '/admin/support', icon: Mail, permission: 'canManageSupport' },
    { id: 'agents', label: 'Agents', href: '/admin/agents', icon: Contact, permission: 'canManageSupport' },
  ];
  
  const visibleMenuItems = menuItems.filter(item => 
    isSuperAdmin || !item.permission || permissions[item.permission as keyof AdminPermission]
  );
  
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
    </>
  )

  return (
    <SidebarProvider>
        <div className="flex min-h-screen bg-background text-foreground">
            <Sidebar>
              <SidebarContent />
            </Sidebar>

            <SidebarInset>
                <header className="sticky top-0 z-10 flex h-16 items-center gap-2 border-b bg-background px-4">
                  <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
                      <SheetTrigger asChild>
                          <Button variant="ghost" size="icon" className="md:hidden"><Menu className="h-5 w-5"/></Button>
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
                </header>
                {children}
            </SidebarInset>
        </div>
    </SidebarProvider>
  );
}

export default ProtectedAdminLayout;

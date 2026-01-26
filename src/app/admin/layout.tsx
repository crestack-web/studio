'use client';

import { SidebarProvider, Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { LayoutDashboard, Newspaper, Mail, Users } from 'lucide-react';
import { Logo } from '@/components/app/logo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// This layout has been stripped of its authentication logic for UI prototyping.
// In a real application, this is where you would protect the /admin routes
// and only allow users with the 'Admin' role to access them.

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', href: '/admin/users', icon: Users },
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

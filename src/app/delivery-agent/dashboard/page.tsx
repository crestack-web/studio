
'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collectionGroup, query, where, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LogOut, Bike, Check, MoreHorizontal } from 'lucide-react';
import { Logo } from '@/components/app/logo';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { useAuth } from '@/firebase';
import { format, formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuSubTrigger
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface Order {
    id: string;
    sellerBusinessId: string;
    customer: { name: string; phone: string; address?: string };
    createdAt: { toDate: () => Date };
    total: number;
    status: 'pending' | 'confirmed' | 'in progress' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
}

interface DeliveryAgent {
    status: 'available' | 'on-delivery' | 'unavailable';
}

const statusVariant: { [key in Order['status']]: "default" | "secondary" | "destructive" | "outline" | "success" } = {
    pending: 'secondary',
    confirmed: 'outline',
    'in progress': 'default',
    shipped: 'default',
    delivered: 'success',
    cancelled: 'destructive',
    returned: 'destructive',
};

export default function DeliveryAgentDashboardPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const agentRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'deliveryAgents', user.uid);
    }, [firestore, user]);
    const { data: agentData, isLoading: isLoadingAgent } = useDoc<DeliveryAgent>(agentRef);

    const ordersQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collectionGroup(firestore, 'orders'),
            where('deliveryAgentId', '==', user.uid),
            where('status', 'in', ['in progress', 'shipped'])
        );
    }, [firestore, user]);
    const { data: orders, isLoading: isLoadingOrders } = useCollection<Order>(ordersQuery);

    const handleUpdateStatus = (order: Order, status: Order['status']) => {
        if (!firestore) return;
        const orderRef = doc(firestore, `businesses/${order.sellerBusinessId}/orders`, order.id);
        updateDocumentNonBlocking(orderRef, { status });
        toast({ title: 'Order Updated', description: `Order status changed to ${status}.` });
    };

    const handleSignOut = async () => {
        if (auth) {
            await signOut(auth);
        }
        router.push('/delivery-agent/login');
    };

    const isLoading = isUserLoading || isLoadingOrders || isLoadingAgent;

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <header className="flex items-center justify-between p-4 border-b bg-card">
                <Logo className="h-8" />
                <div className="flex items-center gap-4">
                    {isLoading ? <Skeleton className="h-6 w-24" /> : (
                        <div className="text-right">
                            <div className="font-semibold">{user?.displayName}</div>
                            <div className="text-xs text-muted-foreground capitalize">Delivery Agent - {agentData?.status}</div>
                        </div>
                    )}
                    <Button variant="ghost" size="icon" onClick={handleSignOut}>
                        <LogOut className="h-5 w-5" />
                        <span className="sr-only">Sign Out</span>
                    </Button>
                </div>
            </header>
            <main className="flex-1 flex flex-col items-center p-4 sm:p-6">
                <div className="w-full max-w-4xl space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bike className="h-6 w-6 text-primary" />
                                Your Active Deliveries
                            </CardTitle>
                            <CardDescription>
                                These are the orders currently assigned to you for delivery.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order ID</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Address</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading deliveries...</TableCell></TableRow>
                                    ) : orders && orders.length > 0 ? (
                                        orders.map(order => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-mono text-xs">#{order.id.substring(0, 7)}</TableCell>
                                                <TableCell>{order.customer.name}<br/><span className="text-xs text-muted-foreground">{order.customer.phone}</span></TableCell>
                                                <TableCell className="text-sm">{order.customer.address}</TableCell>
                                                <TableCell>
                                                    <Badge variant={statusVariant[order.status]} className="capitalize">{order.status}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleUpdateStatus(order, 'shipped')}>Mark as Shipped</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleUpdateStatus(order, 'delivered')}><Check className="mr-2 h-4 w-4" />Mark as Delivered</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={5} className="h-24 text-center">No active deliveries assigned to you.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}

    
'use client';
import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, doc, collectionGroup } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Truck, UserCheck, Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/currency';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Interfaces based on backend.json
interface Order {
    id: string;
    customer: { name: string; phone: string; address?: string };
    createdAt: { toDate: () => Date };
    total: number;
    status: 'pending' | 'confirmed' | 'in progress' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
    fulfillment: string;
    payment: string;
    items: { productId: string; productName: string; variantId?: string; variantName?: string; quantity: number; price: number }[];
    sellerBusinessId: string;
    deliveryAgentId?: string;
}

interface Business {
    id: string;
    businessName: string;
    currency: string;
}

interface DeliveryAgent {
    userId: string;
    displayName: string;
    status: 'available' | 'on-delivery' | 'unavailable';
}

const statusVariant: { [key in Order['status']]: "default" | "secondary" | "destructive" | "outline" | "success" } = {
    pending: 'secondary',
    confirmed: 'default',
    'in progress': 'default',
    shipped: 'default',
    delivered: 'success',
    cancelled: 'destructive',
    returned: 'destructive',
};

export default function AdminOrdersPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [assignAgentOrder, setAssignAgentOrder] = useState<Order | null>(null);
    const [selectedAgentId, setSelectedAgentId] = useState<string>('');
    const [isAssigning, setIsAssigning] = useState(false);

    // Query all orders from all businesses using a collection group
    const ordersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collectionGroup(firestore, 'orders'));
    }, [firestore]);
    const { data: orders, isLoading: isLoadingOrders } = useCollection<Order>(ordersQuery);

    const businessesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'businesses'));
    }, [firestore]);
    const { data: businesses, isLoading: isLoadingBusinesses } = useCollection<Business>(businessesQuery);
    
    const agentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'deliveryAgents'));
    }, [firestore]);
    const { data: agents, isLoading: isLoadingAgents } = useCollection<DeliveryAgent>(agentsQuery);

    const businessesMap = useMemo(() => new Map(businesses?.map(b => [b.id, b])), [businesses]);
    const agentsMap = useMemo(() => new Map(agents?.map(a => [a.userId, a])), [agents]);

    const sortedOrders = useMemo(() => {
        if (!orders) return [];
        return [...orders].sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
    }, [orders]);

    const handleAssignAgent = async () => {
        if (!firestore || !assignAgentOrder || !selectedAgentId) return;
        setIsAssigning(true);
        const orderRef = doc(firestore, `businesses/${assignAgentOrder.sellerBusinessId}/orders`, assignAgentOrder.id);
        
        try {
            await updateDocumentNonBlocking(orderRef, { deliveryAgentId: selectedAgentId, status: 'in progress' });
            toast({ title: 'Agent Assigned', description: 'The delivery agent has been assigned to the order.' });
            setAssignAgentOrder(null);
            setSelectedAgentId('');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not assign agent.' });
        } finally {
            setIsAssigning(false);
        }
    };
    
    const isLoading = isLoadingOrders || isLoadingBusinesses || isLoadingAgents;

    return (
        <main className="flex-1 p-4 sm:p-6 space-y-6">
            <h1 className="text-2xl font-bold font-headline">Order Management</h1>
            <div className="grid grid-cols-1 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>All Marketplace Orders</CardTitle>
                        <CardDescription>View and manage all incoming orders across all businesses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Business</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Agent</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={8} className="h-24 text-center">Loading orders...</TableCell></TableRow>
                                ) : sortedOrders && sortedOrders.length > 0 ? sortedOrders.map((order) => {
                                    const business = businessesMap.get(order.sellerBusinessId);
                                    const agent = order.deliveryAgentId ? agentsMap.get(order.deliveryAgentId) : null;
                                    return (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-mono text-xs">#{order.id.substring(0, 7)}</TableCell>
                                            <TableCell>{format(order.createdAt.toDate(), 'PP')}</TableCell>
                                            <TableCell>{business?.businessName}</TableCell>
                                            <TableCell>{order.customer.name}</TableCell>
                                            <TableCell><Badge variant={statusVariant[order.status]} className="capitalize">{order.status}</Badge></TableCell>
                                            <TableCell>{agent?.displayName || 'Unassigned'}</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(order.total, business?.currency)}</TableCell>
                                            <TableCell className="text-right">
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => setSelectedOrder(order)}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setAssignAgentOrder(order)}><Truck className="mr-2 h-4 w-4" />Assign Agent</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                }) : (
                                    <TableRow><TableCell colSpan={8} className="h-24 text-center">No orders found.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* View Details Dialog */}
            <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <DialogContent className="sm:max-w-lg">
                    {selectedOrder && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Order #{selectedOrder.id.substring(0,6).toUpperCase()}</DialogTitle>
                                <DialogDescription>{format(selectedOrder.createdAt.toDate(), 'PPP, p')}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <p><strong>Business:</strong> {businessesMap.get(selectedOrder.sellerBusinessId)?.businessName}</p>
                                <p><strong>Customer:</strong> {selectedOrder.customer.name} ({selectedOrder.customer.phone})</p>
                                {selectedOrder.customer.address && <p><strong>Address:</strong> {selectedOrder.customer.address}</p>}
                                <p><strong>Fulfillment:</strong> <span className="capitalize">{selectedOrder.fulfillment}</span></p>
                                <p><strong>Payment:</strong> <span className="capitalize">{selectedOrder.payment}</span></p>
                                <h4 className="font-semibold pt-2 border-t">Items</h4>
                                <ul className="text-sm space-y-1">
                                    {selectedOrder.items.map((item, i) => (
                                        <li key={i} className="flex justify-between">
                                            <span>{item.quantity}x {item.productName} {item.variantName && `(${item.variantName})`}</span>
                                            <span>{formatCurrency(item.price * item.quantity, businessesMap.get(selectedOrder.sellerBusinessId)?.currency)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Assign Agent Dialog */}
             <Dialog open={!!assignAgentOrder} onOpenChange={(open) => !open && setAssignAgentOrder(null)}>
                <DialogContent className="sm:max-w-md">
                    {assignAgentOrder && (
                         <>
                            <DialogHeader>
                                <DialogTitle>Assign Delivery Agent</DialogTitle>
                                <DialogDescription>Assign an agent to order #{assignAgentOrder.id.substring(0,6).toUpperCase()}.</DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Select onValueChange={setSelectedAgentId} defaultValue={assignAgentOrder.deliveryAgentId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an available agent" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {agents?.filter(a => a.status === 'available').map(agent => (
                                            <SelectItem key={agent.userId} value={agent.userId}>
                                                {agent.displayName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {agents?.filter(a => a.status === 'available').length === 0 && <p className="text-xs text-muted-foreground mt-2">No agents are currently available.</p>}
                            </div>
                             <DialogFooter>
                                <Button variant="outline" onClick={() => setAssignAgentOrder(null)}>Cancel</Button>
                                <Button onClick={handleAssignAgent} disabled={!selectedAgentId || isAssigning}>
                                    {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Confirm Assignment
                                </Button>
                            </DialogFooter>
                         </>
                    )}
                </DialogContent>
            </Dialog>
        </main>
    );
}

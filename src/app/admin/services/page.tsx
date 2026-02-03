
'use client';
import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, doc, collectionGroup, orderBy } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/currency';

interface ServiceRequest {
    id: string;
    serviceName: string;
    serviceFee: number;
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
    paymentStatus: 'unpaid' | 'paid';
    createdAt: { toDate: () => Date };
    businessId: string;
    userId: string;
}

interface Business {
    id: string;
    businessName: string;
    currency: string;
}

const statusVariant: { [key in ServiceRequest['status']]: "default" | "secondary" | "destructive" | "outline" } = {
    pending: 'secondary',
    'in-progress': 'default',
    completed: 'outline',
    cancelled: 'destructive',
};

const paymentStatusVariant: { [key in ServiceRequest['paymentStatus']]: "default" | "destructive" } = {
    paid: 'default',
    unpaid: 'destructive',
};

export default function AdminServicesPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const requestsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collectionGroup(firestore, 'serviceRequests'), orderBy('createdAt', 'desc'));
    }, [firestore]);
    const { data: requests, isLoading: isLoadingRequests } = useCollection<ServiceRequest>(requestsQuery);

    const businessesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'businesses'));
    }, [firestore]);
    const { data: businesses, isLoading: isLoadingBusinesses } = useCollection<Business>(businessesQuery);
    
    const businessesMap = useMemo(() => new Map(businesses?.map(b => [b.id, b])), [businesses]);

    const handleUpdateStatus = async (request: ServiceRequest, status: ServiceRequest['status']) => {
        if (!firestore) return;
        const requestRef = doc(firestore, `businesses/${request.businessId}/serviceRequests`, request.id);
        
        try {
            await updateDocumentNonBlocking(requestRef, { status });
            toast({ title: 'Request Updated', description: `Status changed to ${status}.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update request status.' });
        }
    };
    
    const isLoading = isLoadingRequests || isLoadingBusinesses;

    return (
        <main className="flex-1 p-4 sm:p-6 space-y-6">
            <h1 className="text-2xl font-bold font-headline">Service Requests</h1>
            <div className="grid grid-cols-1 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>All Service Requests</CardTitle>
                        <CardDescription>View and manage all paid service requests from merchants.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Business</TableHead>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Payment</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Fee</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={7} className="h-24 text-center">Loading requests...</TableCell></TableRow>
                                ) : requests && requests.length > 0 ? requests.map((request) => {
                                    const business = businessesMap.get(request.businessId);
                                    return (
                                        <TableRow key={request.id}>
                                            <TableCell>{format(request.createdAt.toDate(), 'PP')}</TableCell>
                                            <TableCell>{business?.businessName}</TableCell>
                                            <TableCell className="font-medium">{request.serviceName}</TableCell>
                                            <TableCell><Badge variant={paymentStatusVariant[request.paymentStatus]} className="capitalize">{request.paymentStatus}</Badge></TableCell>
                                            <TableCell><Badge variant={statusVariant[request.status]} className="capitalize">{request.status}</Badge></TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(request.serviceFee, business?.currency)}</TableCell>
                                            <TableCell className="text-right">
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuSub>
                                                            <DropdownMenuSubTrigger>Update Status</DropdownMenuSubTrigger>
                                                            <DropdownMenuPortal>
                                                                <DropdownMenuSubContent>
                                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(request, 'in-progress')}>Mark as In Progress</DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(request, 'completed')}>Mark as Completed</DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(request, 'cancelled')} className="text-destructive">Cancel Request</DropdownMenuItem>
                                                                </DropdownMenuSubContent>
                                                            </DropdownMenuPortal>
                                                        </DropdownMenuSub>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                }) : (
                                    <TableRow><TableCell colSpan={7} className="h-24 text-center">No service requests found.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}

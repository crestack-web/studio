'use client';
import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface SupportTicket {
    id: string;
    subject: string;
    userName: string;
    status: 'open' | 'in-progress' | 'closed';
    createdAt: any; // Firestore Timestamp
}

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" } = {
    open: 'destructive',
    'in-progress': 'secondary',
    closed: 'default',
};

export default function AdminSupportPage() {
    const firestore = useFirestore();

    const ticketsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'supportTickets'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: tickets, isLoading } = useCollection<SupportTicket>(ticketsQuery);

    return (
        <main className="flex-1 p-4 sm:p-6">
            <h1 className="text-2xl font-bold font-headline mb-6">Support Tickets</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Incoming Support Requests</CardTitle>
                    <CardDescription>View and manage all support tickets submitted by users.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading tickets...</TableCell></TableRow>
                            ) : tickets && tickets.length > 0 ? tickets.map((ticket) => (
                                <TableRow key={ticket.id}>
                                    <TableCell>{ticket.createdAt.toDate().toLocaleDateString()}</TableCell>
                                    <TableCell>{ticket.userName}</TableCell>
                                    <TableCell className="font-medium">{ticket.subject}</TableCell>
                                    <TableCell>
                                        <Badge variant={statusVariant[ticket.status] || 'default'}>{ticket.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>View Ticket</DropdownMenuItem>
                                                <DropdownMenuItem>Mark as In Progress</DropdownMenuItem>
                                                <DropdownMenuItem>Mark as Closed</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">No support tickets found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </main>
    );
}

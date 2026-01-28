'use client';
import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SupportTicket {
    id: string;
    subject: string;
    userName: string;
    userEmail: string;
    message: string;
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
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

    const ticketsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'supportTickets'));
    }, [firestore]);

    const { data: tickets, isLoading } = useCollection<SupportTicket>(ticketsQuery);

    const sortedTickets = useMemo(() => {
        if (!tickets) return [];
        return [...tickets].sort((a, b) => {
            const dateA = a.createdAt?.toDate()?.getTime() || 0;
            const dateB = b.createdAt?.toDate()?.getTime() || 0;
            return dateB - dateA;
        });
    }, [tickets]);
    
    const handleUpdateStatus = (ticketId: string, status: SupportTicket['status']) => {
        if (!firestore) return;
        const ticketRef = doc(firestore, 'supportTickets', ticketId);
        updateDocumentNonBlocking(ticketRef, { status });
    };

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
                            ) : sortedTickets && sortedTickets.length > 0 ? sortedTickets.map((ticket) => (
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
                                                <DropdownMenuItem onClick={() => setSelectedTicket(ticket)}>View Ticket</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(ticket.id, 'in-progress')}>Mark as In Progress</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(ticket.id, 'closed')}>Mark as Closed</DropdownMenuItem>
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

            <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedTicket?.subject}</DialogTitle>
                        <DialogDescription>From: {selectedTicket?.userName} ({selectedTicket?.userEmail})</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 whitespace-pre-wrap text-sm text-muted-foreground bg-muted p-4 rounded-md">
                        {selectedTicket?.message}
                    </div>
                </DialogContent>
            </Dialog>
        </main>
    );
}

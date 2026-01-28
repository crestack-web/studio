'use client';
import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, UserPlus, Shield, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

interface User {
    id: string;
    displayName: string;
    email: string;
    role: string;
}

interface SupportAgent {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    status: 'online' | 'offline';
}

export default function AdminAgentsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'));
    }, [firestore]);
    const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

    const agentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'supportAgents'));
    }, [firestore]);
    const { data: agents, isLoading: isLoadingAgents } = useCollection<SupportAgent>(agentsQuery);
    
    const agentUserIds = agents?.map(a => a.userId) || [];

    const handleMakeAgent = async (user: User) => {
        if (!firestore) return;
        const agentRef = doc(firestore, 'supportAgents', user.id);
        await setDocumentNonBlocking(agentRef, {
            userId: user.id,
            displayName: user.displayName,
            avatarUrl: '', // You might want to get this from user profile
            status: 'offline',
        }, {});
        toast({ title: 'Agent Created', description: `${user.displayName} is now a support agent.` });
    };

    const handleRemoveAgent = async (userId: string) => {
        if (!firestore) return;
        const agentRef = doc(firestore, 'supportAgents', userId);
        await deleteDocumentNonBlocking(agentRef);
        toast({ title: 'Agent Removed', description: 'The user is no longer a support agent.' });
    };

    const isLoading = isLoadingUsers || isLoadingAgents;

    return (
        <main className="flex-1 p-4 sm:p-6 space-y-6">
            <h1 className="text-2xl font-bold font-headline">Support Agents</h1>
            <div className="grid grid-cols-1 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Support Agents</CardTitle>
                        <CardDescription>Promote users to support agents to allow them to handle live chats.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Agent Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading users...</TableCell></TableRow>
                                ) : users && users.length > 0 ? users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8"><AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback></Avatar>
                                                <div>
                                                    <div className="font-medium">{user.displayName}</div>
                                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell><Badge variant="secondary">{user.role}</Badge></TableCell>
                                        <TableCell>
                                            {agentUserIds.includes(user.id) ? (
                                                <Badge variant="default"><CheckCircle className="mr-1 h-3 w-3" />Agent</Badge>
                                            ) : (
                                                 <Badge variant="outline"><XCircle className="mr-1 h-3 w-3" />Not an Agent</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {agentUserIds.includes(user.id) ? (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild><Button variant="destructive" size="sm">Remove Agent</Button></AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>This will revoke agent permissions for {user.displayName}. They will no longer be able to answer support chats.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleRemoveAgent(user.id)} className="bg-destructive hover:bg-destructive/90">Remove</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            ) : (
                                                <Button variant="outline" size="sm" onClick={() => handleMakeAgent(user)}>Make Agent</Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center">No users found.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}

'use client';
import { useState, useMemo } from 'react';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

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
    language?: 'en' | 'fr';
}

export default function AdminAgentsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [languageForAgent, setLanguageForAgent] = useState<'en' | 'fr'>('en');

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
    
    const agentsMap = useMemo(() => {
        if (!agents) return new Map();
        return new Map(agents.map(a => [a.userId, a]));
    }, [agents]);

    const openEditDialog = (user: User) => {
        const existingAgent = agentsMap.get(user.id);
        setLanguageForAgent(existingAgent?.language || 'en');
        setUserToEdit(user);
    };
    
    const handleSaveAgent = async () => {
        if (!firestore || !userToEdit) return;
        const agentRef = doc(firestore, 'supportAgents', userToEdit.id);
        const isNewAgent = !agentsMap.has(userToEdit.id);

        const agentData = {
            userId: userToEdit.id,
            displayName: userToEdit.displayName,
            avatarUrl: '', // Default
            status: 'offline', // Default
            language: languageForAgent,
        };

        await setDocumentNonBlocking(agentRef, agentData, { merge: true });
        toast({
            title: isNewAgent ? 'Agent Created' : 'Agent Updated',
            description: `${userToEdit.displayName}'s language is set to ${languageForAgent.toUpperCase()}.`,
        });
        setUserToEdit(null);
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
                                    <TableHead>Language</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading users...</TableCell></TableRow>
                                ) : users && users.length > 0 ? users.map((user) => {
                                    const agentDetails = agentsMap.get(user.id);
                                    return (
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
                                                {agentDetails ? (
                                                    <Badge variant="default"><CheckCircle className="mr-1 h-3 w-3" />Agent</Badge>
                                                ) : (
                                                    <Badge variant="outline"><XCircle className="mr-1 h-3 w-3" />Not an Agent</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {agentDetails?.language ? (
                                                    <Badge variant="secondary">{agentDetails.language.toUpperCase()}</Badge>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">N/A</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                                            {agentDetails ? 'Edit Agent' : 'Make Agent'}
                                                        </DropdownMenuItem>
                                                        {agentDetails && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">Remove Agent</DropdownMenuItem>
                                                                </AlertDialogTrigger>
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
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                }) : (
                                    <TableRow><TableCell colSpan={5} className="h-24 text-center">No users found.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <Dialog open={!!userToEdit} onOpenChange={setUserToEdit}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{agentsMap.has(userToEdit?.id || '') ? 'Edit Agent' : 'Make Agent'}</DialogTitle>
                        <DialogDescription>Set the primary language for {userToEdit?.displayName}.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label>Language</Label>
                        <Select value={languageForAgent} onValueChange={(val: 'en' | 'fr') => setLanguageForAgent(val)}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="fr">French</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUserToEdit(null)}>Cancel</Button>
                        <Button onClick={handleSaveAgent}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}

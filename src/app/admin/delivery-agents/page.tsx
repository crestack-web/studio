
'use client';
import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, UserPlus, Shield, Loader2, CheckCircle, XCircle, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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

interface DeliveryAgent {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    status: 'available' | 'on-delivery' | 'unavailable';
}

export default function AdminDeliveryAgentsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [agentToEdit, setAgentToEdit] = useState<DeliveryAgent | null>(null);

    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'));
    }, [firestore]);
    const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

    const agentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'deliveryAgents'));
    }, [firestore]);
    const { data: agents, isLoading: isLoadingAgents } = useCollection<DeliveryAgent>(agentsQuery);
    
    const agentsMap = useMemo(() => {
        if (!agents) return new Map();
        return new Map(agents.map(a => [a.userId, a]));
    }, [agents]);

    const openEditDialog = (agent: DeliveryAgent) => {
        setAgentToEdit(agent);
    };
    
    const handleSaveAgent = async (newStatus: DeliveryAgent['status']) => {
        if (!firestore || !agentToEdit) return;
        const agentRef = doc(firestore, 'deliveryAgents', agentToEdit.userId);

        await updateDocumentNonBlocking(agentRef, { status: newStatus });
        toast({
            title: 'Agent Updated',
            description: `${agentToEdit.displayName}'s status is set to ${newStatus}.`,
        });
        setAgentToEdit(null);
    };

    const handleRemoveAgent = async (userId: string, displayName: string) => {
        if (!firestore) return;
        const agentRef = doc(firestore, 'deliveryAgents', userId);
        const userRef = doc(firestore, 'users', userId);
        
        await deleteDocumentNonBlocking(agentRef);
        // Demote user role
        await updateDocumentNonBlocking(userRef, { role: 'User' }); // or some other default role

        toast({ title: 'Agent Removed', description: `${displayName} is no longer a delivery agent.` });
    };

    const isLoading = isLoadingUsers || isLoadingAgents;

    return (
        <main className="flex-1 p-4 sm:p-6 space-y-6">
            <h1 className="text-2xl font-bold font-headline">Delivery Agents</h1>
            <div className="grid grid-cols-1 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Delivery Agents</CardTitle>
                        <CardDescription>Promote users to delivery agents and manage their status.</CardDescription>
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
                                ) : users && users.length > 0 ? users.map((user) => {
                                    const agentDetails = agentsMap.get(user.id);
                                    const isDeliveryAgent = user.role === 'Delivery Agent';
                                    if (!isDeliveryAgent && !agentDetails) return null; // Only show relevant users

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
                                                    <Badge variant={agentDetails.status === 'available' ? 'default' : 'secondary'} className="capitalize">{agentDetails.status}</Badge>
                                                ) : (
                                                    <Badge variant="outline"><XCircle className="mr-1 h-3 w-3" />Not an Agent</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={!agentDetails}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => agentDetails && openEditDialog(agentDetails)}>
                                                            Edit Status
                                                        </DropdownMenuItem>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">Remove Agent</DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                    <AlertDialogDescription>This will revoke delivery agent permissions for {user.displayName} and change their role back to User.</AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleRemoveAgent(user.id, user.displayName)} className="bg-destructive hover:bg-destructive/90">Remove</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                }).filter(Boolean) : (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center">No delivery agents found.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <Dialog open={!!agentToEdit} onOpenChange={() => setAgentToEdit(null)}>
                <DialogContent>
                    {agentToEdit && (
                        <>
                        <DialogHeader>
                            <DialogTitle>Update Agent Status</DialogTitle>
                            <DialogDescription>Set the current status for {agentToEdit?.displayName}.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-2">
                            <Label>Status</Label>
                            <Select defaultValue={agentToEdit.status} onValueChange={(val: DeliveryAgent['status']) => handleSaveAgent(val)}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="available">Available</SelectItem>
                                    <SelectItem value="on-delivery">On Delivery</SelectItem>
                                    <SelectItem value="unavailable">Unavailable</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </main>
    );
}

    
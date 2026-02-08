
'use client';
import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, UserPlus, Shield, Loader2, CheckCircle, XCircle, Truck, ClipboardList, Users } from 'lucide-react';
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

interface DeliveryAgent {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    status: 'available' | 'on-delivery' | 'unavailable';
}

interface RiderApplication {
    id: string;
    name: string;
    phone: string;
    address: string;
    status?: 'pending' | 'approved' | 'rejected';
    createdAt?: { toDate: () => Date };
}

interface GuarantorApplication {
    id: string;
    guarantorName: string;
    guarantorPhone: string;
    guarantorAddress?: string;
    riderName: string;
    riderPhone: string;
    relationship?: string;
    status?: 'pending' | 'approved' | 'rejected';
    createdAt?: { toDate: () => Date };
}

interface DispatchShopApplication {
    id: string;
    shopName: string;
    contactName: string;
    phone: string;
    address: string;
    coverageArea?: string;
    status?: 'pending' | 'approved' | 'rejected';
    createdAt?: { toDate: () => Date };
}

export default function AdminDeliveryAgentsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [agentToEdit, setAgentToEdit] = useState<DeliveryAgent | null>(null);
    const [activeTab, setActiveTab] = useState<'agents' | 'applications'>('agents');
    const [isUpdatingApplication, setIsUpdatingApplication] = useState<string | null>(null);

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

    const riderApplicationsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'riderApplications'));
    }, [firestore]);
    const { data: riderApplications, isLoading: isLoadingRiders } = useCollection<RiderApplication>(riderApplicationsQuery);

    const guarantorApplicationsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'guarantorApplications'));
    }, [firestore]);
    const { data: guarantorApplications, isLoading: isLoadingGuarantors } = useCollection<GuarantorApplication>(guarantorApplicationsQuery);

    const dispatchShopApplicationsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'dispatchShopApplications'));
    }, [firestore]);
    const { data: dispatchShopApplications, isLoading: isLoadingDispatchShops } = useCollection<DispatchShopApplication>(dispatchShopApplicationsQuery);
    
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

    const handleUpdateApplication = async (collectionName: 'riderApplications' | 'guarantorApplications' | 'dispatchShopApplications', id: string, status: 'approved' | 'rejected') => {
        if (!firestore) return;
        setIsUpdatingApplication(id);
        try {
            const ref = doc(firestore, collectionName, id);
            await updateDocumentNonBlocking(ref, { status });
            toast({ title: `Application ${status}`, description: `Marked as ${status}.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update failed', description: error?.message || 'Could not update application.' });
        } finally {
            setIsUpdatingApplication(null);
        }
    };

    const isLoading = isLoadingUsers || isLoadingAgents;

    const renderAgents = () => (
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
                        ) : users && users.length > 0 ? users.filter(user => user.role === 'Delivery Agent' || agentsMap.has(user.id)).map((user) => {
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
                        }) : (
                            <TableRow><TableCell colSpan={4} className="h-24 text-center">No delivery agents found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );

    const renderApplicationsTable = (title: string, description: string, rows: any[], columns: { key: string; label: string; render?: (row: any) => JSX.Element | string }[], collectionName: 'riderApplications' | 'guarantorApplications' | 'dispatchShopApplications') => (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map(col => (<TableHead key={col.key}>{col.label}</TableHead>))}
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows && rows.length > 0 ? rows.map((row) => (
                            <TableRow key={row.id}>
                                {columns.map(col => (
                                    <TableCell key={col.key}>{col.render ? col.render(row) : (row as any)[col.key]}</TableCell>
                                ))}
                                <TableCell className="text-right space-x-2">
                                    <Button size="sm" variant="outline" disabled={isUpdatingApplication === row.id} onClick={() => handleUpdateApplication(collectionName, row.id, 'approved')}>
                                        {isUpdatingApplication === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-destructive" disabled={isUpdatingApplication === row.id} onClick={() => handleUpdateApplication(collectionName, row.id, 'rejected')}>
                                        Reject
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow><TableCell colSpan={columns.length + 1} className="h-20 text-center text-muted-foreground">No applications yet.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );

    const renderApplications = () => {
        const riderCols = [
            { key: 'name', label: 'Rider' },
            { key: 'phone', label: 'Phone' },
            { key: 'address', label: 'Address' },
            { key: 'status', label: 'Status', render: (r: RiderApplication) => <Badge variant={r.status === 'approved' ? 'default' : r.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">{r.status || 'pending'}</Badge> },
            { key: 'createdAt', label: 'Applied', render: (r: RiderApplication) => r.createdAt?.toDate().toLocaleDateString() || '—' },
        ];

        const guarantorCols = [
            { key: 'guarantorName', label: 'Guarantor' },
            { key: 'guarantorPhone', label: 'Phone' },
            { key: 'riderName', label: 'Rider Name' },
            { key: 'riderPhone', label: 'Rider Phone' },
            { key: 'status', label: 'Status', render: (g: GuarantorApplication) => <Badge variant={g.status === 'approved' ? 'default' : g.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">{g.status || 'pending'}</Badge> },
            { key: 'createdAt', label: 'Applied', render: (g: GuarantorApplication) => g.createdAt?.toDate().toLocaleDateString() || '—' },
        ];

        const dispatchShopCols = [
            { key: 'shopName', label: 'Shop' },
            { key: 'contactName', label: 'Contact' },
            { key: 'phone', label: 'Phone' },
            { key: 'coverageArea', label: 'Area', render: (d: DispatchShopApplication) => d.coverageArea || '—' },
            { key: 'status', label: 'Status', render: (d: DispatchShopApplication) => <Badge variant={d.status === 'approved' ? 'default' : d.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">{d.status || 'pending'}</Badge> },
            { key: 'createdAt', label: 'Applied', render: (d: DispatchShopApplication) => d.createdAt?.toDate().toLocaleDateString() || '—' },
        ];

        return (
            <div className="grid grid-cols-1 gap-6">
                {renderApplicationsTable('Rider Applications', 'Incoming BusmoGo rider applications', riderApplications || [], riderCols, 'riderApplications')}
                {renderApplicationsTable('Guarantor Applications', 'Incoming guarantor applications', guarantorApplications || [], guarantorCols, 'guarantorApplications')}
                {renderApplicationsTable('Dispatch Shop Applications', 'Incoming dispatch shop partner applications', dispatchShopApplications || [], dispatchShopCols, 'dispatchShopApplications')}
            </div>
        );
    };

    return (
        <main className="flex-1 p-4 sm:p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-headline">Delivery Management</h1>
                    <p className="text-muted-foreground">Manage agents and review BusmoGo applications.</p>
                </div>
            </div>

            <div className="flex items-center gap-2 border-b pb-2">
                <Button variant={activeTab === 'agents' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab('agents')} className="gap-2"><Users className="h-4 w-4" /> Agents</Button>
                <Button variant={activeTab === 'applications' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab('applications')} className="gap-2"><ClipboardList className="h-4 w-4" /> Applications</Button>
            </div>

            {activeTab === 'agents' ? renderAgents() : renderApplications()}

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

    

    
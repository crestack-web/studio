
'use client';
import React, { useState, useMemo, ChangeEvent } from 'react';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, doc, collectionGroup, orderBy, serverTimestamp } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Loader2, Plus, FileEdit, Trash2, Megaphone, Briefcase, FileText, ImagePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/currency';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- INTERFACES ---
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

interface Service {
    id: string;
    title: string;
    description: string;
    fee: number;
    icon: string;
    isActive: boolean;
    createdAt?: { toDate: () => Date };
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

const serviceIcons = [
    { name: 'Briefcase', component: Briefcase },
    { name: 'FileText', component: FileText },
    { name: 'ImagePlus', component: ImagePlus },
    { name: 'Megaphone', component: Megaphone },
];

// --- SERVICE REQUESTS COMPONENT ---
const ServiceRequests = () => {
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
    );
};

// --- MANAGE SERVICES COMPONENT ---
const ManageServices = () => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const servicesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'services'), orderBy('createdAt', 'desc'));
    }, [firestore]);
    const { data: services, isLoading: isLoadingServices } = useCollection<Service>(servicesQuery);

    const openEditDialog = (service: Service | null = null) => {
        setEditingService(service || { id: '', title: '', description: '', fee: 0, icon: 'Briefcase', isActive: true });
    };

    const handleSaveService = async () => {
        if (!editingService || !firestore) return;

        const { id, ...serviceData } = editingService;
        if (!id) { // Adding a new service
            setIsLoading(true);
            await addDocumentNonBlocking(collection(firestore, 'services'), { ...serviceData, createdAt: serverTimestamp() });
            toast({ title: 'Service Added' });
            setIsLoading(false);
            setEditingService(null);
        } else { // Updating an existing service
            setIsLoading(true);
            const serviceRef = doc(firestore, 'services', id);
            await updateDocumentNonBlocking(serviceRef, serviceData);
            toast({ title: 'Service Updated' });
            setIsLoading(false);
            setEditingService(null);
        }
    };
    
    const handleDeleteService = async (serviceId: string) => {
        if (!firestore) return;
        const serviceRef = doc(firestore, 'services', serviceId);
        await deleteDocumentNonBlocking(serviceRef);
        toast({ title: 'Service Deleted' });
    };

    return (
        <>
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>Manage Services</CardTitle>
                        <CardDescription>Add, edit, or remove the paid services offered to merchants.</CardDescription>
                    </div>
                    <Button onClick={() => openEditDialog()}>
                        <Plus className="mr-2 h-4 w-4" /> Add Service
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Fee</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingServices ? (
                                <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading services...</TableCell></TableRow>
                            ) : services && services.length > 0 ? services.map((service) => (
                                <TableRow key={service.id}>
                                    <TableCell className="font-medium">{service.title}</TableCell>
                                    <TableCell>{formatCurrency(service.fee)}</TableCell>
                                    <TableCell><Badge variant={service.isActive ? 'default' : 'secondary'}>{service.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(service)}><FileEdit className="h-4 w-4" /></Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the "{service.title}" service. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteService(service.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={4} className="h-24 text-center">No services created yet.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!editingService} onOpenChange={(open) => !open && setEditingService(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingService?.id ? 'Edit Service' : 'Add New Service'}</DialogTitle>
                        <DialogDescription>Fill in the details for the service.</DialogDescription>
                    </DialogHeader>
                    {editingService && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" value={editingService.title} onChange={(e) => setEditingService({...editingService, title: e.target.value})} /></div>
                            <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" value={editingService.description} onChange={(e) => setEditingService({...editingService, description: e.target.value})} /></div>
                            <div className="space-y-2"><Label htmlFor="fee">Fee (NGN)</Label><Input id="fee" type="number" value={editingService.fee} onChange={(e) => setEditingService({...editingService, fee: parseFloat(e.target.value) || 0})} /></div>
                            <div className="space-y-2">
                                <Label htmlFor="icon">Icon</Label>
                                <Select value={editingService.icon} onValueChange={(val: string) => setEditingService({...editingService, icon: val})}>
                                    <SelectTrigger id="icon"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {serviceIcons.map(icon => <SelectItem key={icon.name} value={icon.name}>{icon.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center space-x-2 pt-2"><Switch id="isActive" checked={editingService.isActive} onCheckedChange={(val) => setEditingService({...editingService, isActive: val})} /><Label htmlFor="isActive">Service is active</Label></div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingService(null)}>Cancel</Button>
                        <Button onClick={handleSaveService} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Service
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

// --- MAIN EXPORT ---
export default function AdminServicesPage() {
    return (
        <main className="flex-1 p-4 sm:p-6 space-y-6">
            <h1 className="text-2xl font-bold font-headline">Services</h1>
            <Tabs defaultValue="requests" className="w-full">
                <TabsList>
                    <TabsTrigger value="requests">Service Requests</TabsTrigger>
                    <TabsTrigger value="manage">Manage Services</TabsTrigger>
                </TabsList>
                <TabsContent value="requests" className="mt-4">
                    <ServiceRequests />
                </TabsContent>
                <TabsContent value="manage" className="mt-4">
                    <ManageServices />
                </TabsContent>
            </Tabs>
        </main>
    );
}


'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, FileEdit, CheckCircle, XCircle, Loader2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface BusinessVerification {
    id: string;
    businessId: string;
    businessName: string;
    idImageUrl: string;
    stockImageUrl: string;
    storeImageUrl: string;
    status: 'unverified' | 'pending' | 'verified' | 'rejected';
    submittedAt: { toDate: () => Date };
    rejectionReason?: string;
}

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
    pending: 'secondary',
    verified: 'default',
    rejected: 'destructive',
    unverified: 'outline',
};

export default function AdminVerificationsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [selectedVerification, setSelectedVerification] = useState<BusinessVerification | null>(null);
    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const verificationsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'businessVerifications'), where('status', '==', 'pending'));
    }, [firestore]);
    const { data: verifications, isLoading: isLoadingVerifications } = useCollection<BusinessVerification>(verificationsQuery);

    const handleUpdateStatus = async (verificationId: string, status: 'verified' | 'rejected', reason?: string) => {
        if (!firestore) return;
        setIsUpdating(true);

        const verificationRef = doc(firestore, 'businessVerifications', verificationId);
        const businessProfileRef = doc(firestore, 'businessProfiles', verificationId);
        
        const batch = writeBatch(firestore);

        batch.update(verificationRef, {
            status,
            rejectionReason: reason || null,
            reviewedAt: serverTimestamp()
        });

        // Also update the public business profile
        batch.update(businessProfileRef, { isVerified: status === 'verified' });

        try {
            await batch.commit();
            toast({ title: 'Verification Updated', description: `The application has been ${status}.` });
        } catch (error) {
            console.error("Failed to update verification status:", error);
            toast({ title: 'Update failed', description: 'Could not update verification status.', variant: 'destructive'});
        } finally {
            setSelectedVerification(null);
            setIsRejecting(false);
            setRejectionReason('');
            setIsUpdating(false);
        }
    };

    return (
        <main className="flex-1 p-4 sm:p-6 space-y-6">
            <h1 className="text-2xl font-bold font-headline">Business Verifications</h1>
            <div className="grid grid-cols-1 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Applications</CardTitle>
                        <CardDescription>Review and approve or reject new business verification submissions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Business Name</TableHead>
                                    <TableHead>Submission Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingVerifications ? (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading applications...</TableCell></TableRow>
                                ) : verifications && verifications.length > 0 ? verifications.map((verification) => (
                                    <TableRow key={verification.id}>
                                        <TableCell className="font-medium">{verification.businessName}</TableCell>
                                        <TableCell>{format(verification.submittedAt.toDate(), 'PPP')}</TableCell>
                                        <TableCell><Badge variant={statusVariant[verification.status]}>{verification.status}</Badge></TableCell>
                                        <TableCell className="text-right">
                                             <Button variant="outline" size="sm" onClick={() => setSelectedVerification(verification)}>
                                                <Eye className="mr-2 h-4 w-4" /> Review
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center">No pending applications.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={!!selectedVerification} onOpenChange={(open) => !open && setSelectedVerification(null)}>
                <DialogContent className="sm:max-w-4xl">
                    {selectedVerification && (
                        <>
                             <DialogHeader>
                                <DialogTitle>Review Verification for {selectedVerification.businessName}</DialogTitle>
                                <DialogDescription>Submitted on {format(selectedVerification.submittedAt.toDate(), 'PPP')}</DialogDescription>
                            </DialogHeader>
                            <div className="grid md:grid-cols-3 gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                                <div className="space-y-2">
                                    <h4 className="font-semibold">ID Document</h4>
                                    <Image src={selectedVerification.idImageUrl} alt="ID Document" width={400} height={300} className="rounded-md border object-cover" />
                                </div>
                                 <div className="space-y-2">
                                    <h4 className="font-semibold">Proof of Stock</h4>
                                    <Image src={selectedVerification.stockImageUrl} alt="Proof of Stock" width={400} height={300} className="rounded-md border object-cover" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-semibold">Store/Shop Image</h4>
                                    <Image src={selectedVerification.storeImageUrl} alt="Store Image" width={400} height={300} className="rounded-md border object-cover" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button variant="outline" onClick={() => setSelectedVerification(null)}>Cancel</Button>
                                <Button variant="destructive" onClick={() => setIsRejecting(true)}>Reject</Button>
                                <Button onClick={() => handleUpdateStatus(selectedVerification.id, 'verified')}>
                                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Approve
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
            
            <Dialog open={isRejecting} onOpenChange={(open) => !open && setIsRejecting(false)}>
                <DialogContent>
                     <DialogHeader>
                        <DialogTitle>Reject Application?</DialogTitle>
                        <DialogDescription>Please provide a reason for rejecting this application. The business owner will see this.</DialogDescription>
                    </DialogHeader>
                     <div className="py-4 space-y-2">
                        <Label htmlFor="rejection-reason">Rejection Reason</Label>
                        <Textarea id="rejection-reason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="e.g., ID was not clear, proof of stock was insufficient..." />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsRejecting(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => selectedVerification && handleUpdateStatus(selectedVerification.id, 'rejected', rejectionReason)} disabled={!rejectionReason || isUpdating}>
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Rejection
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </main>
    );
}

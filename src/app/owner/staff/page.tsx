
'use client';

import { useState } from 'react';
import { MoreHorizontal, UserPlus, Network, Trash2 } from 'lucide-react';
import MainLayout from '@/components/app/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface AppUser {
    businessId?: string;
    displayName?: string;
}

interface Business {
    plan: 'shop' | 'supermarket' | 'multi-branch' | 'company';
    businessName: string;
}

interface StaffMember {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface StaffInvitation {
    id: string; // The email is the ID
    email: string;
    status: 'pending';
    createdAt: {
        toDate: () => Date;
    };
}

export default function ManageStaffPage() {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);

    const firestore = useFirestore();
    const { user: authUser } = useUser();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !authUser) return null;
        return doc(firestore, 'users', authUser.uid);
    }, [firestore, authUser]);
    const { data: userProfile } = useDoc<AppUser>(userProfileRef);
    const businessId = userProfile?.businessId;

    const businessRef = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return doc(firestore, 'businesses', businessId);
    }, [firestore, businessId]);
    const { data: businessData } = useDoc<Business>(businessRef);

    const staffQuery = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return query(collection(firestore, 'users'), where('businessId', '==', businessId), where('role', '==', 'Staff'));
    }, [firestore, businessId]);
    const { data: staffMembers, isLoading: isLoadingStaff } = useCollection<StaffMember>(staffQuery);

    const invitationsQuery = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return query(collection(firestore, 'invitations'), where('businessId', '==', businessId));
    }, [firestore, businessId]);
    const { data: pendingInvitations, isLoading: isLoadingInvitations } = useCollection<StaffInvitation>(invitationsQuery);


    const userPlan = businessData?.plan || 'shop';
    const canManageStaff = userPlan === 'supermarket' || userPlan === 'multi-branch' || userPlan === 'company';

    const handleSendInvite = async () => {
        if (!email) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter an email address.' });
            return;
        }
        if (!firestore || !businessId || !businessData || !userProfile) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not find business details.' });
            return;
        }

        setIsInviting(true);
        try {
            const invitationRef = doc(firestore, 'invitations', email);
            await setDocumentNonBlocking(invitationRef, {
                email: email,
                businessId: businessId,
                businessName: businessData.businessName,
                status: 'pending',
                createdAt: serverTimestamp(),
            }, {});
            toast({ title: 'Invite Sent', description: `An invitation has been sent to ${email}.` });
            setEmail('');
            setOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error Sending Invite', description: error.message });
        } finally {
            setIsInviting(false);
        }
    };

    const handleRevokeInvite = async (invitationId: string) => {
        if (!firestore) return;
        const invitationRef = doc(firestore, 'invitations', invitationId);
        await deleteDocumentNonBlocking(invitationRef);
        toast({ title: 'Invitation Revoked', description: `The invitation for ${invitationId} has been revoked.` });
    };

    const isLoading = isLoadingStaff || isLoadingInvitations;

    return (
        <MainLayout title="Manage Staff" backHref="/owner/home">
            <div className="w-full max-w-4xl space-y-6">
                
                {!canManageStaff && (
                     <Alert>
                        <Network className="h-4 w-4" />
                        <AlertTitle>Upgrade to Manage Staff</AlertTitle>
                        <AlertDescription>
                            This feature is available on the Supermarket plan and above. 
                            Upgrade your plan to invite and manage staff members.
                        </AlertDescription>
                         <div className="mt-4">
                            <Link href="/owner/pricing">
                                <Button>Upgrade Plan</Button>
                            </Link>
                        </div>
                    </Alert>
                )}
                
                <Card className={!canManageStaff ? 'opacity-50 pointer-events-none' : ''}>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Staff Members</CardTitle>
                            <CardDescription>Invite and manage staff for your business.</CardDescription>
                        </div>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button disabled={!canManageStaff}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Invite Staff
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Invite New Staff Member</DialogTitle>
                                    <DialogDescription>
                                        Enter the email of the person you want to invite. They will need to sign up with this email to join your business.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input id="email" type="email" placeholder="staff@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                    <Button onClick={handleSendInvite} disabled={isInviting}>
                                        {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Send Invite
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading staff...</TableCell></TableRow>
                                ) : (
                                    <>
                                        {staffMembers && staffMembers.map((staff) => (
                                            <TableRow key={staff.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar><AvatarFallback>{staff.name?.split(' ').map(n => n[0]).join('') || 'S'}</AvatarFallback></Avatar>
                                                        <span className="font-medium">{staff.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{staff.email}</TableCell>
                                                <TableCell><Badge variant="default">Active</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem disabled>Edit Permissions</DropdownMenuItem>
                                                            <DropdownMenuItem className="text-destructive" disabled>Remove Staff</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                         {pendingInvitations && pendingInvitations.map((invite) => (
                                            <TableRow key={invite.id}>
                                                <TableCell>
                                                     <div className="flex items-center gap-3">
                                                        <Avatar><AvatarFallback>?</AvatarFallback></Avatar>
                                                        <span className="font-medium italic text-muted-foreground">Invitation Pending</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{invite.email}</TableCell>
                                                <TableCell><Badge variant="secondary">Pending</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleRevokeInvite(invite.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </>
                                )}
                            </TableBody>
                        </Table>
                         {(!staffMembers || staffMembers.length === 0) && (!pendingInvitations || pendingInvitations.length === 0) && !isLoading && (
                            <div className="text-center text-muted-foreground py-12">
                                <p>You haven't invited any staff members yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}

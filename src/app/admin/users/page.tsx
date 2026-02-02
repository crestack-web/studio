
'use client';
import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, setDocumentNonBlocking, useDoc, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Shield, Edit, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface User {
    id: string;
    displayName: string;
    email: string;
    role: 'Owner' | 'Staff' | 'Investor' | 'Admin' | 'Delivery Agent';
    businessId?: string;
}

interface Business {
    id: string;
    plan?: 'shop' | 'supermarket' | 'multi-branch' | 'company';
}

interface AdminPermission {
    id?: string;
    isSuperAdmin?: boolean;
    canManageUsers?: boolean;
    canManageVerifications?: boolean;
    canManageOrders?: boolean;
    canManageMarketplace?: boolean;
    canManageBlog?: boolean;
    canManageSupport?: boolean;
    canManageCoupons?: boolean;
}

const roleVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    Admin: 'destructive',
    Owner: 'default',
    Staff: 'secondary',
    Investor: 'outline',
    'Delivery Agent': 'secondary',
};

const plans: Business['plan'][] = ['shop', 'supermarket', 'multi-branch', 'company'];

const AdminPermissionsDialog = ({ user, isOpen, onOpenChange, onSave }: { user: User, isOpen: boolean, onOpenChange: (open: boolean) => void, onSave: (userId: string, permissions: AdminPermission, newRole: User['role']) => void }) => {
    const firestore = useFirestore();
    const permissionsRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, `admin_permissions`, user.id);
    }, [firestore, user]);
    const { data: initialPermissions, isLoading } = useDoc<AdminPermission>(permissionsRef);
    
    const [permissions, setPermissions] = useState<AdminPermission>({
        isSuperAdmin: false,
        canManageUsers: false,
        canManageVerifications: false,
        canManageOrders: false,
        canManageMarketplace: false,
        canManageBlog: false,
        canManageSupport: false,
        canManageCoupons: false,
    });

    React.useEffect(() => {
        if (initialPermissions) {
            setPermissions(initialPermissions);
        } else {
             setPermissions({
                isSuperAdmin: false,
                canManageUsers: false,
                canManageVerifications: false,
                canManageOrders: false,
                canManageMarketplace: false,
                canManageBlog: false,
                canManageSupport: false,
                canManageCoupons: false,
             });
        }
    }, [initialPermissions]);

    const handlePermissionChange = (key: keyof AdminPermission, value: boolean) => {
        setPermissions(prev => ({ ...prev, [key]: value }));
    };

    if (!user) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Admin Permissions for {user.displayName}</DialogTitle>
                    <DialogDescription>
                        Select the areas this admin user can manage.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    {isLoading ? <Loader2 className="mx-auto animate-spin" /> : (
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="perm-super" checked={permissions.isSuperAdmin} onCheckedChange={(c) => handlePermissionChange('isSuperAdmin', !!c)} />
                                <Label htmlFor="perm-super" className="font-semibold text-destructive">Super Admin (Full Access)</Label>
                            </div>
                            <Separator />
                            <h4 className="font-semibold text-sm">Department Permissions</h4>
                             <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center space-x-2"><Checkbox id="perm-users" checked={permissions.canManageUsers} onCheckedChange={(c) => handlePermissionChange('canManageUsers', !!c)} /><Label htmlFor="perm-users">User Management</Label></div>
                                <div className="flex items-center space-x-2"><Checkbox id="perm-verifications" checked={permissions.canManageVerifications} onCheckedChange={(c) => handlePermissionChange('canManageVerifications', !!c)} /><Label htmlFor="perm-verifications">Verifications</Label></div>
                                <div className="flex items-center space-x-2"><Checkbox id="perm-orders" checked={permissions.canManageOrders} onCheckedChange={(c) => handlePermissionChange('canManageOrders', !!c)} /><Label htmlFor="perm-orders">Orders</Label></div>
                                <div className="flex items-center space-x-2"><Checkbox id="perm-marketplace" checked={permissions.canManageMarketplace} onCheckedChange={(c) => handlePermissionChange('canManageMarketplace', !!c)} /><Label htmlFor="perm-marketplace">Marketplace</Label></div>
                                <div className="flex items-center space-x-2"><Checkbox id="perm-blog" checked={permissions.canManageBlog} onCheckedChange={(c) => handlePermissionChange('canManageBlog', !!c)} /><Label htmlFor="perm-blog">Blog</Label></div>
                                <div className="flex items-center space-x-2"><Checkbox id="perm-support" checked={permissions.canManageSupport} onCheckedChange={(c) => handlePermissionChange('canManageSupport', !!c)} /><Label htmlFor="perm-support">Support</Label></div>
                                <div className="flex items-center space-x-2"><Checkbox id="perm-coupons" checked={permissions.canManageCoupons} onCheckedChange={(c) => handlePermissionChange('canManageCoupons', !!c)} /><Label htmlFor="perm-coupons">Coupons</Label></div>
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={() => onSave(user.id, permissions, 'Admin')}>Save Permissions</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default function AdminUsersPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);

    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'));
    }, [firestore]);
    const { data: users, isLoading } = useCollection<User>(usersQuery);

    const businessesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'businesses'));
    }, [firestore]);
    const { data: businesses, isLoading: isLoadingBusinesses } = useCollection<Business>(businessesQuery);
    
    const businessesMap = useMemo(() => {
        if (!businesses) return new Map();
        return new Map(businesses.map(b => [b.id, b]));
    }, [businesses]);

    const handleRoleChange = (user: User, newRole: User['role']) => {
        if (!firestore) return;
        if (newRole === 'Admin') {
            setSelectedUser(user);
            setIsPermissionsDialogOpen(true);
        } else {
            const userRef = doc(firestore, 'users', user.id);
            updateDocumentNonBlocking(userRef, { role: newRole });

            // If demoting from admin, remove from the 'admins' collection.
            if (user.role === 'Admin') {
                const adminRef = doc(firestore, 'admins', user.id);
                deleteDocumentNonBlocking(adminRef);
            }
            // If making a delivery agent, add to the 'deliveryAgents' collection
            if (newRole === 'Delivery Agent') {
                const agentRef = doc(firestore, 'deliveryAgents', user.id);
                setDocumentNonBlocking(agentRef, {
                    userId: user.id,
                    displayName: user.displayName,
                    status: 'unavailable',
                    currentOrderId: null,
                }, { merge: true });
            }


            toast({
                title: 'Role Updated',
                description: `${user.displayName}'s role has been changed to ${newRole}.`,
            });
        }
    };
    
    const handleSavePermissions = (userId: string, permissions: AdminPermission, newRole: User['role']) => {
        if (!firestore) return;
        const userRef = doc(firestore, 'users', userId);
        const permissionsRef = doc(firestore, `admin_permissions`, userId);
        const adminRef = doc(firestore, 'admins', userId);

        const batch = writeBatch(firestore);

        batch.update(userRef, { role: newRole });
        batch.set(permissionsRef, permissions, { merge: true });
        batch.set(adminRef, { isAdmin: true, createdAt: serverTimestamp() });

        batch.commit().then(() => {
            toast({
                title: 'Admin Permissions Saved',
                description: `Permissions have been updated for this admin.`,
            });
        }).catch(error => {
            console.error("Error saving admin permissions:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save admin permissions.' });
        }).finally(() => {
            setIsPermissionsDialogOpen(false);
            setSelectedUser(null);
        });
    };

    const handlePlanChange = (businessId: string | undefined, newPlan: Business['plan']) => {
        if (!firestore || !businessId) return;
        const businessRef = doc(firestore, 'businesses', businessId);
        updateDocumentNonBlocking(businessRef, { plan: newPlan });
        toast({
            title: 'Plan Updated',
            description: `The business plan has been changed to ${newPlan}.`,
        });
    }

    return (
        <main className="flex-1 p-4 sm:p-6 space-y-6">
            <h1 className="text-2xl font-bold font-headline">User Management</h1>
            <div className="grid grid-cols-1 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>All Users</CardTitle>
                        <CardDescription>View and manage all users in the system.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Business ID</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading || isLoadingBusinesses ? (
                                    <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading users...</TableCell></TableRow>
                                ) : users && users.length > 0 ? users.map((user) => {
                                    const userBusiness = user.businessId ? businessesMap.get(user.businessId) : null;
                                    const userPlan = userBusiness?.plan;
                                    return (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="font-medium">{user.displayName}</div>
                                            <div className="text-sm text-muted-foreground">{user.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={roleVariant[user.role] || 'secondary'}>{user.role}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {userPlan ? <Badge variant="outline">{userPlan}</Badge> : <span className="text-muted-foreground text-xs">N/A</span>}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{user.businessId || 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleRoleChange(user, 'Admin')}><Shield className="mr-2 h-4 w-4"/>Make Admin</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleRoleChange(user, 'Owner')}>Make Owner</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleRoleChange(user, 'Staff')}>Make Staff</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleRoleChange(user, 'Investor')}>Make Investor</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleRoleChange(user, 'Delivery Agent')}><Truck className="mr-2 h-4 w-4" />Make Delivery Agent</DropdownMenuItem>
                                                    
                                                    {user.role === 'Admin' && (
                                                        <DropdownMenuItem onClick={() => { setSelectedUser(user); setIsPermissionsDialogOpen(true); }}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit Permissions
                                                        </DropdownMenuItem>
                                                    )}

                                                    {user.businessId && (
                                                         <DropdownMenuSub>
                                                            <DropdownMenuSubTrigger>Change Plan</DropdownMenuSubTrigger>
                                                            <DropdownMenuPortal>
                                                                <DropdownMenuSubContent>
                                                                    {plans.map(planId => (
                                                                        <DropdownMenuItem key={planId} onSelect={() => handlePlanChange(user.businessId, planId)}>
                                                                            Set to {planId}
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                </DropdownMenuSubContent>
                                                            </DropdownMenuPortal>
                                                        </DropdownMenuSub>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )}) : (
                                    <TableRow><TableCell colSpan={5} className="h-24 text-center">No users found.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            {selectedUser && (
                <AdminPermissionsDialog
                    user={selectedUser}
                    isOpen={isPermissionsDialogOpen}
                    onOpenChange={setIsPermissionsDialogOpen}
                    onSave={handleSavePermissions}
                />
            )}
        </main>
    );
}

    
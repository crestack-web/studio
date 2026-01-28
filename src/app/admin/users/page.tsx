
'use client';
import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, setDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Shield, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

interface User {
    id: string;
    displayName: string;
    email: string;
    role: 'Owner' | 'Staff' | 'Investor' | 'Admin';
    businessId?: string;
}

interface Business {
    id: string;
    plan?: 'shop' | 'supermarket' | 'multi-branch' | 'company';
}

interface AdminPermission {
    id?: string;
    canManageUsers: boolean;
    canManageProducts: boolean;
    canManageBlog: boolean;
    canManageMarket: boolean;
}

const roleVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    Admin: 'destructive',
    Owner: 'default',
    Staff: 'secondary',
    Investor: 'outline',
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
        canManageUsers: false,
        canManageProducts: false,
        canManageBlog: false,
        canManageMarket: false,
    });

    React.useEffect(() => {
        if (initialPermissions) {
            setPermissions(initialPermissions);
        } else {
             setPermissions({ canManageUsers: false, canManageProducts: false, canManageBlog: false, canManageMarket: false });
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
                        <>
                            <div className="flex items-center space-x-2"><Checkbox id="perm-users" checked={permissions.canManageUsers} onCheckedChange={(c) => handlePermissionChange('canManageUsers', !!c)} /><Label htmlFor="perm-users">Manage Users & Roles</Label></div>
                            <div className="flex items-center space-x-2"><Checkbox id="perm-products" checked={permissions.canManageProducts} onCheckedChange={(c) => handlePermissionChange('canManageProducts', !!c)} /><Label htmlFor="perm-products">Manage All Market Products</Label></div>
                            <div className="flex items-center space-x-2"><Checkbox id="perm-blog" checked={permissions.canManageBlog} onCheckedChange={(c) => handlePermissionChange('canManageBlog', !!c)} /><Label htmlFor="perm-blog">Manage Blog Posts</Label></div>
                            <div className="flex items-center space-x-2"><Checkbox id="perm-market" checked={permissions.canManageMarket} onCheckedChange={(c) => handlePermissionChange('canManageMarket', !!c)} /><Label htmlFor="perm-market">Manage Market Banners & Categories</Label></div>
                        </>
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
        
        updateDocumentNonBlocking(userRef, { role: newRole });
        setDocumentNonBlocking(permissionsRef, permissions, { merge: true });

        toast({
            title: 'Admin Permissions Saved',
            description: `Permissions have been updated for this admin.`,
        });
        setIsPermissionsDialogOpen(false);
        setSelectedUser(null);
    }

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
        <main className="flex-1 p-4 sm:p-6">
            <h1 className="text-2xl font-bold font-headline mb-6">User Management</h1>
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

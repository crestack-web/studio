
'use client';
import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface User {
    id: string;
    displayName: string;
    email: string;
    role: 'Owner' | 'Staff' | 'Investor' | 'Admin';
    businessId?: string;
}

const roleVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    Admin: 'destructive',
    Owner: 'default',
    Staff: 'secondary',
    Investor: 'outline',
};

export default function AdminUsersPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'));
    }, [firestore]);
    const { data: users, isLoading } = useCollection<User>(usersQuery);

    const handleRoleChange = (userId: string, newRole: User['role']) => {
        if (!firestore) return;
        const userRef = doc(firestore, 'users', userId);
        updateDocumentNonBlocking(userRef, { role: newRole });
        toast({
            title: 'Role Updated',
            description: `User role has been changed to ${newRole}.`,
        });
    };

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
                                <TableHead>Business ID</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading users...</TableCell></TableRow>
                            ) : users && users.length > 0 ? users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="font-medium">{user.displayName}</div>
                                        <div className="text-sm text-muted-foreground">{user.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={roleVariant[user.role] || 'secondary'}>{user.role}</Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{user.businessId || 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'Admin')}>Make Admin</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'Owner')}>Make Owner</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'Staff')}>Make Staff</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'Investor')}>Make Investor</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={4} className="h-24 text-center">No users found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </main>
    );
}

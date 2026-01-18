'use client';

import { useState } from 'react';
import { MoreHorizontal, UserPlus, Network } from 'lucide-react';
import MainLayout from '@/components/app/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

const mockStaff = [
    { id: '1', name: 'Binta Diallo', email: 'binta@example.com', role: 'Staff' },
    { id: '2', name: 'Kwame Owusu', email: 'kwame@example.com', role: 'Staff' },
];

const permissions = [
    { id: 'record_sales', label: 'Record Sales' },
    { id: 'record_expenses', label: 'Record Expenses' },
    { id: 'add_inventory', label: 'Add Inventory' },
    { id: 'manage_market', label: 'Manage Market Listings' },
    { id: 'view_reports', label: 'View Reports' },
];

export default function ManageStaffPage() {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState('');

    const handleSendInvite = () => {
        if (!email) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Please enter an email address.',
            });
            return;
        }
        toast({
            title: 'Invite Sent',
            description: `An invitation has been sent to ${email}.`,
        });
        setEmail('');
        setOpen(false);
    };
    
    // In a real app, this would come from user data.
    // Plans can be 'shop', 'supermarket', or 'multi-branch'
    const userPlan = 'multi-branch';
    const canManageStaff = userPlan === 'supermarket' || userPlan === 'multi-branch';

    return (
        <MainLayout title="Manage Staff" backHref="/owner/home">
            <div className="w-full max-w-4xl space-y-6">
                
                {!canManageStaff && (
                     <Alert>
                        <Network className="h-4 w-4" />
                        <AlertTitle>Upgrade to Manage Staff</AlertTitle>
                        <AlertDescription>
                            This feature is available on the Supermarket and Multiple Branches plans. 
                            Upgrade your plan to invite and manage staff members.
                        </AlertDescription>
                         <div className="mt-4">
                            <Link href="/plans">
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
                                        Enter the email of the person you want to invite. They will receive an email to set up their account.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="staff@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Permissions</Label>
                                        <div className="space-y-3 rounded-md border p-4">
                                            {permissions.map((permission) => (
                                                <div key={permission.id} className="flex items-center space-x-3">
                                                    <Checkbox id={permission.id} defaultChecked={permission.id === 'record_sales'} disabled={permission.id === 'record_sales'} />
                                                    <Label htmlFor={permission.id} className="font-normal">
                                                        {permission.label}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                        <p className='text-xs text-muted-foreground'>Staff can always record sales.</p>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                    <Button onClick={handleSendInvite}>Send Invite</Button>
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
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockStaff.map((staff) => (
                                    <TableRow key={staff.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarFallback>{staff.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{staff.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{staff.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{staff.role}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>Edit Permissions</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive">Remove Staff</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         {(mockStaff.length === 0 || !canManageStaff) && (
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

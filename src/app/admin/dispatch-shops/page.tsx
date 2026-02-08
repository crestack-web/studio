'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { addDoc, arrayRemove, arrayUnion, collection, doc, query, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, UserPlus, X } from 'lucide-react';
import { markets } from '@/lib/currency';

interface DispatchShop {
  id: string;
  name: string;
  country: string;
  state: string;
  location: string;
  pickupFeeNgn: number;
  maintenanceFeeNgn: number;
  managerIds?: string[];
  createdAt?: any;
}

interface User {
  id: string;
  displayName?: string;
  email?: string;
}

export default function AdminDispatchShopsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [shopName, setShopName] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [location, setLocation] = useState('');
  const [pickupFeeNgn, setPickupFeeNgn] = useState<string>('');
  const [maintenanceFeeNgn, setMaintenanceFeeNgn] = useState<string>('');

  const [manageManagersOpen, setManageManagersOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<DispatchShop | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [isUpdatingManagers, setIsUpdatingManagers] = useState(false);

  const [deleteShopOpen, setDeleteShopOpen] = useState(false);
  const [shopToDelete, setShopToDelete] = useState<DispatchShop | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const shopsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'dispatchShops'));
  }, [firestore]);
  const { data: shops, isLoading: isLoadingShops } = useCollection<DispatchShop>(shopsQuery);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'));
  }, [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

  const usersById = useMemo(() => {
    const map = new Map<string, User>();
    (users || []).forEach(u => map.set(u.id, u));
    return map;
  }, [users]);

  const selectedCountry = markets.find(m => m.code === country);

  const resetCreateForm = () => {
    setShopName('');
    setCountry('');
    setState('');
    setLocation('');
    setPickupFeeNgn('');
    setMaintenanceFeeNgn('');
  };

  const openManagers = (shop: DispatchShop) => {
    setSelectedShop(shop);
    setSelectedManagerId('');
    setManageManagersOpen(true);
  };

  const handleCreate = async () => {
    if (!firestore) return;

    const pickup = Number(pickupFeeNgn);
    const maintenance = Number(maintenanceFeeNgn);

    if (!shopName || !country || !state || !location) {
      toast({ variant: 'destructive', title: 'Missing information', description: 'Fill all fields.' });
      return;
    }
    if (!Number.isFinite(pickup) || pickup < 0 || !Number.isFinite(maintenance) || maintenance < 0) {
      toast({ variant: 'destructive', title: 'Invalid fees', description: 'Fees must be valid non-negative numbers.' });
      return;
    }

    setIsCreating(true);
    try {
      await addDoc(collection(firestore, 'dispatchShops'), {
        name: shopName,
        country,
        state,
        location,
        pickupFeeNgn: pickup,
        maintenanceFeeNgn: maintenance,
        managerIds: [],
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Dispatch shop created', description: `${shopName} created for ${country}/${state}.` });
      resetCreateForm();
      setCreateOpen(false);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Create failed', description: e?.message || 'Could not create dispatch shop.' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddManager = async () => {
    if (!firestore || !selectedShop || !selectedManagerId) return;
    setIsUpdatingManagers(true);
    try {
      const ref = doc(firestore, 'dispatchShops', selectedShop.id);
      await updateDocumentNonBlocking(ref, { managerIds: arrayUnion(selectedManagerId) });
      toast({ title: 'Manager added', description: 'Dispatch shop managers updated.' });
      setSelectedManagerId('');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Update failed', description: e?.message || 'Could not update managers.' });
    } finally {
      setIsUpdatingManagers(false);
    }
  };

  const handleRemoveManager = async (managerId: string) => {
    if (!firestore || !selectedShop) return;
    setIsUpdatingManagers(true);
    try {
      const ref = doc(firestore, 'dispatchShops', selectedShop.id);
      await updateDocumentNonBlocking(ref, { managerIds: arrayRemove(managerId) });
      toast({ title: 'Manager removed', description: 'Dispatch shop managers updated.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Update failed', description: e?.message || 'Could not update managers.' });
    } finally {
      setIsUpdatingManagers(false);
    }
  };

  const confirmDelete = (shop: DispatchShop) => {
    setShopToDelete(shop);
    setDeleteShopOpen(true);
  };

  const handleDelete = async () => {
    if (!firestore || !shopToDelete) return;
    setIsDeleting(true);
    try {
      const ref = doc(firestore, 'dispatchShops', shopToDelete.id);
      await deleteDocumentNonBlocking(ref);
      toast({ title: 'Dispatch shop deleted', description: `${shopToDelete.name} deleted.` });
      setDeleteShopOpen(false);
      setShopToDelete(null);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Delete failed', description: e?.message || 'Could not delete dispatch shop.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const isLoading = isLoadingShops || isLoadingUsers;

  return (
    <main className="flex-1 p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">Dispatch Shops</h1>
          <p className="text-muted-foreground">Create dispatch shops by country/state and manage shop managers.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Dispatch Shop
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Dispatch Shops</CardTitle>
          <CardDescription>Each shop is tied to a country and state (owners are assigned based on onboarding location).</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Fees</TableHead>
                <TableHead>Managers</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">Loading...</TableCell>
                </TableRow>
              ) : shops && shops.length > 0 ? (
                shops.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell><Badge variant="secondary">{s.country}</Badge></TableCell>
                    <TableCell>{s.state}</TableCell>
                    <TableCell className="max-w-[22rem] truncate">{s.location}</TableCell>
                    <TableCell className="text-sm">
                      <div>Pickup: ₦{Number(s.pickupFeeNgn || 0).toLocaleString()}</div>
                      <div className="text-muted-foreground">Maintenance: ₦{Number(s.maintenanceFeeNgn || 0).toLocaleString()}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {(s.managerIds || []).length}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" className="gap-2" onClick={() => openManagers(s)}>
                        <UserPlus className="h-4 w-4" />
                        Managers
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive gap-2" onClick={() => confirmDelete(s)}>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No dispatch shops yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={(v) => { setCreateOpen(v); if (!v) resetCreateForm(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Dispatch Shop</DialogTitle>
            <DialogDescription>Set the shop location and fees.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Shop Name</Label>
              <Input value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="e.g., BusmoGo Ikeja Hub" disabled={isCreating} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country</Label>
                <Select value={country} onValueChange={(v) => { setCountry(v); setState(''); }} disabled={isCreating}>
                  <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent>
                    {markets.map(m => (
                      <SelectItem key={m.code} value={m.code}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Select value={state} onValueChange={setState} disabled={!country || isCreating}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {(selectedCountry?.cities || []).map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Location (Address)</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Full address" disabled={isCreating} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pickup Fee (₦)</Label>
                <Input value={pickupFeeNgn} onChange={(e) => setPickupFeeNgn(e.target.value)} inputMode="numeric" placeholder="e.g., 1500" disabled={isCreating} />
              </div>
              <div className="space-y-2">
                <Label>Maintenance Fee (₦)</Label>
                <Input value={maintenanceFeeNgn} onChange={(e) => setMaintenanceFeeNgn(e.target.value)} inputMode="numeric" placeholder="e.g., 500" disabled={isCreating} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isCreating}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isCreating} className="gap-2">
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={manageManagersOpen} onOpenChange={(v) => { setManageManagersOpen(v); if (!v) setSelectedShop(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Dispatch Shop Managers</DialogTitle>
            <DialogDescription>Assign managers for {selectedShop?.name}.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Add Manager</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={selectedManagerId} onValueChange={setSelectedManagerId} disabled={isUpdatingManagers || !users || users.length === 0}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Select a user" /></SelectTrigger>
                  <SelectContent>
                    {(users || []).map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.displayName || u.email || u.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddManager} disabled={!selectedManagerId || isUpdatingManagers} className="gap-2">
                  {isUpdatingManagers ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Managers are stored on the shop as a list of user IDs.</p>
            </div>

            <div className="space-y-2">
              <Label>Current Managers</Label>
              <div className="space-y-2">
                {(selectedShop?.managerIds || []).length === 0 ? (
                  <div className="text-sm text-muted-foreground">No managers yet.</div>
                ) : (
                  (selectedShop?.managerIds || []).map((id) => {
                    const u = usersById.get(id);
                    return (
                      <div key={id} className="flex items-center justify-between rounded-md border p-2">
                        <div className="text-sm">
                          <div className="font-medium">{u?.displayName || u?.email || id}</div>
                          {u?.email ? <div className="text-xs text-muted-foreground">{u.email}</div> : null}
                        </div>
                        <Button size="sm" variant="ghost" className="text-destructive gap-2" onClick={() => handleRemoveManager(id)} disabled={isUpdatingManagers}>
                          <X className="h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setManageManagersOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteShopOpen} onOpenChange={setDeleteShopOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete dispatch shop?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {shopToDelete?.name}. Owners assigned to this shop will need reassignment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

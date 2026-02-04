'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import MainLayout from '@/components/app/main-layout';
import { formatCurrency } from '@/lib/currency';
import { Briefcase, FileText, ImagePlus, Megaphone, Loader2 } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, useCollection } from '@/firebase';
import { doc, serverTimestamp, collection, query, where, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { getFunctionUrl } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

interface Service {
    id: string;
    title: string;
    description: string;
    fee: number;
    icon: string;
}

interface AppUser {
    businessId?: string;
    displayName?: string;
    email?: string;
}

interface Business {
    currency?: string;
}

const serviceIcons: { [key: string]: React.ElementType } = {
    Briefcase,
    FileText,
    ImagePlus,
    Megaphone,
};

export default function ServicesPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const servicesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'services'), where('isActive', '==', true));
    }, [firestore]);
    const { data: services, isLoading: isLoadingServices } = useCollection<Service>(servicesQuery);
    
    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile } = useDoc<AppUser>(userProfileRef);
    const businessId = userProfile?.businessId;

    const businessRef = useMemoFirebase(() => businessId ? doc(firestore, 'businesses', businessId) : null, [firestore, businessId]);
    const { data: businessData } = useDoc<Business>(businessRef);
    const currency = businessData?.currency;

    const handleRequestService = async () => {
        if (!selectedService || !user || !userProfile || !businessId || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not process request. Please try again.' });
            return;
        }
        setIsProcessing(true);
        
        let serviceRequestRef;

        try {
            const newRequest = {
                businessId,
                userId: user.uid,
                serviceName: selectedService.title,
                serviceFee: selectedService.fee,
                status: 'pending' as const, // Changed from 'unpaid' to match schema
                paymentStatus: 'unpaid' as const,
                createdAt: serverTimestamp(),
            };
            serviceRequestRef = await addDocumentNonBlocking(collection(firestore, `businesses/${businessId}/serviceRequests`), newRequest);

            if (!serviceRequestRef) {
                throw new Error("Failed to create service request document.");
            }

            const initializePaymentUrl = getFunctionUrl('initializePayment');
            if (!initializePaymentUrl) {
                throw new Error('Payment gateway is not configured.');
            }

            const callbackUrl = window.location.href; // Refresh current page

            const response = await fetch(initializePaymentUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userProfile.email,
                    amount: selectedService.fee,
                    metadata: { 
                        callback_url: callbackUrl,
                        serviceRequestId: serviceRequestRef.id,
                        businessId,
                        userId: user.uid,
                    },
                }),
            });

            const paymentData = await response.json();
            
            if (response.ok && paymentData.status === true && paymentData.data?.authorization_url) {
                window.location.href = paymentData.data.authorization_url;
            } else {
                throw new Error(paymentData.message || 'Failed to initialize payment.');
            }

        } catch (error: any) {
            console.error("Error requesting service:", error);
            if (serviceRequestRef) {
                await deleteDoc(doc(firestore, `businesses/${businessId}/serviceRequests`, serviceRequestRef.id));
            }
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not process your request.' });
            setIsProcessing(false);
            setIsDialogOpen(false);
        }
    };
    
    const openDialogForService = (service: Service) => {
        setSelectedService(service);
        setIsDialogOpen(true);
    };

    const handleDialogStateChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            setSelectedService(null);
        }
    };

    return (
        <MainLayout title="Business Services" backHref="/owner/home">
            <div className="w-full max-w-4xl space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold font-headline">Grow Your Business Faster</h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                        Leverage our team of experts to handle time-consuming tasks so you can focus on what you do best.
                    </p>
                </div>
                {isLoadingServices ? (
                    <div className="grid sm:grid-cols-2 gap-6">
                        <Skeleton className="h-64" />
                        <Skeleton className="h-64" />
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 gap-6">
                        {services?.map((service) => {
                            const Icon = serviceIcons[service.icon] || Briefcase;
                            return (
                            <Card key={service.id} className="flex flex-col">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-primary/10 rounded-lg">
                                            <Icon className="h-6 w-6 text-primary" />
                                        </div>
                                        <CardTitle>{service.title}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <p className="text-muted-foreground">{service.description}</p>
                                </CardContent>
                                <CardFooter className="flex-col items-start gap-4">
                                    <p className="text-2xl font-bold">{formatCurrency(service.fee, currency)} <span className="text-sm font-normal text-muted-foreground">/ one-time</span></p>
                                    <Button className="w-full" onClick={() => openDialogForService(service)}>
                                        Request Service
                                    </Button>
                                </CardFooter>
                            </Card>
                        )})}
                    </div>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={handleDialogStateChange}>
                <DialogContent>
                    {selectedService && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Confirm Service Request</DialogTitle>
                                <DialogDescription>You are about to request the "{selectedService.title}" service.</DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <div className="flex justify-between items-center rounded-lg border p-4">
                                    <span className="font-medium">Total Fee</span>
                                    <span className="text-2xl font-bold">{formatCurrency(selectedService.fee, currency)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2 px-1">
                                    You will be redirected to our secure payment gateway to complete this request.
                                </p>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleRequestService} disabled={isProcessing}>
                                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Proceed to Payment
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}

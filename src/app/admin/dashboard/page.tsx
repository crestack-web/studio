'use client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useFirestore, useMemoFirebase } from "@/firebase";
import { collection, collectionGroup, doc, getCountFromServer, query } from "firebase/firestore";
import { Users, ShoppingCart, DollarSign, Eye } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { useDoc } from "@/firebase";

interface User {
    id: string;
}

interface PlatformRevenueStats {
    totalNgn?: number;
}

export default function AdminDashboardPage() {
    const firestore = useFirestore();

    const [totalUsers, setTotalUsers] = useState<number | null>(null);
    const [totalOrders, setTotalOrders] = useState<number | null>(null);
    const [isLoadingCounts, setIsLoadingCounts] = useState(false);

    const revenueRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'platformStats', 'revenue');
    }, [firestore]);
    const { data: revenueStats, isLoading: isLoadingRevenue } = useDoc<PlatformRevenueStats>(revenueRef);

    useEffect(() => {
        const run = async () => {
            if (!firestore) return;
            setIsLoadingCounts(true);
            try {
                const usersCountSnap = await getCountFromServer(query(collection(firestore, 'users')));
                setTotalUsers(usersCountSnap.data().count);

                const ordersCountSnap = await getCountFromServer(query(collectionGroup(firestore, 'orders')));
                setTotalOrders(ordersCountSnap.data().count);
            } catch (error) {
                console.error('Admin dashboard count queries failed', error);
                setTotalUsers(null);
                setTotalOrders(null);
            } finally {
                setIsLoadingCounts(false);
            }
        };

        run();
    }, [firestore]);

    const stats = [
        {
            title: "Total Users",
            value: totalUsers == null ? '—' : totalUsers.toLocaleString(),
            icon: Users,
            isLoading: isLoadingCounts,
        },
        {
            title: "Total Orders",
            value: totalOrders == null ? '—' : totalOrders.toLocaleString(),
            icon: ShoppingCart,
            isLoading: isLoadingCounts,
        },
        {
            title: "Total Revenue",
            value: `₦${Number(revenueStats?.totalNgn || 0).toLocaleString()}`,
            icon: DollarSign,
            isLoading: isLoadingRevenue,
        },
        {
            title: "Real-time Visits",
            value: "N/A",
            icon: Eye,
            isLoading: false,
            note: "Analytics not implemented"
        }
    ];

    return (
        <main className="flex-1 p-4 sm:p-6">
            <h1 className="text-2xl font-bold font-headline mb-6">Admin Dashboard</h1>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map(stat => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {stat.isLoading ? (
                                <Skeleton className="h-8 w-3/4" />
                            ) : (
                                <div className="text-2xl font-bold">{stat.value}</div>
                            )}
                            {stat.note && <p className="text-xs text-muted-foreground">{stat.note}</p>}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="mt-8 grid gap-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Welcome</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">This is the Busmo admin panel. Use the sidebar to navigate to different sections.</p>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}

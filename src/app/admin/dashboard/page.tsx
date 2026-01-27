'use client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { Users, ShoppingCart, DollarSign, Eye } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

interface User {
    id: string;
}

// Mock data for things I can't easily query across all businesses with the client SDK
const MOCK_TOTAL_ORDERS = 1250;
const MOCK_TOTAL_REVENUE = 7500000;

export default function AdminDashboardPage() {
    const firestore = useFirestore();

    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'users');
    }, [firestore]);
    const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

    const totalUsers = users?.length || 0;

    const stats = [
        {
            title: "Total Users",
            value: totalUsers,
            icon: Users,
            isLoading: isLoadingUsers,
        },
        {
            title: "Total Orders",
            value: MOCK_TOTAL_ORDERS.toLocaleString(),
            icon: ShoppingCart,
            isLoading: false, // Using mock data
            note: "Mock data"
        },
        {
            title: "Total Revenue",
            value: `₦${MOCK_TOTAL_REVENUE.toLocaleString()}`,
            icon: DollarSign,
            isLoading: false, // using mock data
            note: "Mock data"
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

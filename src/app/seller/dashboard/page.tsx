'use client';



// ...existing code...
import { useUser, useFirestore, useAuth, useMemoFirebase, useDoc } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';

interface AppUserProfile {
  displayName?: string;
  businessId?: string;
  role?: string;
}

interface BusinessProfile {
  businessName?: string;
}


// StatCard and other content components remain, but page should not wrap in layout or background classes

interface StatCardProps {
  title: string;
  value: string | number;
  change: string | number;
  color: string;
  up: boolean;
}

function StatCard({ title, value, change, color, up }: StatCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 flex flex-col gap-2 border border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-3">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${color}/10`}></span>
        <span className="font-semibold text-gray-700 dark:text-gray-100 text-lg">{title}</span>
      </div>
      <div className="flex items-end gap-2 mt-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</span>
        <span className={`flex items-center gap-1 text-sm font-medium ${up ? 'text-success-green' : 'text-error-red'}`}>{change}</span>
      </div>
    </div>
  );
}

// import { TrendingUp, TrendingDown, ShoppingCart, Package, BarChart, ArrowRight, Box, PercentCircle } from 'lucide-react';
import Link from 'next/link';

export default function SellerDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Seller Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>
      {/* Add more dashboard widgets here as needed */}
    </div>
  );
}



// TODO: Replace with real data from Firestore
const stats = [
  { title: "Total Revenue", value: "₦1,200,000", change: "+12%", color: "bg-primary-purple", up: true },
  { title: "Total Orders", value: "320", change: "-3%", color: "bg-primary-blue", up: false },
  { title: "Products Listed", value: "48", change: "+2", color: "bg-success-green", up: true },
  { title: "Conversion Rate", value: "4.2%", change: "+0.5%", color: "bg-warning-yellow", up: true },
];

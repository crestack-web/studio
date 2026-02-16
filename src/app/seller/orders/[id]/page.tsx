"use client";
// Seller Order Detail Page (MVP placeholder)
// TODO: Implement order detail UI as per requirements

import { useParams } from "next/navigation";

export default function SellerOrderDetailPage() {
  const params = useParams();
  const { id } = params;
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Order Details</h1>
      <p>Viewing order with ID: {id}</p>
      <p>Order details coming soon...</p>
    </div>
  );
}

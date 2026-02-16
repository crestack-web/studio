"use client";
// Edit Product Page (MVP placeholder)
// TODO: Implement edit product form as per requirements

import { useParams } from "next/navigation";

export default function EditProductPage() {
  const params = useParams();
  const { id } = params;
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Edit Product</h1>
      <p>Editing product with ID: {id}</p>
      <p>Edit product form coming soon...</p>
    </div>
  );
}

import React from 'react';

const SkeletonCard = () => (
  <div className="bg-white p-4 rounded-lg shadow-md">
    <div className="animate-pulse flex space-x-4">
      <div className="rounded-full bg-gray-200 h-10 w-10"></div>
      <div className="flex-1 space-y-6 py-1">
        <div className="h-2 bg-gray-200 rounded"></div>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <div className="h-2 bg-gray-200 rounded col-span-2"></div>
            <div className="h-2 bg-gray-200 rounded col-span-1"></div>
          </div>
          <div className="h-2 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);

export default function Loading() {
  return (
    <div className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

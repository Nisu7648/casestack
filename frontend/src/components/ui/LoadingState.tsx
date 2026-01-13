import React from 'react';

// ============================================
// LOADING STATES - Skeleton Loaders
// Better UX than spinners
// ============================================

export const LoadingCard = () => (
  <div className="bg-white border border-gray-300 p-4 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
  </div>
);

export const LoadingTable = ({ rows = 5 }) => (
  <div className="bg-white border border-gray-300">
    <div className="border-b border-gray-300 p-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="border-b border-gray-300 p-4 animate-pulse">
        <div className="flex gap-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
        </div>
      </div>
    ))}
  </div>
);

export const LoadingDashboard = () => (
  <div className="p-6">
    <div className="max-w-7xl mx-auto">
      {/* Header skeleton */}
      <div className="mb-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/6"></div>
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </div>

      {/* Table skeleton */}
      <LoadingTable rows={10} />
    </div>
  </div>
);

export const LoadingCaseDetail = () => (
  <div className="p-6">
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Main content */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white border border-gray-300 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-300 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default {
  LoadingCard,
  LoadingTable,
  LoadingDashboard,
  LoadingCaseDetail
};

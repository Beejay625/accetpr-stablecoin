'use client'

export default function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
    </div>
  )
}

export function BalanceSkeleton() {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md animate-pulse">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4"></div>
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
    </div>
  )
}

export function TransactionSkeleton() {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md animate-pulse">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        ))}
      </div>
    </div>
  )
}


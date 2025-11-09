'use client'

import { formatAmount } from '@/lib/utils'

interface StatisticsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: string
}

export default function StatisticsCard({ title, value, subtitle, icon }: StatisticsCardProps) {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  )
}


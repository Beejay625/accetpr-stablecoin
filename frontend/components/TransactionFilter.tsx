'use client'

import { useState } from 'react'

interface TransactionFilterProps {
  onFilterChange: (filters: {
    status?: string
    asset?: string
    search?: string
  }) => void
}

export default function TransactionFilter({ onFilterChange }: TransactionFilterProps) {
  const [status, setStatus] = useState<string>('')
  const [asset, setAsset] = useState<string>('')
  const [search, setSearch] = useState<string>('')

  const handleFilterChange = () => {
    onFilterChange({
      status: status || undefined,
      asset: asset || undefined,
      search: search || undefined,
    })
  }

  const clearFilters = () => {
    setStatus('')
    setAsset('')
    setSearch('')
    onFilterChange({})
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md mb-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              onFilterChange({
                status: status || undefined,
                asset: asset || undefined,
                search: e.target.value || undefined,
              })
            }}
            placeholder="Search by hash, address..."
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        <div className="min-w-[150px]">
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              onFilterChange({
                status: e.target.value || undefined,
                asset: asset || undefined,
                search: search || undefined,
              })
            }}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">All Status</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="min-w-[150px]">
          <label className="block text-sm font-medium mb-1">Asset</label>
          <select
            value={asset}
            onChange={(e) => {
              setAsset(e.target.value)
              onFilterChange({
                status: status || undefined,
                asset: e.target.value || undefined,
                search: search || undefined,
              })
            }}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">All Assets</option>
            <option value="USDC">USDC</option>
            <option value="USDT">USDT</option>
            <option value="ETH">ETH</option>
          </select>
        </div>

        <button
          onClick={clearFilters}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Clear
        </button>
      </div>
    </div>
  )
}


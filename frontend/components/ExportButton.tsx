'use client'

import { useState } from 'react'

interface ExportButtonProps {
  data: any[]
  filename?: string
  format?: 'csv' | 'json'
}

export default function ExportButton({ data, filename = 'export', format = 'csv' }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  const exportToCSV = () => {
    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            return typeof value === 'string' && value.includes(',')
              ? `"${value}"`
              : value
          })
          .join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleExport = async () => {
    if (data.length === 0) return

    setLoading(true)
    try {
      if (format === 'csv') {
        exportToCSV()
      } else {
        exportToJSON()
      }
    } finally {
      setLoading(false)
    }
  }

  if (data.length === 0) {
    return null
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => {
          const csvData = format === 'csv' ? data : data
          exportToCSV()
        }}
        disabled={loading}
        className="px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
      >
        {loading ? 'Exporting...' : 'Export CSV'}
      </button>
      <button
        onClick={() => {
          exportToJSON()
        }}
        disabled={loading}
        className="px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
      >
        {loading ? 'Exporting...' : 'Export JSON'}
      </button>
    </div>
  )
}


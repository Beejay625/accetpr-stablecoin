'use client'

import { useState } from 'react'
import { backupRestore } from '@/lib/backupRestore'
import { useToast } from './ToastProvider'

export default function BackupRestorePanel() {
  const { showToast } = useToast()
  const [importing, setImporting] = useState(false)

  const handleExport = () => {
    try {
      backupRestore.exportBackup()
      showToast('Backup exported successfully', 'success')
    } catch (error: any) {
      showToast(`Export failed: ${error.message}`, 'error')
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      await backupRestore.importBackup(file)
      showToast('Backup imported successfully. Please refresh the page.', 'success')
      // Reload page after a delay
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error: any) {
      showToast(`Import failed: ${error.message}`, 'error')
    } finally {
      setImporting(false)
      // Reset input
      event.target.value = ''
    }
  }

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      backupRestore.clearAllData()
      showToast('All data cleared. Please refresh the page.', 'info')
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    }
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Backup & Restore</h3>

      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Export Data</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Export all your data (address book, templates, notes, settings) to a JSON file.
          </p>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Export Backup
          </button>
        </div>

        <div className="border-t dark:border-gray-700 pt-4">
          <h4 className="font-medium mb-2">Import Data</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Import data from a previously exported backup file. This will overwrite existing data.
          </p>
          <label className="block">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={importing}
              className="hidden"
            />
            <span className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer inline-block disabled:opacity-50">
              {importing ? 'Importing...' : 'Import Backup'}
            </span>
          </label>
        </div>

        <div className="border-t dark:border-gray-700 pt-4">
          <h4 className="font-medium mb-2 text-red-600 dark:text-red-400">Danger Zone</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Clear all local data. Make sure you have a backup before proceeding.
          </p>
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  )
}


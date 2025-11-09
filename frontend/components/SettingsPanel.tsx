'use client'

import { useState, useEffect } from 'react'
import BackupRestorePanel from './BackupRestorePanel'
import KeyboardShortcutsModal from './KeyboardShortcutsModal'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState({
    theme: 'system',
    autoRefresh: true,
    refreshInterval: 30,
    notifications: true,
  })
  const [activeTab, setActiveTab] = useState<'general' | 'backup' | 'shortcuts'>('general')
  const [showShortcuts, setShowShortcuts] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('wallet_settings')
    if (saved) {
      setSettings(JSON.parse(saved))
    }
  }, [])

  const saveSettings = (newSettings: typeof settings) => {
    setSettings(newSettings)
    localStorage.setItem('wallet_settings', JSON.stringify(newSettings))
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold">Settings</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="border-b dark:border-gray-700 mb-6">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('general')}
                className={`pb-2 px-1 border-b-2 ${
                  activeTab === 'general'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500'
                }`}
              >
                General
              </button>
              <button
                onClick={() => setActiveTab('backup')}
                className={`pb-2 px-1 border-b-2 ${
                  activeTab === 'backup'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500'
                }`}
              >
                Backup & Restore
              </button>
              <button
                onClick={() => setShowShortcuts(true)}
                className="pb-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700"
              >
                Keyboard Shortcuts
              </button>
            </div>
          </div>

          {activeTab === 'general' && (
            <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => saveSettings({ ...settings, theme: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.autoRefresh}
                onChange={(e) => saveSettings({ ...settings, autoRefresh: e.target.checked })}
                className="rounded"
              />
              <span>Auto-refresh data</span>
            </label>
          </div>

          {settings.autoRefresh && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Refresh Interval (seconds)
              </label>
              <input
                type="number"
                min="10"
                max="300"
                value={settings.refreshInterval}
                onChange={(e) =>
                  saveSettings({ ...settings, refreshInterval: parseInt(e.target.value) })
                }
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          )}

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => saveSettings({ ...settings, notifications: e.target.checked })}
                className="rounded"
              />
              <span>Enable notifications</span>
            </label>
            </div>
          )}

          {activeTab === 'backup' && <BackupRestorePanel />}

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </>
  )
}


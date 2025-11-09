export interface BackupData {
  version: string
  timestamp: number
  addressBook?: any[]
  transactionTemplates?: any[]
  transactionNotes?: any[]
  settings?: Record<string, any>
  analytics?: any
}

class BackupRestoreManager {
  private version = '1.0.0'

  /**
   * Create backup of all user data
   */
  createBackup(): BackupData {
    const backup: BackupData = {
      version: this.version,
      timestamp: Date.now(),
    }

    // Backup address book
    try {
      const addressBook = localStorage.getItem('address_book')
      if (addressBook) {
        backup.addressBook = JSON.parse(addressBook)
      }
    } catch (error) {
      console.error('Failed to backup address book:', error)
    }

    // Backup transaction templates
    try {
      const templates = localStorage.getItem('transaction_templates')
      if (templates) {
        backup.transactionTemplates = JSON.parse(templates)
      }
    } catch (error) {
      console.error('Failed to backup templates:', error)
    }

    // Backup transaction notes
    try {
      const notes = localStorage.getItem('transaction_notes')
      if (notes) {
        backup.transactionNotes = JSON.parse(notes)
      }
    } catch (error) {
      console.error('Failed to backup notes:', error)
    }

    // Backup settings
    try {
      const settings: Record<string, any> = {}
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.startsWith('settings_')) {
          settings[key] = localStorage.getItem(key)
        }
      })
      if (Object.keys(settings).length > 0) {
        backup.settings = settings
      }
    } catch (error) {
      console.error('Failed to backup settings:', error)
    }

    return backup
  }

  /**
   * Export backup to JSON file
   */
  exportBackup(): void {
    const backup = this.createBackup()
    const dataStr = JSON.stringify(backup, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `wallet-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Restore from backup
   */
  restoreBackup(backup: BackupData, options?: { overwrite?: boolean }): void {
    const overwrite = options?.overwrite ?? false

    // Restore address book
    if (backup.addressBook) {
      if (overwrite || !localStorage.getItem('address_book')) {
        localStorage.setItem('address_book', JSON.stringify(backup.addressBook))
      }
    }

    // Restore transaction templates
    if (backup.transactionTemplates) {
      if (overwrite || !localStorage.getItem('transaction_templates')) {
        localStorage.setItem('transaction_templates', JSON.stringify(backup.transactionTemplates))
      }
    }

    // Restore transaction notes
    if (backup.transactionNotes) {
      if (overwrite || !localStorage.getItem('transaction_notes')) {
        localStorage.setItem('transaction_notes', JSON.stringify(backup.transactionNotes))
      }
    }

    // Restore settings
    if (backup.settings) {
      Object.entries(backup.settings).forEach(([key, value]) => {
        if (overwrite || !localStorage.getItem(key)) {
          localStorage.setItem(key, value as string)
        }
      })
    }
  }

  /**
   * Import backup from file
   */
  importBackup(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const backup = JSON.parse(e.target?.result as string) as BackupData
          this.restoreBackup(backup, { overwrite: true })
          resolve()
        } catch (error) {
          reject(new Error('Invalid backup file format'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    const keys = [
      'address_book',
      'transaction_templates',
      'transaction_notes',
      'analytics_events',
      'analytics_stats',
      'notifications',
      'wallet_session',
    ]

    keys.forEach((key) => {
      localStorage.removeItem(key)
    })

    // Clear settings
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('settings_')) {
        localStorage.removeItem(key)
      }
    })
  }
}

export const backupRestore = new BackupRestoreManager()


/**
 * Wallet Backup and Recovery System
 * Secure wallet backup and recovery functionality
 */

export interface WalletBackup {
  id: string
  name: string
  createdAt: number
  encrypted: boolean
  data: string
  checksum: string
}

export interface BackupMetadata {
  walletCount: number
  addressCount: number
  chainCount: number
  version: string
}

class WalletBackupManager {
  private storageKey = 'wallet_backups'
  private backups: WalletBackup[] = []

  constructor() {
    this.loadBackups()
  }

  /**
   * Create backup
   */
  async createBackup(
    name: string,
    data: any,
    encrypt: boolean = false
  ): Promise<string> {
    const backupData = JSON.stringify(data)
    const checksum = this.calculateChecksum(backupData)
    
    let processedData = backupData
    if (encrypt) {
      // In production, use proper encryption
      processedData = await this.encrypt(backupData)
    }

    const backup: WalletBackup = {
      id: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      createdAt: Date.now(),
      encrypted: encrypt,
      data: processedData,
      checksum,
    }

    this.backups.push(backup)
    this.saveBackups()
    return backup.id
  }

  /**
   * Restore backup
   */
  async restoreBackup(backupId: string): Promise<any> {
    const backup = this.backups.find(b => b.id === backupId)
    if (!backup) {
      throw new Error('Backup not found')
    }

    let data = backup.data
    if (backup.encrypted) {
      data = await this.decrypt(backup.data)
    }

    // Verify checksum
    const checksum = this.calculateChecksum(data)
    if (checksum !== backup.checksum) {
      throw new Error('Backup integrity check failed')
    }

    return JSON.parse(data)
  }

  /**
   * Export backup to file
   */
  exportBackup(backupId: string): void {
    const backup = this.backups.find(b => b.id === backupId)
    if (!backup) {
      throw new Error('Backup not found')
    }

    const exportData = {
      ...backup,
      metadata: {
        version: '1.0',
        exportedAt: Date.now(),
      },
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wallet_backup_${backup.name}_${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * Import backup from file
   */
  async importBackup(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const importData = JSON.parse(e.target?.result as string)
          const backup: WalletBackup = {
            id: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: importData.name || `Imported Backup ${new Date().toLocaleDateString()}`,
            createdAt: importData.createdAt || Date.now(),
            encrypted: importData.encrypted || false,
            data: importData.data,
            checksum: importData.checksum,
          }

          // Verify checksum
          let data = backup.data
          if (backup.encrypted) {
            data = await this.decrypt(backup.data)
          }
          const checksum = this.calculateChecksum(data)
          if (checksum !== backup.checksum) {
            reject(new Error('Invalid backup file: checksum mismatch'))
            return
          }

          this.backups.push(backup)
          this.saveBackups()
          resolve(backup.id)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  /**
   * Get all backups
   */
  getAllBackups(): WalletBackup[] {
    return [...this.backups]
  }

  /**
   * Delete backup
   */
  deleteBackup(backupId: string): boolean {
    const index = this.backups.findIndex(b => b.id === backupId)
    if (index === -1) return false

    this.backups.splice(index, 1)
    this.saveBackups()
    return true
  }

  /**
   * Calculate checksum
   */
  private calculateChecksum(data: string): string {
    // Simple checksum - in production, use crypto.subtle.digest
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * Encrypt data (placeholder - use proper encryption in production)
   */
  private async encrypt(data: string): Promise<string> {
    // In production, use Web Crypto API
    return btoa(data) // Base64 encoding as placeholder
  }

  /**
   * Decrypt data (placeholder - use proper decryption in production)
   */
  private async decrypt(data: string): Promise<string> {
    // In production, use Web Crypto API
    return atob(data) // Base64 decoding as placeholder
  }

  /**
   * Save backups to localStorage
   */
  private saveBackups(): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.backups))
    } catch (error) {
      console.error('Failed to save backups:', error)
    }
  }

  /**
   * Load backups from localStorage
   */
  private loadBackups(): void {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        this.backups = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load backups:', error)
    }
  }
}

// Singleton instance
export const walletBackupManager = new WalletBackupManager()


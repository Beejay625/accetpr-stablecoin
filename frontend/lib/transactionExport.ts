/**
 * Transaction History Export with Advanced Filtering
 * Export transaction history in various formats with filtering options
 */

export interface ExportFilter {
  chain?: string
  asset?: string
  status?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
  startDate?: number
  endDate?: number
  minAmount?: string
  maxAmount?: string
  searchQuery?: string
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx'
  includeFields: string[]
  dateFormat?: 'iso' | 'unix' | 'human'
}

export interface TransactionRecord {
  id: string
  hash?: string
  chain: string
  asset: string
  amount: string
  status: string
  type: string
  from: string
  to: string
  timestamp: number
  reference?: string
  gasUsed?: string
  gasPrice?: string
}

class TransactionExporter {
  /**
   * Filter transactions
   */
  filterTransactions(
    transactions: TransactionRecord[],
    filter: ExportFilter
  ): TransactionRecord[] {
    return transactions.filter(tx => {
      if (filter.chain && tx.chain !== filter.chain) return false
      if (filter.asset && tx.asset !== filter.asset) return false
      if (filter.status && tx.status !== filter.status) return false
      if (filter.startDate && tx.timestamp < filter.startDate) return false
      if (filter.endDate && tx.timestamp > filter.endDate) return false
      if (filter.minAmount && parseFloat(tx.amount) < parseFloat(filter.minAmount)) return false
      if (filter.maxAmount && parseFloat(tx.amount) > parseFloat(filter.maxAmount)) return false
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase()
        const matches =
          tx.id.toLowerCase().includes(query) ||
          tx.hash?.toLowerCase().includes(query) ||
          tx.reference?.toLowerCase().includes(query) ||
          tx.from.toLowerCase().includes(query) ||
          tx.to.toLowerCase().includes(query)
        if (!matches) return false
      }
      return true
    })
  }

  /**
   * Export to CSV
   */
  exportToCSV(
    transactions: TransactionRecord[],
    options: ExportOptions
  ): string {
    const headers = options.includeFields.length > 0
      ? options.includeFields
      : ['id', 'hash', 'chain', 'asset', 'amount', 'status', 'timestamp', 'from', 'to', 'reference']

    const rows = transactions.map(tx => {
      return headers.map(header => {
        const value = tx[header as keyof TransactionRecord]
        if (header === 'timestamp') {
          return this.formatDate(value as number, options.dateFormat)
        }
        return value || ''
      })
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return csvContent
  }

  /**
   * Export to JSON
   */
  exportToJSON(
    transactions: TransactionRecord[],
    options: ExportOptions
  ): string {
    const filtered = transactions.map(tx => {
      const record: Record<string, any> = {}
      const fields = options.includeFields.length > 0
        ? options.includeFields
        : Object.keys(tx)

      fields.forEach(field => {
        if (field === 'timestamp' && options.dateFormat) {
          record[field] = this.formatDate(tx.timestamp, options.dateFormat)
        } else {
          record[field] = tx[field as keyof TransactionRecord]
        }
      })
      return record
    })

    return JSON.stringify(filtered, null, 2)
  }

  /**
   * Format date based on format option
   */
  private formatDate(timestamp: number, format?: string): string {
    if (!format || format === 'unix') {
      return timestamp.toString()
    }

    if (format === 'iso') {
      return new Date(timestamp).toISOString()
    }

    if (format === 'human') {
      return new Date(timestamp).toLocaleString()
    }

    return timestamp.toString()
  }

  /**
   * Download file
   */
  downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * Export transactions
   */
  export(
    transactions: TransactionRecord[],
    filter: ExportFilter,
    options: ExportOptions
  ): void {
    const filtered = this.filterTransactions(transactions, filter)
    
    let content: string
    let filename: string
    let mimeType: string

    switch (options.format) {
      case 'csv':
        content = this.exportToCSV(filtered, options)
        filename = `transactions_${Date.now()}.csv`
        mimeType = 'text/csv'
        break
      case 'json':
        content = this.exportToJSON(filtered, options)
        filename = `transactions_${Date.now()}.json`
        mimeType = 'application/json'
        break
      default:
        throw new Error(`Unsupported format: ${options.format}`)
    }

    this.downloadFile(content, filename, mimeType)
  }

  /**
   * Get export statistics
   */
  getExportStats(
    transactions: TransactionRecord[],
    filter: ExportFilter
  ): {
    total: number
    filtered: number
    byStatus: Record<string, number>
    byChain: Record<string, number>
    byAsset: Record<string, number>
    totalAmount: string
  } {
    const filtered = this.filterTransactions(transactions, filter)
    
    const byStatus: Record<string, number> = {}
    const byChain: Record<string, number> = {}
    const byAsset: Record<string, number> = {}
    let totalAmount = 0

    filtered.forEach(tx => {
      byStatus[tx.status] = (byStatus[tx.status] || 0) + 1
      byChain[tx.chain] = (byChain[tx.chain] || 0) + 1
      byAsset[tx.asset] = (byAsset[tx.asset] || 0) + 1
      totalAmount += parseFloat(tx.amount)
    })

    return {
      total: transactions.length,
      filtered: filtered.length,
      byStatus,
      byChain,
      byAsset,
      totalAmount: totalAmount.toFixed(2),
    }
  }
}

// Singleton instance
export const transactionExporter = new TransactionExporter()


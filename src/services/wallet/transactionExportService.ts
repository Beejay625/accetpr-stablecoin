import { SimplifiedTransaction } from '../../providers/blockradar/transactions/transactions.interface';

/**
 * Transaction Export Service
 * 
 * Provides functionality to export transactions in various formats.
 */
export class TransactionExportService {
  /**
   * Export transactions as CSV
   */
  static exportToCSV(transactions: SimplifiedTransaction[]): string {
    if (transactions.length === 0) {
      return 'Transaction ID,Hash,Asset,Chain,Amount,Status,Reference,Transaction Time\n';
    }

    const headers = ['Transaction ID', 'Hash', 'Asset', 'Chain', 'Amount', 'Status', 'Reference', 'Transaction Time'];
    const rows = transactions.map(tx => [
      tx.transactionId,
      tx.hash,
      tx.asset,
      tx.chain,
      tx.amountPaid,
      tx.status,
      tx.reference || '',
      tx.transactionTime
    ]);

    const csvRows = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ];

    return csvRows.join('\n');
  }

  /**
   * Export transactions as JSON
   */
  static exportToJSON(transactions: SimplifiedTransaction[]): string {
    return JSON.stringify(transactions, null, 2);
  }

  /**
   * Export transactions based on format
   */
  static export(transactions: SimplifiedTransaction[], format: 'csv' | 'json'): string {
    switch (format) {
      case 'csv':
        return this.exportToCSV(transactions);
      case 'json':
        return this.exportToJSON(transactions);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Get content type for export format
   */
  static getContentType(format: 'csv' | 'json'): string {
    switch (format) {
      case 'csv':
        return 'text/csv';
      case 'json':
        return 'application/json';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Get filename for export
   */
  static getFilename(format: 'csv' | 'json', prefix: string = 'transactions'): string {
    const extension = format === 'csv' ? 'csv' : 'json';
    const timestamp = new Date().toISOString().split('T')[0];
    return `${prefix}-${timestamp}.${extension}`;
  }
}


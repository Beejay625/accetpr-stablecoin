import { createLoggerWithFunction } from '../../logger';

/**
 * Audit Log Service
 * 
 * Provides audit logging for sensitive operations and user actions.
 */
export interface AuditLogEntry {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  status: 'SUCCESS' | 'FAILURE';
  error?: string;
}

export class AuditLogService {
  private static logger = createLoggerWithFunction('AuditLogService', { module: 'audit' });

  /**
   * Log an audit event
   */
  static log(entry: Omit<AuditLogEntry, 'timestamp'>): void {
    const auditEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date()
    };

    // Log to structured logger
    this.logger.info({
      audit: true,
      userId: auditEntry.userId,
      action: auditEntry.action,
      resource: auditEntry.resource,
      resourceId: auditEntry.resourceId,
      status: auditEntry.status,
      details: auditEntry.details,
      ipAddress: auditEntry.ipAddress,
      userAgent: auditEntry.userAgent,
      error: auditEntry.error,
      timestamp: auditEntry.timestamp.toISOString()
    }, `Audit: ${auditEntry.action} on ${auditEntry.resource}`);

    // In production, you might want to also write to a separate audit database
    // or send to an audit logging service
  }

  /**
   * Log a withdrawal operation
   */
  static logWithdrawal(
    userId: string,
    chain: string,
    asset: string,
    amount: string,
    recipientAddress: string,
    transactionId: string,
    status: 'SUCCESS' | 'FAILURE',
    error?: string,
    ipAddress?: string,
    userAgent?: string
  ): void {
    this.log({
      userId,
      action: 'WITHDRAWAL',
      resource: 'wallet',
      resourceId: transactionId,
      details: {
        chain,
        asset,
        amount,
        recipientAddress
      },
      status,
      error,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log a balance check
   */
  static logBalanceCheck(
    userId: string,
    chain: string,
    ipAddress?: string,
    userAgent?: string
  ): void {
    this.log({
      userId,
      action: 'BALANCE_CHECK',
      resource: 'wallet',
      details: { chain },
      status: 'SUCCESS',
      ipAddress,
      userAgent
    });
  }

  /**
   * Log a transaction view
   */
  static logTransactionView(
    userId: string,
    chain: string,
    transactionId?: string,
    ipAddress?: string,
    userAgent?: string
  ): void {
    this.log({
      userId,
      action: 'TRANSACTION_VIEW',
      resource: 'transaction',
      resourceId: transactionId,
      details: { chain },
      status: 'SUCCESS',
      ipAddress,
      userAgent
    });
  }

  /**
   * Log wallet generation
   */
  static logWalletGeneration(
    userId: string,
    chains: string[],
    ipAddress?: string,
    userAgent?: string
  ): void {
    this.log({
      userId,
      action: 'WALLET_GENERATION',
      resource: 'wallet',
      details: { chains },
      status: 'SUCCESS',
      ipAddress,
      userAgent
    });
  }

  /**
   * Log export operation
   */
  static logExport(
    userId: string,
    chain: string,
    format: string,
    transactionCount: number,
    ipAddress?: string,
    userAgent?: string
  ): void {
    this.log({
      userId,
      action: 'EXPORT',
      resource: 'transaction',
      details: {
        chain,
        format,
        transactionCount
      },
      status: 'SUCCESS',
      ipAddress,
      userAgent
    });
  }
}


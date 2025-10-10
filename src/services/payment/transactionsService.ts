import { PaymentRepository } from '../../repositories/database/payment/paymentRepository';
import { PaymentIntentStatus } from '../../repositories/database/payment/payment.interface';
import { createLoggerWithFunction } from '../../logger';

export class TransactionsService {
  private static logger = createLoggerWithFunction('TransactionsService', { module: 'service' });

  static async getUserTransactions(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    transactions: Array<{
      id: string;
      paymentIntentId: string;
      productId: string;
      slug: string;
      amount: string;
      currency: string;
      status: PaymentIntentStatus;
      customerName?: string;
      customerEmail?: string;
      paymentMethodTypes: string[];
      createdAt: string;
      updatedAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    this.logger.info('getUserTransactions', { userId, page, limit }, 'Getting user payment transactions');

    // Get payment intents with terminal statuses
    const statuses = [
      PaymentIntentStatus.SUCCEEDED,
      PaymentIntentStatus.FAILED,
      PaymentIntentStatus.CANCELLED
    ];
    
    const result = await PaymentRepository.getTransactionsByStatus(
      userId,
      statuses,
      page,
      limit
    );
    
    // Format transactions with full details
    const formattedTransactions = result.transactions.map(tx => ({
      id: tx.id,
      paymentIntentId: tx.paymentIntentId,
      productId: tx.productId,
      slug: tx.slug,
      amount: (tx.amount / 100).toFixed(2), // Convert cents to dollars
      currency: tx.currency,
      status: tx.status,
      customerName: tx.customerName,
      customerEmail: tx.customerEmail,
      paymentMethodTypes: tx.paymentMethodTypes,
      createdAt: tx.createdAt.toISOString(),
      updatedAt: tx.updatedAt.toISOString()
    }));
    
    const response = {
      transactions: formattedTransactions,
      pagination: {
        page: result.page,
        limit,
        total: result.total,
        totalPages: result.totalPages
      }
    };

    this.logger.info('getUserTransactions', { 
      userId, 
      page, 
      limit, 
      transactionCount: formattedTransactions.length,
      total: result.total 
    }, 'User payment transactions retrieved successfully');

    return response;
  }
}

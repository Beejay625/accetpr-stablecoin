import { BlockRadarBase } from '../base';
import { TransactionsResponse, TransactionsError } from './transactions.interface';
import { getWalletIdForChain } from '../walletIdManagement';

/**
 * Get wallet address transactions
 * Uses default wallet ID since transaction queries work with any wallet ID
 * 
 * @param addressId - The address ID to get transactions for
 * @returns Promise<TransactionsResponse> - The transactions response
 * 
 * @example
 * ```typescript
 * const transactions = await getAddressTransactions("address_123");
 * console.log(transactions.data); // Array of transactions
 * ```
 */
export async function getAddressTransactions(addressId: string): Promise<TransactionsResponse> {
  try {
    const walletId = getWalletIdForChain('default');
    const response = await BlockRadarBase.request(walletId, `addresses/${addressId}/transactions`);
    
    return response as TransactionsResponse;
  } catch (error: any) {
    // Handle specific error cases
    if (error.response?.data) {
      throw {
        message: error.response.data.message || 'Failed to fetch transactions',
        statusCode: error.response.status || 500,
        error: error.response.data.error || error.message
      } as TransactionsError;
    }
    
    throw {
      message: 'Failed to fetch transactions',
      statusCode: 500,
      error: error.message
    } as TransactionsError;
  }
}
import { BlockRadarBase } from '../base';
import { WithdrawRequest, WithdrawResponse, WithdrawError, SingleWithdrawRequest, BatchWithdrawRequest } from './withdraw.interface';

/**
 * Withdraw assets from wallet address
 * Supports both single and batch withdrawal patterns
 * 
 * @param addressId - The address ID to withdraw from
 * @param withdrawRequest - The withdraw request (single or batch)
 * @returns Promise<WithdrawResponse> - The withdraw response with transaction details
 * 
 * @example
 * ```typescript
 * // Single withdrawal
 * const singleRequest: SingleWithdrawRequest = {
 *   chain: "base",
 *   asset: "USDC",
 *   amount: "0.5",
 *   address: "0x451dEFC27B45808078e875556AF06bCFdC697BA4",
 *   metadata: { id: "0001" },
 *   reference: "single withdraw"
 * };
 * 
 * // Batch withdrawal
 * const batchRequest: BatchWithdrawRequest = {
 *   assets: [
 *     {
 *       chain: "base",
 *       asset: "USDC",
 *       address: "0x451dEFC27B45808078e875556AF06bCFdC697BA4",
 *       amount: "0.5",
 *       metadata: { id: "0001" },
 *       reference: "batch withdraw 1"
 *     }
 *   ]
 * };
 * 
 * const result = await withdrawFromAddress("address_123", singleRequest);
 * const batchResult = await withdrawFromAddress("address_123", batchRequest);
 * ```
 */
export async function withdrawFromAddress(
  addressId: string, 
  withdrawRequest: WithdrawRequest
): Promise<WithdrawResponse> {
  try {
    BlockRadarBase.validateConfiguration();
    
    // Normalize the request to the API format
    const apiRequest = normalizeWithdrawRequest(withdrawRequest);
    
    const response = await BlockRadarBase.request(
      `addresses/${addressId}/withdraw`, 
      'POST', 
      apiRequest
    );
    
    return response as WithdrawResponse;
  } catch (error: any) {
    // Handle specific error cases
    if (error.response?.data) {
      throw {
        message: error.response.data.message || 'Withdraw request failed',
        statusCode: error.response.status || 500,
        error: error.response.data.error || error.message
      } as WithdrawError;
    }
    
    throw {
      message: 'Withdraw request failed',
      statusCode: 500,
      error: error.message
    } as WithdrawError;
  }
}

/**
 * Normalize withdraw request to API format
 * Converts single withdrawal to batch format for API consistency
 */
function normalizeWithdrawRequest(request: WithdrawRequest): BatchWithdrawRequest {
  // Check if it's a single withdrawal (has chain, asset, amount, address at top level)
  if ('chain' in request && 'asset' in request && 'amount' in request && 'address' in request) {
    const singleRequest = request as SingleWithdrawRequest;
    return {
      assets: [{
        chain: singleRequest.chain,
        asset: singleRequest.asset,
        amount: singleRequest.amount,
        address: singleRequest.address,
        ...(singleRequest.metadata && { metadata: singleRequest.metadata }),
        ...(singleRequest.reference && { reference: singleRequest.reference })
      }]
    };
  }
  
  // It's already a batch request
  return request as BatchWithdrawRequest;
}
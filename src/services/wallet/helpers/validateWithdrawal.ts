import { SingleWithdrawRequest, BatchWithdrawRequest } from '../../../providers/blockradar/withdraw/withdraw.interface';
import { Err } from '../../../errors';

/**
 * Withdrawal Validation Helpers
 * 
 * Contains validation logic for single and batch withdrawal requests
 */

/**
 * Validate single withdraw request
 */
export function validateSingleWithdrawRequest(request: SingleWithdrawRequest): void {
  if (!request.chain || typeof request.chain !== 'string') {
    throw Err.validation('Chain is required and must be a string');
  }

  if (!request.asset || typeof request.asset !== 'string') {
    throw Err.validation('Asset is required and must be a string');
  }

  if (!request.amount || typeof request.amount !== 'string') {
    throw Err.validation('Amount is required and must be a string');
  }

  if (!request.address || typeof request.address !== 'string') {
    throw Err.validation('Address is required and must be a string');
  }

  const amount = parseFloat(request.amount);
  if (isNaN(amount) || amount <= 0) {
    throw Err.validation('Amount must be a positive number');
  }
}

/**
 * Validate batch withdraw request
 */
export function validateBatchWithdrawRequest(request: BatchWithdrawRequest): void {
  if (!request.assets || !Array.isArray(request.assets)) {
    throw new Error('Assets array is required');
  }

  if (request.assets.length === 0) {
    throw new Error('At least one asset is required');
  }

  for (const asset of request.assets) {
    if (!asset.chain || typeof asset.chain !== 'string') {
      throw new Error('Asset chain is required and must be a string');
    }

    if (!asset.asset || typeof asset.asset !== 'string') {
      throw new Error('Asset symbol is required and must be a string');
    }

    if (!asset.address || typeof asset.address !== 'string') {
      throw new Error('Asset address is required and must be a string');
    }

    if (!asset.amount || typeof asset.amount !== 'string') {
      throw new Error('Asset amount is required and must be a string');
    }

    const amount = parseFloat(asset.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Asset amount must be a positive number');
    }
  }
}

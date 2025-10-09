/**
 * Product Helper Functions
 * 
 * Utility functions for product operations
 */

import { LinkExpiration, ProductRequest } from '../product.interface';
import { DEFAULT_CHAINS, isTokenSupportedOnChain, getSupportedTokensForChain } from '../../../providers/blockradar/walletIdAndTokenManagement/chainsAndTokensHelpers';
import { env } from '../../../config/env';
import { Err } from '../../../errors';

/**
 * Validate product request
 * Throws AppError (400/422) for validation failures
 */
export function validateProductRequest(request: ProductRequest): void {
  if (!request.productName || typeof request.productName !== 'string') {
    throw Err.validation('Product name is required and must be a string');
  }

  if (!request.description || typeof request.description !== 'string') {
    throw Err.validation('Description is required and must be a string');
  }

  if (!request.amount || typeof request.amount !== 'string') {
    throw Err.validation('Amount is required and must be a string');
  }

  // Validate amount is a positive number
  const amount = parseFloat(request.amount);
  if (isNaN(amount) || amount <= 0) {
    throw Err.validation('Amount must be a positive number');
  }

  if (!request.payoutChain || typeof request.payoutChain !== 'string') {
    throw Err.validation('Payout chain is required and must be a string');
  }

  // Validate payout chain is supported (fail fast)
  if (!DEFAULT_CHAINS.includes(request.payoutChain)) {
    const envType = process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'dev' ? 'development' : 'production';
    throw Err.validation(
      `Invalid payout chain: ${request.payoutChain}. Supported chains in ${envType}: ${DEFAULT_CHAINS.join(', ')}`,
      { providedChain: request.payoutChain, supportedChains: DEFAULT_CHAINS }
    );
  }

  if (!request.payoutToken || typeof request.payoutToken !== 'string') {
    throw Err.validation('Payout token is required and must be a string');
  }

  // Validate token is supported on the specified chain
  if (!isTokenSupportedOnChain(request.payoutChain, request.payoutToken)) {
    const supportedTokens = getSupportedTokensForChain(request.payoutChain);
    throw Err.validation(
      `Token ${request.payoutToken} is not supported on chain ${request.payoutChain}. Supported tokens: ${supportedTokens.join(', ')}`,
      { providedToken: request.payoutToken, supportedTokens }
    );
  }

  if (!request.slug || typeof request.slug !== 'string') {
    throw Err.validation('Slug is required and must be a string');
  }

  if (!Object.values(LinkExpiration).includes(request.linkExpiration)) {
    throw Err.validation(
      `Invalid link expiration: ${request.linkExpiration}. Supported values: ${Object.values(LinkExpiration).join(', ')}`
    );
  }

  // If custom days is specified, validate it
  if (request.linkExpiration === LinkExpiration.CUSTOM_DAYS) {
    if (!request.customDays || typeof request.customDays !== 'number' || request.customDays <= 0) {
      throw Err.validation('Custom days is required and must be a positive number when link expiration is custom_days');
    }
  }

  // Validate image URL if provided
  if (request.image && typeof request.image !== 'string') {
    throw Err.validation('Image must be a valid URL string');
  }
}

/**
 * Generate a unique slug from product name
 */
export function generateSlug(productName: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const baseSlug = productName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30);
  
  return `${baseSlug}-${timestamp}-${randomSuffix}`;
}

/**
 * Generate payment link from user unique name and slug
 */
export function generatePaymentLink(userUniqueName: string, slug: string): string {
  return `${env.BASE_URL}/${userUniqueName}/${slug}`;
}

/**
 * Calculate expiration date based on link expiration setting
 */
export function calculateExpirationDate(linkExpiration: LinkExpiration, customDays?: number): string | undefined {
  if (linkExpiration === LinkExpiration.NEVER) {
    return undefined;
  }

  if (linkExpiration === LinkExpiration.CUSTOM_DAYS && customDays) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + customDays);
    return expirationDate.toISOString();
  }

  return undefined;
}

/**
 * Generate unique product ID (max 9 characters)
 */
export function generateProductId(): string {
  // Use shorter timestamp and random parts to keep under 9 characters
  const timestamp = Date.now().toString(36).slice(-4); // Last 4 chars of timestamp
  const randomPart = Math.random().toString(36).substring(2, 5); // 3 random chars
  return `pr${timestamp}${randomPart}`; // Total: 2 + 4 + 3 = 9 characters (pr = product)
}


import { userRepository } from '../../../repositories/database/user/userRepository';
import { ProductRepository } from '../../../repositories/database/product/productRepository';
import { createLoggerWithFunction } from '../../../logger';
import { Err } from '../../../errors';

/**
 * Payment Link Helper Functions
 * 
 * Contains helper functions for processing payment links and finding related data
 */

const logger = createLoggerWithFunction('PaymentLinkHelpers', { module: 'payment-helpers' });

/**
 * Extract user unique name and slug from payment link
 * 
 * @param paymentLink - The payment link
 * @returns { userUniqueName: string; slug: string }
 */
export function extractUserAndSlugFromLink(paymentLink: string): { userUniqueName: string; slug: string } {
  try {
    // Parse the payment link as a URL to extract pathname
    const url = new URL(paymentLink);
    const pathname = url.pathname;
    
    // Remove leading/trailing slashes and split by '/'
    const pathParts = pathname.replace(/^\/|\/$/g, '').split('/');
    
    // We expect exactly 2 parts: userUniqueName and slug
    if (pathParts.length !== 2) {
      logger.warn({ paymentLink, pathParts, count: pathParts.length }, 'Invalid payment link format - expected 2 parts');
      throw Err.badRequest(`Invalid payment link format. Expected: {baseUrl}/{userUniqueName}/{slug}, got ${pathParts.length} parts`);
    }

    const [userUniqueName, slug] = pathParts;
    
    if (!userUniqueName || !slug) {
      logger.warn({ paymentLink, userUniqueName, slug }, 'Invalid payment link - missing parts');
      throw Err.badRequest('Invalid payment link format. User unique name and slug are required');
    }

    logger.debug({ paymentLink, userUniqueName, slug }, 'Successfully extracted user and slug from payment link');
    
    return { userUniqueName, slug };
  } catch (error: any) {
    // If it's already an AppError, re-throw it
    if (error.name === 'AppError') {
      throw error;
    }
    // If URL parsing failed, throw a bad request error
    logger.error({ paymentLink, error: error.message }, 'Failed to parse payment link URL');
    throw Err.badRequest('Invalid payment link format. Must be a valid URL');
  }
}

/**
 * Find user by unique name
 * 
 * @param userUniqueName - The user's unique name
 * @returns Promise<{ id: string; uniqueName: string } | null>
 */
export async function findUserByUniqueName(userUniqueName: string) {
  try {
    const user = await userRepository.findByUniqueName(userUniqueName);
    if (!user) {
      logger.warn({ userUniqueName }, 'User not found for payment link');
    }
    return user;
  } catch (error: any) {
    logger.error({ userUniqueName, error: error.message }, 'Failed to find user by unique name');
    throw Err.notFound('Invalid payment link');
  }
}

/**
 * Find product by user ID and slug
 * 
 * @param userId - The user ID
 * @param slug - The product slug
 * @returns Promise<Product | null>
 */
export async function findProductByUserAndSlug(userId: string, slug: string) {
  try {
    const product = await ProductRepository.findProductByUserAndSlug(userId, slug);
    if (!product) {
      logger.warn({ userId, slug }, 'Product not found for payment link');
    }
    return product;
  } catch (error: any) {
    logger.error({ userId, slug, error: error.message }, 'Failed to find product by user and slug');
    throw Err.notFound('Invalid payment link');
  }
}

/**
 * Validate product status
 * 
 * @param product - The product to validate
 */
export function validateProductStatus(product: any): void {
  // Check if product has expired first (more specific error)
  if (product.expiresAt && new Date(product.expiresAt) < new Date()) {
    throw Err.badRequest('Link has expired');
  }

  // Check if product is cancelled
  if (product.status === 'cancelled') {
    throw Err.badRequest('This product has been cancelled and is no longer available');
  }

  // Check if product is active
  if (product.status !== 'active') {
    throw Err.badRequest('Invalid payment link');
  }
}

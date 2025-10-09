import { env } from '../../../config/env';
import { userRepository } from '../../../repositories/database/user/userRepository';
import { ProductRepository } from '../../../repositories/database/product/productRepository';
import { createLoggerWithFunction } from '../../../logger';

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
  const baseUrl = env.BASE_URL as string;
  
  // Remove base URL and extract path
  const path = paymentLink.replace(baseUrl, '');
  
  // Remove leading slash and split by '/'
  const pathParts = path.replace(/^\//, '').split('/');
  
  if (pathParts.length !== 2) {
    throw new Error('Invalid payment link format. Expected: {baseUrl}/{userUniqueName}/{slug}');
  }

  const [userUniqueName, slug] = pathParts;
  
  if (!userUniqueName || !slug) {
    throw new Error('Invalid payment link format. User unique name and slug are required');
  }

  return { userUniqueName, slug };
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
    throw new Error('Invalid payment link');
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
    throw new Error('Invalid payment link');
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
    throw new Error('Link has expired');
  }

  // Check if product is active
  if (product.status !== 'active') {
    throw new Error('Invalid payment link');
  }
}

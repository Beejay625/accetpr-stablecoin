import { DatabaseOperations } from '../../../db/databaseOperations';
import { createLoggerWithFunction } from '../../../logger';
import { Product } from '../../../services/product/product.interface';

/**
 * Product Repository
 * 
 * Handles all database operations for products
 */
export class ProductRepository {
  private static logger = createLoggerWithFunction('ProductRepository', { module: 'repository' });

  /**
   * Save product to database
   * 
   * @param product - The product to save
   * @param userId - The user ID who created the product
   * @returns Promise<void>
   */
  static async saveProduct(product: Product, userId: string): Promise<void> {
    try {
      await DatabaseOperations.create('product', {
        id: product.id,
        userId: userId,
        image: product.image,
        productName: product.productName,
        description: product.description,
        amount: product.amount,
        payoutChain: product.payoutChain,
        payoutToken: product.payoutToken,
        paymentLink: product.paymentLink,
        slug: product.slug,
        linkExpiration: product.linkExpiration,
        customDays: product.customDays,
        expiresAt: product.expiresAt,
        status: product.status,
        createdAt: new Date(product.createdAt),
        updatedAt: new Date(product.updatedAt)
      }, ['id']); // Use 'id' as unique field for race condition protection

      this.logger.info('saveProduct', { 
        userId, 
        productId: product.id 
      }, 'Product saved to database successfully');
    } catch (error: any) {
      this.logger.error('saveProduct', { 
        userId, 
        productId: product.id, 
        error: error.message 
      }, 'Failed to save product to database');
      // Re-throw original error to preserve error code (e.g., P2002 for unique constraint)
      throw error;
    }
  }

  /**
   * Get product by ID
   * 
   * @param productId - The product ID
   * @param userId - The user ID (for ownership verification)
   * @returns Promise<Product | null>
   */
  static async getProductById(productId: string, userId: string): Promise<Product | null> {
    try {
      const product = await DatabaseOperations.findUnique('product', {
        id: productId,
        userId: userId
      });

      if (product) {
        this.logger.info('getProductById', { 
          userId, 
          productId 
        }, 'Product retrieved from database');
      }

      return product as Product | null;
    } catch (error: any) {
      this.logger.error('getProductById', { 
        userId, 
        productId, 
        error: error.message 
      }, 'Failed to get product from database');
      throw new Error(`Failed to get product: ${error.message}`);
    }
  }

  /**
   * Get all products for a user with optional status filter
   * 
   * @param userId - The user ID
   * @param status - Optional status filter ('active', 'expired', 'cancelled')
   * @returns Promise<Product[]>
   */
  static async getUserProducts(userId: string, status?: 'active' | 'expired' | 'cancelled'): Promise<Product[]> {
    try {
      const whereClause: any = { userId };
      
      // Add status filter if provided
      if (status) {
        whereClause.status = status;
      }

      const products = await DatabaseOperations.findMany('product', whereClause, {
        orderBy: {
          createdAt: 'desc'
        }
      });

      this.logger.info('getUserProducts', { 
        userId, 
        status: status || 'all',
        count: products.length 
      }, 'User products retrieved from database');

      return products as Product[];
    } catch (error: any) {
      this.logger.error('getUserProducts', { 
        userId,
        status, 
        error: error.message 
      }, 'Failed to get user products from database');
      throw new Error(`Failed to get user products: ${error.message}`);
    }
  }

  /**
   * Find product by user ID and slug
   * 
   * @param userId - The user ID
   * @param slug - The product slug
   * @returns Promise<Product | null>
   */
  static async findProductByUserAndSlug(userId: string, slug: string): Promise<Product | null> {
    try {
      const product = await DatabaseOperations.findUnique('product', {
        userId_slug: {
          userId: userId,
          slug: slug
        }
      });

      if (product) {
        this.logger.info('findProductByUserAndSlug', { 
          userId,
          slug,
          productId: (product as any).id
        }, 'Product found by user and slug');
      }

      return product as Product | null;
    } catch (error: any) {
      this.logger.error('findProductByUserAndSlug', { 
        userId,
        slug, 
        error: error.message 
      }, 'Failed to find product by user and slug');
      throw new Error(`Failed to find product by user and slug: ${error.message}`);
    }
  }

  /**
   * Update product status
   * 
   * @param productId - The product ID
   * @param userId - The user ID (for ownership verification)
   * @param status - The new status
   * @returns Promise<void>
   */
  static async updateProductStatus(
    productId: string, 
    userId: string, 
    status: 'active' | 'expired' | 'cancelled'
  ): Promise<void> {
    try {
      await DatabaseOperations.update('product', {
        id: productId,
        userId: userId
      }, {
        status: status,
        updatedAt: new Date()
      });

      this.logger.info('updateProductStatus', { 
        userId, 
        productId, 
        status 
      }, 'Product status updated in database');
    } catch (error: any) {
      this.logger.error('updateProductStatus', { 
        userId, 
        productId, 
        status, 
        error: error.message 
      }, 'Failed to update product status in database');
      throw new Error(`Failed to update product status: ${error.message}`);
    }
  }

  /**
   * Get payment intent count statistics for a product
   * 
   * @param productId - The product ID
   * @returns Promise with payment intent counts by status
   */
  static async getProductPaymentIntentCounts(productId: string): Promise<{
    created: number;
    succeeded: number;
    failed: number;
    cancelled: number;
    processing: number;
    requiresAction: number;
  }> {
    try {
      // Query only status field for efficiency
      const allIntents = await DatabaseOperations.findMany<{ status: string }>('paymentIntent', { productId });
      
      // Count by status
      const stats = {
        created: allIntents.length,
        succeeded: allIntents.filter(pi => pi.status === 'SUCCEEDED').length,
        failed: allIntents.filter(pi => pi.status === 'FAILED').length,
        cancelled: allIntents.filter(pi => pi.status === 'CANCELLED').length,
        processing: allIntents.filter(pi => pi.status === 'PROCESSING').length,
        requiresAction: allIntents.filter(pi => pi.status === 'PENDING').length
      };

      this.logger.debug('getProductPaymentIntentCounts', {
        productId,
        ...stats
      }, 'Product payment intent counts calculated');

      return stats;
    } catch (error: any) {
      this.logger.error('getProductPaymentIntentCounts', {
        productId,
        error: error.message
      }, 'Failed to get product payment intent counts');
      throw new Error(`Failed to get product payment intent counts: ${error.message}`);
    }
  }

  /**
   * Get payment intent amount statistics for a product
   * 
   * @param productId - The product ID
   * @returns Promise with payment intent amounts by status (in dollars)
   */
  static async getProductPaymentIntentAmounts(productId: string): Promise<{
    amountCreated: number;
    amountSucceeded: number;
    amountFailed: number;
    amountCancelled: number;
    amountProcessing: number;
    amountRequiresAction: number;
  }> {
    try {
      // Query status and amount fields
      const allIntents = await DatabaseOperations.findMany<{ status: string; amount: number }>('paymentIntent', { productId });
      
      // Helper function to sum amounts
      const sumAmounts = (intents: { amount: number }[]) => 
        intents.reduce((sum, pi) => sum + (pi.amount || 0), 0);
      
      // Filter by status
      const succeeded = allIntents.filter(pi => pi.status === 'SUCCEEDED');
      const failed = allIntents.filter(pi => pi.status === 'FAILED');
      const cancelled = allIntents.filter(pi => pi.status === 'CANCELLED');
      const processing = allIntents.filter(pi => pi.status === 'PROCESSING');
      const requiresAction = allIntents.filter(pi => pi.status === 'PENDING');
      
      // Calculate amount stats (convert cents to dollars)
      const stats = {
        amountCreated: sumAmounts(allIntents) / 100,
        amountSucceeded: sumAmounts(succeeded) / 100,
        amountFailed: sumAmounts(failed) / 100,
        amountCancelled: sumAmounts(cancelled) / 100,
        amountProcessing: sumAmounts(processing) / 100,
        amountRequiresAction: sumAmounts(requiresAction) / 100
      };

      this.logger.debug('getProductPaymentIntentAmounts', {
        productId,
        ...stats
      }, 'Product payment intent amounts calculated');

      return stats;
    } catch (error: any) {
      this.logger.error('getProductPaymentIntentAmounts', {
        productId,
        error: error.message
      }, 'Failed to get product payment intent amounts');
      throw new Error(`Failed to get product payment intent amounts: ${error.message}`);
    }
  }

  /**
   * Get product by payment link (for public access)
   * Uses a single optimized query with user relation
   * 
   * @param uniqueName - The user's unique name
   * @param slug - The product slug
   * @returns Promise<Product | null>
   */
  static async getProductByPaymentLink(uniqueName: string, slug: string): Promise<Product | null> {
    try {
      // Single query: find product where user.uniqueName matches and product.slug matches
      const products = await DatabaseOperations.findMany<Product>('product', {
        slug,
        user: {
          uniqueName
        }
      });

      const product = products[0] || null;

      if (product) {
        this.logger.info('getProductByPaymentLink', { 
          uniqueName,
          slug,
          productId: product.id
        }, 'Product found by payment link');
      } else {
        this.logger.debug('getProductByPaymentLink', { uniqueName, slug }, 'Product not found');
      }

      return product;
    } catch (error: any) {
      this.logger.error('getProductByPaymentLink', { 
        uniqueName,
        slug, 
        error: error.message 
      }, 'Failed to get product by payment link');
      throw new Error(`Failed to get product by payment link: ${error.message}`);
    }
  }

  /**
   * Update product details
   * 
   * @param productId - The product ID
   * @param userId - The user ID (for ownership verification)
   * @param updateData - The data to update
   * @returns Promise<Product>
   */
  static async updateProduct(
    productId: string,
    userId: string,
    updateData: {
      image?: string;
      productName?: string;
      description?: string;
      amount?: string;
      payoutChain?: string;
      payoutToken?: string;
      linkExpiration?: string;
      customDays?: number | null;
      expiresAt?: Date | null;
    }
  ): Promise<Product> {
    try {
      const product = await DatabaseOperations.update<Product>('product', {
        id: productId,
        userId: userId
      }, {
        ...updateData,
        updatedAt: new Date()
      });

      this.logger.info('updateProduct', {
        userId,
        productId,
        updateData
      }, 'Product updated in database');

      return product;
    } catch (error: any) {
      this.logger.error('updateProduct', {
        userId,
        productId,
        error: error.message
      }, 'Failed to update product in database');
      // Re-throw original error to preserve error code
      throw error;
    }
  }
}

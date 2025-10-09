import { createLoggerWithFunction } from '../../logger';
import { ProductRequest, Product } from './product.interface';
import { ImageStorageService } from '../../providers/cloudinary/imageStorage';
import { ProductRepository } from '../../repositories/database/product/productRepository';
import { userService } from '../user/userService';
import { 
  validateProductRequest, 
  generatePaymentLink,
  calculateExpirationDate, 
  generateProductId 
} from './helpers';

/**
 * Product Service
 * 
 * Handles product creation and management operations.
 */
export class ProductService {
  private static logger = createLoggerWithFunction('ProductService', { module: 'service' });

  /**
   * Helper: Get local user ID from Clerk user ID
   * Internal method to translate Clerk ID to database ID
   */
  private static async getLocalUserId(clerkUserId: string): Promise<string> {
    const user = await userService.ensureUserExists(clerkUserId);
    return user.id;
  }

  /**
   * Create a new product
   * 
   * @param clerkUserId - The Clerk user ID creating the product
   * @param productRequest - The product request data
   * @param uploadedFile - Optional uploaded image file
   * @returns Promise<Product> - The created product
   */
  static async createProduct(
    clerkUserId: string,
    productRequest: ProductRequest,
    uploadedFile?: Express.Multer.File
  ): Promise<Product> {
    this.logger.info('createProduct', { clerkUserId, productName: productRequest.productName }, 'Creating product');

    try {
      // Fail fast: Validate request first
      validateProductRequest(productRequest);

      // Get local user ID for database operations (also ensures user exists)
      const localUserId = await this.getLocalUserId(clerkUserId);

      // Run parallel operations for better performance
      const [userUniqueNameResult, imageUrl] = await Promise.all([
        // Get user's unique name (required for payment link)
        userService.getUserUniqueName(clerkUserId),
        // Handle image upload if provided
        uploadedFile 
          ? ImageStorageService.saveImage(uploadedFile, localUserId)
          : Promise.resolve(productRequest.image)
      ]);

      // Fail fast: User must have unique name
      if (!userUniqueNameResult.uniqueName) {
        throw new Error('User must have a unique name to create products');
      }

      // Generate product data
      const paymentLink = generatePaymentLink(userUniqueNameResult.uniqueName, productRequest.slug);
      const expiresAt = calculateExpirationDate(productRequest.linkExpiration, productRequest.customDays);
      const now = new Date().toISOString();

      // Create product object
      const product: Product = {
        id: generateProductId(),
        ...(imageUrl && { image: imageUrl }),
        productName: productRequest.productName,
        description: productRequest.description,
        amount: productRequest.amount,
        payoutChain: productRequest.payoutChain,
        payoutToken: productRequest.payoutToken,
        slug: productRequest.slug,
        paymentLink,
        linkExpiration: productRequest.linkExpiration,
        ...(productRequest.customDays && { customDays: productRequest.customDays }),
        ...(expiresAt && { expiresAt }),
        createdAt: now,
        updatedAt: now,
        status: 'active'
      };

      // Save to database and return product (using local ID for foreign key)
      await ProductRepository.saveProduct(product, localUserId);

      this.logger.info('createProduct', {
        clerkUserId,
        localUserId,
        productId: product.id,
        slug: product.slug,
        paymentLink: product.paymentLink,
        hasImage: !!product.image
      }, 'Product created successfully');

      return product;
    } catch (error: any) {
      this.logger.error('createProduct', { clerkUserId, error: error.message }, 'Failed to create product');
      throw error;
    }
  }

  /**
   * Get all products for a user with optional status filter (basic info only)
   * 
   * @param userId - The user ID
   * @param status - Optional status filter ('active', 'expired', 'cancelled')
   * @returns Promise<Product[]> - Array of products
   */
  static async getUserProducts(
    userId: string, 
    status?: 'active' | 'expired' | 'cancelled'
  ): Promise<Product[]> {
    this.logger.info('getUserProducts', { 
      userId, 
      status: status || 'all'
    }, 'Fetching user products');

    try {
      const products = await ProductRepository.getUserProducts(userId, status);

      this.logger.info('getUserProducts', {
        userId,
        status: status || 'all',
        count: products.length
      }, 'Products retrieved successfully');

      return products;
    } catch (error: any) {
      this.logger.error('getUserProducts', { 
        userId, 
        status,
        error: error.message 
      }, 'Failed to get user products');
      throw error;
    }
  }

  /**
   * Get payment intent counts for a specific product
   * 
   * @param productId - The product ID
   * @returns Promise with payment intent counts by status
   */
  static async getProductPaymentCounts(productId: string): Promise<{
    created: number;
    succeeded: number;
    failed: number;
    cancelled: number;
    processing: number;
    requiresAction: number;
  }> {
    this.logger.info('getProductPaymentCounts', { productId }, 'Fetching product payment counts');

    try {
      const counts = await ProductRepository.getProductPaymentIntentCounts(productId);

      this.logger.info('getProductPaymentCounts', {
        productId,
        ...counts
      }, 'Product payment counts retrieved successfully');

      return counts;
    } catch (error: any) {
      this.logger.error('getProductPaymentCounts', { 
        productId,
        error: error.message 
      }, 'Failed to get product payment counts');
      throw error;
    }
  }

  /**
   * Get payment intent amounts for a specific product
   * 
   * @param productId - The product ID
   * @returns Promise with payment intent amounts by status (in dollars)
   */
  static async getProductPaymentAmounts(productId: string): Promise<{
    amountCreated: number;
    amountSucceeded: number;
    amountFailed: number;
    amountCancelled: number;
    amountProcessing: number;
    amountRequiresAction: number;
  }> {
    this.logger.info('getProductPaymentAmounts', { productId }, 'Fetching product payment amounts');

    try {
      const amounts = await ProductRepository.getProductPaymentIntentAmounts(productId);

      this.logger.info('getProductPaymentAmounts', {
        productId,
        ...amounts
      }, 'Product payment amounts retrieved successfully');

      return amounts;
    } catch (error: any) {
      this.logger.error('getProductPaymentAmounts', { 
        productId,
        error: error.message 
      }, 'Failed to get product payment amounts');
      throw error;
    }
  }

  /**
   * Get product statistics for a user
   * 
   * @param userId - The user ID
   * @returns Promise<{ total: number; active: number; expired: number; cancelled: number }>
   */
  static async getUserProductStats(userId: string): Promise<{
    total: number;
    active: number;
    expired: number;
    cancelled: number;
  }> {
    this.logger.info('getUserProductStats', { userId }, 'Fetching user product statistics');

    try {
      // Run parallel queries for efficiency
      const [allProducts, activeProducts, expiredProducts, cancelledProducts] = await Promise.all([
        ProductRepository.getUserProducts(userId),
        ProductRepository.getUserProducts(userId, 'active'),
        ProductRepository.getUserProducts(userId, 'expired'),
        ProductRepository.getUserProducts(userId, 'cancelled')
      ]);

      const stats = {
        total: allProducts.length,
        active: activeProducts.length,
        expired: expiredProducts.length,
        cancelled: cancelledProducts.length
      };

      this.logger.info('getUserProductStats', {
        userId,
        ...stats
      }, 'Product statistics retrieved successfully');

      return stats;
    } catch (error: any) {
      this.logger.error('getUserProductStats', { 
        userId,
        error: error.message 
      }, 'Failed to get user product statistics');
      throw error;
    }
  }


  /**
   * Update product details
   * 
   * @param userId - The user ID
   * @param productId - The product ID
   * @param updateData - The data to update
   * @param uploadedFile - Optional new image file
   * @returns Promise<{ success: boolean; product?: Product; error?: string }>
   */
  static async updateProduct(
    userId: string,
    productId: string,
    updateData: {
      productName?: string;
      description?: string;
      amount?: string;
      payoutChain?: string;
      payoutToken?: string;
      linkExpiration?: string;
      customDays?: number;
      status?: 'active' | 'expired' | 'cancelled';
    },
    uploadedFile?: Express.Multer.File
  ): Promise<{ success: boolean; product?: Product; error?: string }> {
    this.logger.info('updateProduct', { userId, productId }, 'Updating product');

    try {
      // Verify product exists and belongs to user
      const existingProduct = await ProductRepository.getProductById(productId, userId);
      
      if (!existingProduct) {
        this.logger.warn('updateProduct', { userId, productId }, 'Product not found or access denied');
        return { success: false, error: 'Product not found or access denied' };
      }

      // Cannot update if already cancelled (unless re-activating)
      if (existingProduct.status === 'cancelled' && updateData.status !== 'active') {
        this.logger.warn('updateProduct', { userId, productId }, 'Cannot update cancelled product unless reactivating');
        return { success: false, error: 'Cannot update a cancelled product. You can only reactivate it by setting status to "active"' };
      }

      // Handle image upload if provided
      let imageUrl = existingProduct.image;
      if (uploadedFile) {
        imageUrl = await ImageStorageService.saveImage(uploadedFile, userId);
      }

      // Prepare update data
      const dataToUpdate: any = {
        ...(updateData.productName && { productName: updateData.productName }),
        ...(updateData.description && { description: updateData.description }),
        ...(updateData.amount && { amount: updateData.amount }),
        ...(updateData.payoutChain && { payoutChain: updateData.payoutChain }),
        ...(updateData.payoutToken && { payoutToken: updateData.payoutToken }),
        ...(updateData.status && { status: updateData.status }),
        ...(imageUrl && { image: imageUrl })
      };

      // Handle link expiration updates
      if (updateData.linkExpiration) {
        dataToUpdate.linkExpiration = updateData.linkExpiration;
        
        if (updateData.linkExpiration === 'custom_days' && updateData.customDays) {
          dataToUpdate.customDays = updateData.customDays;
          const expiresAt = calculateExpirationDate(updateData.linkExpiration as any, updateData.customDays);
          dataToUpdate.expiresAt = expiresAt ? new Date(expiresAt) : null;
        } else if (updateData.linkExpiration === 'never') {
          dataToUpdate.customDays = null;
          dataToUpdate.expiresAt = null;
        }
      }

      // Update product in database
      const updatedProduct = await ProductRepository.updateProduct(productId, userId, dataToUpdate);

      this.logger.info('updateProduct', {
        userId,
        productId,
        updatedFields: Object.keys(dataToUpdate)
      }, 'Product updated successfully');

      return { success: true, product: updatedProduct };
    } catch (error: any) {
      this.logger.error('updateProduct', { 
        userId,
        productId,
        error: error.message 
      }, 'Failed to update product');
      throw error;
    }
  }

  /**
   * Get product by payment link (public access)
   * Sanitizes response to exclude sensitive creator data
   * 
   * @param uniqueName - The user's unique name
   * @param slug - The product slug
   * @returns Promise with product data or error message
   */
  static async getProductByPaymentLink(
    uniqueName: string, 
    slug: string
  ): Promise<{ product?: Partial<Product>; error?: string; errorType?: 'not_found' | 'expired' | 'cancelled' }> {
    this.logger.info('getProductByPaymentLink', { uniqueName, slug }, 'Fetching product by payment link');

    try {
      const product = await ProductRepository.getProductByPaymentLink(uniqueName, slug);

      if (!product) {
        this.logger.warn('getProductByPaymentLink', { uniqueName, slug }, 'Product not found');
        return { error: 'Product not found', errorType: 'not_found' };
      }

      // Check if product is cancelled
      if (product.status === 'cancelled') {
        this.logger.warn('getProductByPaymentLink', { 
          uniqueName, 
          slug, 
          productId: product.id,
          status: product.status 
        }, 'Product is cancelled');
        return { 
          error: 'This product has been cancelled by the creator and is no longer available', 
          errorType: 'cancelled' 
        };
      }

      // Check if product is expired
      if (product.status === 'expired') {
        this.logger.warn('getProductByPaymentLink', { 
          uniqueName, 
          slug, 
          productId: product.id,
          status: product.status 
        }, 'Product is expired');
        return { 
          error: 'This product link has expired and is no longer available', 
          errorType: 'expired' 
        };
      }

      // Check if product has expired (time-based)
      if (product.expiresAt) {
        const now = new Date();
        const expirationDate = new Date(product.expiresAt);
        if (now > expirationDate) {
          this.logger.warn('getProductByPaymentLink', { 
            uniqueName, 
            slug, 
            productId: product.id,
            expiresAt: product.expiresAt 
          }, 'Product has expired (time-based)');
          return { 
            error: 'This product link has expired and is no longer available', 
            errorType: 'expired' 
          };
        }
      }

      // Return sanitized product (exclude userId and other sensitive data)
      const publicProduct: Partial<Product> = {
        id: product.id,
        ...(product.image && { image: product.image }),
        productName: product.productName,
        description: product.description,
        amount: product.amount,
        payoutChain: product.payoutChain,
        payoutToken: product.payoutToken,
        slug: product.slug,
        paymentLink: product.paymentLink,
        linkExpiration: product.linkExpiration,
        ...(product.customDays && { customDays: product.customDays }),
        ...(product.expiresAt && { expiresAt: product.expiresAt }),
        status: product.status,
        createdAt: product.createdAt
      };

      this.logger.info('getProductByPaymentLink', {
        uniqueName,
        slug,
        productId: product.id
      }, 'Product retrieved successfully');

      return { product: publicProduct };
    } catch (error: any) {
      this.logger.error('getProductByPaymentLink', { 
        uniqueName,
        slug,
        error: error.message 
      }, 'Failed to get product by payment link');
      throw error;
    }
  }
}

import { Response } from 'express';
import { createLoggerWithFunction } from '../../logger';
import { ApiSuccess } from '../../utils/apiSuccess';
import { ApiError } from '../../utils/apiError';
import { handleDistributedError } from '../../utils/errorHandler';
import { ProductService } from '../../services/product/productService';
import { ProductRepository } from '../../repositories/database/product/productRepository';
import { ProductRequest, LinkExpiration } from '../../services/product/product.interface';

/**
 * Product Controller
 * 
 * Handles all product-related HTTP requests.
 */
const logger = createLoggerWithFunction('ProductController', { module: 'controller' });

export class ProductController {

  /**
   * Create a new product
   * POST /api/v1/protected/payment/intent
   */
  static async createProduct(req: any, res: Response): Promise<void> {
    try {
      const clerkUserId = req.authUserId!; // Clerk user ID (single source of truth)
      const productRequest: ProductRequest = req.body;
      const uploadedFile = req.file; // From multer middleware

      logger.info('createProduct', { 
        clerkUserId,
        productName: productRequest.productName,
        amount: productRequest.amount,
        payoutChain: productRequest.payoutChain,
        payoutToken: productRequest.payoutToken,
        hasFile: !!uploadedFile
      }, 'Processing create product request');

      // Validate required fields
      if (!productRequest.productName || !productRequest.description || !productRequest.amount || !productRequest.payoutChain || !productRequest.payoutToken || !productRequest.slug) {
        ApiError.validation(res, 'Product name, description, amount, payout chain, payout token, and slug are required');
        return;
      }

      // Validate link expiration
      if (!productRequest.linkExpiration) {
        ApiError.validation(res, 'Link expiration is required');
        return;
      }

      // Validate custom days if link expiration is custom_days
      if (productRequest.linkExpiration === LinkExpiration.CUSTOM_DAYS && !productRequest.customDays) {
        ApiError.validation(res, 'Custom days is required when link expiration is custom_days');
        return;
      }

      // Create product using ProductService
      const product = await ProductService.createProduct(clerkUserId, productRequest, uploadedFile);

      logger.info('createProduct', {
        clerkUserId,
        productId: product.id,
        slug: product.slug,
        paymentLink: product.paymentLink,
        hasImage: !!product.image
      }, 'Product created successfully');

      // Return success response
      ApiSuccess.success(res, 'Product created successfully', {
        product: {
          id: product.id,
          image: product.image,
          productName: product.productName,
          description: product.description,
          amount: product.amount,
          payoutChain: product.payoutChain,
          payoutToken: product.payoutToken,
          slug: product.slug,
          paymentLink: product.paymentLink,
          linkExpiration: product.linkExpiration,
          customDays: product.customDays,
          expiresAt: product.expiresAt,
          status: product.status,
          createdAt: product.createdAt
        }
      });

    } catch (error: any) {
      logger.error('createProduct', {
        clerkUserId: req.authUserId,
        error: error.message,
        errorCode: error.code
      }, 'Failed to create product');

      // Distributed error handling - explicit but DRY
      return handleDistributedError(res, error);
    }
  }

  /**
   * Get all products for authenticated user (basic info only)
   * GET /api/v1/protected/product
   */
  static async getUserProducts(req: any, res: Response): Promise<Response | void> {
    try {
      const userId = req.localUserId!; // Guaranteed by requireAuthWithUserId middleware
      const { status } = req.query;

      logger.info('getUserProducts', { 
        userId, 
        status: status || 'all'
      }, 'Processing get user products request');

      // Validate status if provided
      if (status && !['active', 'expired', 'cancelled'].includes(status)) {
        return ApiError.validation(res, 'Invalid status. Must be "active", "expired", or "cancelled"');
      }

      // Fetch products (fast - no stats)
      const products = await ProductService.getUserProducts(
        userId, 
        status as 'active' | 'expired' | 'cancelled' | undefined
      );

      logger.info('getUserProducts', {
        userId,
        count: products.length,
        status: status || 'all'
      }, 'User products retrieved successfully');

      // Return success response
      return ApiSuccess.success(res, 'Products retrieved successfully', {
        products,
        count: products.length
      });

    } catch (error: any) {
      logger.error('getUserProducts', {
        userId: req.localUserId, clerkUserId: req.authUserId,
        error: error.message
      }, 'Failed to get user products');

      return handleDistributedError(res, error);
    }
  }

  /**
   * Get payment intent counts for a specific product
   * GET /api/v1/protected/product/:productId/payment-counts
   */
  static async getProductPaymentCounts(req: any, res: Response): Promise<Response | void> {
    try {
      const userId = req.localUserId!;
      const { productId } = req.params;

      if (!productId) {
        return ApiError.validation(res, 'Product ID is required');
      }

      logger.info('getProductPaymentCounts', { userId, productId }, 'Processing get product payment counts request');

      // Verify product ownership
      const product = await ProductRepository.getProductById(productId, userId);
      if (!product) {
        return ApiError.notFound(res, 'Product not found or access denied');
      }

      // Fetch payment counts
      const counts = await ProductService.getProductPaymentCounts(productId);

      logger.info('getProductPaymentCounts', {
        userId,
        productId,
        ...counts
      }, 'Product payment counts retrieved successfully');

      return ApiSuccess.success(res, 'Payment counts retrieved successfully', counts);

    } catch (error: any) {
      logger.error('getProductPaymentCounts', {
        userId: req.localUserId, clerkUserId: req.authUserId,
        productId: req.params.productId,
        error: error.message
      }, 'Failed to get product payment counts');

      return handleDistributedError(res, error);
    }
  }

  /**
   * Get payment intent amounts for a specific product
   * GET /api/v1/protected/product/:productId/payment-amounts
   */
  static async getProductPaymentAmounts(req: any, res: Response): Promise<Response | void> {
    try {
      const userId = req.localUserId!;
      const { productId } = req.params;

      if (!productId) {
        return ApiError.validation(res, 'Product ID is required');
      }

      logger.info('getProductPaymentAmounts', { userId, productId }, 'Processing get product payment amounts request');

      // Verify product ownership
      const product = await ProductRepository.getProductById(productId, userId);
      if (!product) {
        return ApiError.notFound(res, 'Product not found or access denied');
      }

      // Fetch payment amounts
      const amounts = await ProductService.getProductPaymentAmounts(productId);

      logger.info('getProductPaymentAmounts', {
        userId,
        productId,
        ...amounts
      }, 'Product payment amounts retrieved successfully');

      return ApiSuccess.success(res, 'Payment amounts retrieved successfully', amounts);

    } catch (error: any) {
      logger.error('getProductPaymentAmounts', {
        userId: req.localUserId, clerkUserId: req.authUserId,
        productId: req.params.productId,
        error: error.message
      }, 'Failed to get product payment amounts');

      return handleDistributedError(res, error);
    }
  }

  /**
   * Get product statistics for authenticated user
   * GET /api/v1/protected/product/stats
   */
  static async getUserProductStats(req: any, res: Response): Promise<Response | void> {
    try {
      const userId = req.localUserId!; // Guaranteed by requireAuthWithUserId middleware

      logger.info('getUserProductStats', { userId }, 'Processing get user product stats request');

      // Fetch product statistics
      const stats = await ProductService.getUserProductStats(userId);

      logger.info('getUserProductStats', {
        userId,
        ...stats
      }, 'User product statistics retrieved successfully');

      // Return success response
      return ApiSuccess.success(res, 'Product statistics retrieved successfully', stats);

    } catch (error: any) {
      logger.error('getUserProductStats', {
        userId: req.localUserId, clerkUserId: req.authUserId,
        error: error.message
      }, 'Failed to get user product statistics');

      return handleDistributedError(res, error);
    }
  }

  /**
   * Update a product
   * PUT /api/v1/protected/product/:productId
   */
  static async updateProduct(req: any, res: Response): Promise<Response | void> {
    try {
      const userId = req.localUserId!;
      const { productId } = req.params;
      const updateData = req.body;
      const uploadedFile = req.file;

      if (!productId) {
        return ApiError.validation(res, 'Product ID is required');
      }

      logger.info('updateProduct', { 
        userId, 
        productId,
        hasFile: !!uploadedFile,
        updateFields: Object.keys(updateData)
      }, 'Processing update product request');

      // Validate status if provided
      if (updateData.status && !['active', 'expired', 'cancelled'].includes(updateData.status)) {
        return ApiError.validation(res, 'Invalid status. Must be "active", "expired", or "cancelled"');
      }

      // Validate link expiration if provided
      if (updateData.linkExpiration && updateData.linkExpiration !== 'never' && updateData.linkExpiration !== 'custom_days') {
        return ApiError.validation(res, 'Invalid link expiration. Must be "never" or "custom_days"');
      }

      // Validate custom days if link expiration is custom_days
      if (updateData.linkExpiration === 'custom_days' && !updateData.customDays) {
        return ApiError.validation(res, 'Custom days is required when link expiration is custom_days');
      }

      // Update the product
      const result = await ProductService.updateProduct(userId, productId, updateData, uploadedFile);

      if (!result.success) {
        return ApiError.validation(res, result.error || 'Failed to update product');
      }

      logger.info('updateProduct', {
        userId,
        productId
      }, 'Product updated successfully');

      return ApiSuccess.success(res, 'Product updated successfully', {
        product: result.product
      });

    } catch (error: any) {
      logger.error('updateProduct', {
        userId: req.localUserId, clerkUserId: req.authUserId,
        productId: req.params.productId,
        error: error.message
      }, 'Failed to update product');

      return handleDistributedError(res, error);
    }
  }


  /**
   * Get product by payment link (PUBLIC - No authentication required)
   * GET /api/v1/public/p/:uniqueName/:slug
   */
  static async getProductByPaymentLink(req: any, res: Response): Promise<Response | void> {
    try {
      const { uniqueName, slug } = req.params;

      if (!uniqueName || !slug) {
        return ApiError.validation(res, 'Unique name and slug are required');
      }

      logger.info('getProductByPaymentLink', { 
        uniqueName, 
        slug 
      }, 'Processing public product request');

      // Fetch product (public access - no sensitive data)
      const result = await ProductService.getProductByPaymentLink(uniqueName, slug);

      // Handle different error cases with specific messages
      if (result.error) {
        if (result.errorType === 'cancelled') {
          return ApiError.error(res, result.error, 410, 'PRODUCT_CANCELLED'); // 410 Gone
        } else if (result.errorType === 'expired') {
          return ApiError.error(res, result.error, 410, 'PRODUCT_EXPIRED'); // 410 Gone
        } else {
          return ApiError.notFound(res, result.error);
        }
      }

      logger.info('getProductByPaymentLink', {
        uniqueName,
        slug,
        productId: result.product?.id
      }, 'Public product retrieved successfully');

      // Return success response
      return ApiSuccess.success(res, 'Product retrieved successfully', {
        product: result.product
      });

    } catch (error: any) {
      logger.error('getProductByPaymentLink', {
        uniqueName: req.params.uniqueName,
        slug: req.params.slug,
        error: error.message
      }, 'Failed to get product by payment link');

      return handleDistributedError(res, error);
    }
  }
}

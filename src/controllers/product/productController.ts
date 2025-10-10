import { Response } from 'express';
import { createLoggerWithFunction } from '../../logger';
import { ProductService } from '../../services/product/productService';
import { ProductRepository } from '../../repositories/database/product/productRepository';
import { ProductRequest } from '../../services/product/product.interface';
import { Err } from '../../errors';
import { sendSuccess } from '../../utils/successResponse';

/**
 * Product Controller
 * 
 * Handles all product-related HTTP requests.
 * Controllers are thin - delegate to services and let errors bubble up.
 * No try/catch needed - asyncHandler wraps all methods.
 */
const logger = createLoggerWithFunction('ProductController', { module: 'controller' });

export class ProductController {

  /**
   * Create a new product
   * POST /api/v1/protected/product
   */
  static async createProduct(req: any, res: Response): Promise<void> {
    const clerkUserId = req.authUserId!;
    const productRequest: ProductRequest = req.body;
    const uploadedFile = req.file;

    logger.info('createProduct', { 
      clerkUserId,
      productName: productRequest.productName,
      amount: productRequest.amount,
      payoutChain: productRequest.payoutChain,
      payoutToken: productRequest.payoutToken,
      hasFile: !!uploadedFile
    }, 'Processing create product request');

    const product = await ProductService.createProduct(clerkUserId, productRequest, uploadedFile);

    logger.info('createProduct', {
      clerkUserId,
      productId: product.id,
      slug: product.slug,
      paymentLink: product.paymentLink,
      hasImage: !!product.image
    }, 'Product created successfully');

    sendSuccess(res, 'Product created successfully', {
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
    }, 201);
  }

  /**
   * Get all products for authenticated user
   * GET /api/v1/protected/product
   */
  static async getUserProducts(req: any, res: Response): Promise<void> {
    const clerkUserId = req.authUserId!;
    const { status, page = '1', limit = '15' } = req.query;

    // Parse pagination parameters
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 15)); // Max 100 items per page

    logger.info('getUserProducts', { 
      clerkUserId, 
      status: status || 'all',
      page: pageNum,
      limit: limitNum
    }, 'Processing get user products request');

    const result = await ProductService.getUserProducts(
      clerkUserId, 
      status as 'active' | 'expired' | 'cancelled' | undefined,
      pageNum,
      limitNum
    );

    const totalPages = Math.ceil(result.total / limitNum);

    logger.info('getUserProducts', {
      clerkUserId,
      count: result.products.length,
      total: result.total,
      page: pageNum,
      limit: limitNum,
      status: status || 'all'
    }, 'User products retrieved successfully');

    const { sendPaginatedSuccess } = require('../../utils/successResponse');
    sendPaginatedSuccess(res, 'Products retrieved successfully', result.products, {
      page: pageNum,
      limit: limitNum,
      total: result.total,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1
    });
  }

  /**
   * Update a product
   * PUT /api/v1/protected/product/:productId
   */
  static async updateProduct(req: any, res: Response): Promise<void> {
    const clerkUserId = req.authUserId!;
    const { productId } = req.params;
    const productRequest: ProductRequest = req.body;
    const uploadedFile = req.file;

    logger.info('updateProduct', { 
      clerkUserId, 
      productId 
    }, 'Processing update product request');

    const result = await ProductService.updateProduct(
      clerkUserId, 
      productId, 
      productRequest, 
      uploadedFile
    );

    if (!result.success || !result.product) {
      throw Err.internal(result.error || 'Failed to update product');
    }

    logger.info('updateProduct', {
      clerkUserId,
      productId,
      hasImage: !!result.product.image
    }, 'Product updated successfully');

    sendSuccess(res, 'Product updated successfully', {
      product: result.product
    });
  }

  /**
   * Get payment intent counts for a specific product
   * GET /api/v1/protected/product/:productId/payment-counts
   */
  static async getProductPaymentCounts(req: any, res: Response): Promise<void> {
    const clerkUserId = req.authUserId!;
    const { productId } = req.params;

    logger.info('getProductPaymentCounts', { clerkUserId, productId }, 'Processing get product payment counts request');

    // Verify product ownership
    const product = await ProductRepository.getProductById(productId, clerkUserId);
    if (!product) {
      throw Err.notFound('Product not found or access denied');
    }

    const counts = await ProductService.getProductPaymentCounts(productId);

    logger.info('getProductPaymentCounts', {
      clerkUserId,
      productId,
      ...counts
    }, 'Product payment counts retrieved successfully');

    sendSuccess(res, 'Payment counts retrieved successfully', counts);
  }

  /**
   * Get payment intent amounts for a specific product
   * GET /api/v1/protected/product/:productId/payment-amounts
   */
  static async getProductPaymentAmounts(req: any, res: Response): Promise<void> {
    const clerkUserId = req.authUserId!;
    const { productId } = req.params;

    logger.info('getProductPaymentAmounts', { clerkUserId, productId }, 'Processing get product payment amounts request');

    // Verify product ownership
    const product = await ProductRepository.getProductById(productId, clerkUserId);
    if (!product) {
      throw Err.notFound('Product not found or access denied');
    }

    const amounts = await ProductService.getProductPaymentAmounts(productId);

    logger.info('getProductPaymentAmounts', {
      clerkUserId,
      productId,
      ...amounts
    }, 'Product payment amounts retrieved successfully');

    sendSuccess(res, 'Payment amounts retrieved successfully', amounts);
  }

  /**
   * Get product statistics for authenticated user
   * GET /api/v1/protected/product/stats
   */
  static async getUserProductStats(req: any, res: Response): Promise<void> {
    const clerkUserId = req.authUserId!;

    logger.info('getUserProductStats', { clerkUserId }, 'Processing get user product stats request');

    const stats = await ProductService.getUserProductStats(clerkUserId);

    logger.info('getUserProductStats', {
      clerkUserId,
      totalProducts: stats.total,
      activeProducts: stats.active
    }, 'User product stats retrieved successfully');

    sendSuccess(res, 'Product statistics retrieved successfully', stats);
  }

  /**
   * Get product by payment link (public endpoint)
   * GET /api/v1/public/p/:uniqueName/:slug
   */
  static async getProductByPaymentLink(req: any, res: Response): Promise<void> {
    const { uniqueName, slug } = req.params;

    logger.info('getProductByPaymentLink', { uniqueName, slug }, 'Processing get product by payment link request');

    const result = await ProductService.getProductByPaymentLink(uniqueName, slug);

    if (result.error || !result.product) {
      if (result.errorType === 'not_found') {
        throw Err.notFound(result.error || 'Product not found');
      } else if (result.errorType === 'expired') {
        throw Err.badRequest(result.error || 'Product expired');
      } else if (result.errorType === 'cancelled') {
        throw Err.badRequest(result.error || 'Product cancelled');
      }
      throw Err.internal('Failed to retrieve product');
    }

    logger.info('getProductByPaymentLink', {
      uniqueName,
      slug,
      productId: result.product.id,
      productName: result.product.productName
    }, 'Product retrieved successfully');

    sendSuccess(res, 'Product retrieved successfully', {
      product: result.product
    });
  }
}


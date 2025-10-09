import { Response } from 'express';
import { createLoggerWithFunction } from '../../logger';
import { ProductService } from '../../services/product/productService';
import { ProductRepository } from '../../repositories/database/product/productRepository';
import { ProductRequest } from '../../services/product/product.interface';
import { Err } from '../../errors';

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

    res.status(201).json({
      ok: true,
      data: {
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
      }
    });
  }

  /**
   * Get all products for authenticated user
   * GET /api/v1/protected/product
   */
  static async getUserProducts(req: any, res: Response): Promise<void> {
    const clerkUserId = req.authUserId!;
    const { status } = req.query;

    logger.info('getUserProducts', { 
      clerkUserId, 
      status: status || 'all'
    }, 'Processing get user products request');

    const products = await ProductService.getUserProducts(
      clerkUserId, 
      status as 'active' | 'expired' | 'cancelled' | undefined
    );

    logger.info('getUserProducts', {
      clerkUserId,
      count: products.length,
      status: status || 'all'
    }, 'User products retrieved successfully');

    res.json({
      ok: true,
      data: {
        products,
        count: products.length
      }
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

    const product = await ProductService.updateProduct(
      clerkUserId, 
      productId, 
      productRequest, 
      uploadedFile
    );

    logger.info('updateProduct', {
      clerkUserId,
      productId,
      hasImage: !!product.image
    }, 'Product updated successfully');

    res.json({
      ok: true,
      data: { product }
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

    res.json({
      ok: true,
      data: counts
    });
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

    res.json({
      ok: true,
      data: amounts
    });
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
      totalProducts: stats.totalProducts,
      activeProducts: stats.activeProducts
    }, 'User product stats retrieved successfully');

    res.json({
      ok: true,
      data: stats
    });
  }
}


import { Request, Response } from 'express';
import { createLoggerWithFunction } from '../../logger';
import { ApiError, ApiSuccess } from '../../utils';
import { PaymentIntentService } from '../../services/payment/paymentIntentService';

/**
 * Payment Intent Controller
 * 
 * Handles HTTP requests for payment intent operations
 */
const logger = createLoggerWithFunction('PaymentIntentController', { module: 'controller' });

export class PaymentIntentController {

  /**
   * Create payment intent from payment link
   * 
   * @param req - Express request object
   * @param res - Express response object
   */
  static async createPaymentIntent(req: Request, res: Response): Promise<void> {
    logger.info('createPaymentIntent', { body: req.body }, 'Creating payment intent from link');

    try {
      const { paymentLink } = req.body;

      // Validate payment link is provided
      if (!paymentLink) {
        res.status(400).json(
          ApiError.validation(res, 'Payment link is required')
        );
        return;
      }

      // Validate payment link format
      if (typeof paymentLink !== 'string' || !paymentLink.trim()) {
        res.status(400).json(
          ApiError.validation(res, 'Payment link must be a valid string')
        );
        return;
      }

      // Create payment intent from link
      const paymentIntent = await PaymentIntentService.createPaymentIntentFromLink(paymentLink.trim());

      logger.info('createPaymentIntent', {
        productId: paymentIntent.productId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      }, 'Payment intent created successfully');

      // Return success response
      res.status(200).json(
        ApiSuccess.success(
          res,
          'Payment intent created successfully',
          {
            clientSecret: paymentIntent.clientSecret,
            productId: paymentIntent.productId,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency
          }
        )
      );
    } catch (error: any) {
      logger.error('createPaymentIntent', { 
        body: req.body, 
        error: error.message 
      }, 'Failed to create payment intent');

      // Handle specific error types
      if (error.message.includes('Invalid payment link format')) {
        res.status(400).json(
          ApiError.validation(res, 'Invalid payment link format. Expected: {baseUrl}/{userUniqueName}/{slug}')
        );
        return;
      }

      if (error.message.includes('Product not found')) {
        res.status(404).json(
          ApiError.notFound(res, 'Product not found')
        );
        return;
      }

      if (error.message.includes('Product is not active')) {
        res.status(400).json(
          ApiError.validation(res, 'Product is not active')
        );
        return;
      }

      if (error.message.includes('Product has expired')) {
        res.status(400).json(
          ApiError.validation(res, 'Product has expired')
        );
        return;
      }

      // Handle Stripe errors
      if (error.type === 'StripeCardError') {
        res.status(400).json(
          ApiError.validation(res, 'Your card was declined')
        );
        return;
      }

      if (error.type === 'StripeInvalidRequestError') {
        res.status(400).json(
          ApiError.validation(res, 'Invalid payment request')
        );
        return;
      }

      // Generic error response
      res.status(500).json(
        ApiError.server(res, 'Failed to create payment intent')
      );
    }
  }
}

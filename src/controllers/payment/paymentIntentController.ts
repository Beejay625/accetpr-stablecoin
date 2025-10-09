import { Request, Response } from 'express';
import { createLoggerWithFunction } from '../../logger';
import { PaymentIntentService } from '../../services/payment/paymentIntentService';
import { sendSuccess } from '../../utils/successResponse';

/**
 * Payment Intent Controller
 * 
 * Handles HTTP requests for payment intent operations
 */
const logger = createLoggerWithFunction('PaymentIntentController', { module: 'controller' });

export class PaymentIntentController {

  /**
   * Create or retrieve payment intent from payment link
   * POST /api/v1/public/payment/intent
   */
  static async createPaymentIntent(req: Request, res: Response): Promise<void> {
    const { paymentLink, clientSecret } = req.body;

    logger.info('createPaymentIntent', { 
      paymentLink, 
      hasExistingSecret: !!clientSecret 
    }, clientSecret ? 'Retrieving existing payment intent' : 'Creating new payment intent');

    // Create or retrieve payment intent from link (validation happens in service)
    const paymentIntent = await PaymentIntentService.createOrRetrievePaymentIntent(
      paymentLink.trim(),
      clientSecret?.trim()
    );

    const message = paymentIntent.isExisting 
      ? 'Payment intent retrieved successfully' 
      : 'Payment intent created successfully';

    logger.info('createPaymentIntent', {
      productId: paymentIntent.productId,
      amount: paymentIntent.amount,
      isExisting: paymentIntent.isExisting
    }, message);

    // Return success response
    sendSuccess(res, message, {
      paymentIntentId: paymentIntent.paymentIntentId,
      clientSecret: paymentIntent.clientSecret,
      productId: paymentIntent.productId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      paymentLink: paymentIntent.paymentLink
    });
  }
}

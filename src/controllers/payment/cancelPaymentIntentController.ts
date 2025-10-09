import { Request, Response } from 'express';
import { PaymentIntentService } from '../../services/payment/paymentIntentService';
import { sendSuccess } from '../../utils/successResponse';

/**
 * Cancel Payment Intent Controller
 * 
 * Handles canceling a payment intent using client secret
 */

/**
 * Cancel a payment intent
 * 
 * @param req - Express request
 * @param res - Express response
 */
export async function cancelPaymentIntent(req: Request, res: Response): Promise<void> {
  const { clientSecret, cancellationReason } = req.body;

  const result = await PaymentIntentService.cancelPaymentIntentByClientSecret(
    clientSecret,
    cancellationReason
  );

  sendSuccess(res, result.message, {
    paymentIntentId: result.paymentIntentId,
    clientSecret: result.clientSecret,
    productId: result.productId,
    amount: result.amount,
    currency: result.currency,
    status: result.status,
    paymentLink: result.paymentLink
  });
}


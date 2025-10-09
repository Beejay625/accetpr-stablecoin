import { Request, Response } from 'express';
import { PaymentIntentService } from '../../services/payment/paymentIntentService';
import { sendSuccess } from '../../utils/successResponse';

/**
 * Verify Microdeposits Controller
 * 
 * Handles verifying microdeposits for a payment intent using client secret
 */

/**
 * Verify microdeposits for a payment intent
 * 
 * @param req - Express request
 * @param res - Express response
 */
export async function verifyMicrodeposits(req: Request, res: Response): Promise<void> {
  const { clientSecret, amounts } = req.body;

  const result = await PaymentIntentService.verifyMicrodepositsByClientSecret(
    clientSecret,
    amounts
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


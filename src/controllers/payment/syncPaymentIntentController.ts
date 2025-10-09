import { Request, Response } from 'express';
import { SyncPaymentIntentService } from '../../services/payment/syncPaymentIntentService';
import { sendSuccess } from '../../utils/successResponse';

/**
 * Sync Payment Intent Controller
 * 
 * Handles retrieving payment intent from Stripe and syncing with database
 */

/**
 * Retrieve and sync payment intent
 * 
 * @param req - Express request
 * @param res - Express response
 */
export async function syncPaymentIntent(req: Request, res: Response): Promise<void> {
  const { clientSecret } = req.body;

  const result = await SyncPaymentIntentService.retrieveAndSyncByClientSecret(clientSecret);

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


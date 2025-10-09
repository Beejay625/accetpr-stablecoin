import { Request, Response } from 'express';
import Stripe from 'stripe';
import { createLoggerWithFunction } from '../../logger';
import { env } from '../../config/env';
import { WebhookService } from '../../services/payment/webhookService';
import { Err } from '../../errors';

/**
 * Webhook Controller
 * 
 * Handles Stripe webhook events
 */
const logger = createLoggerWithFunction('WebhookController', { module: 'controller' });

export class WebhookController {
  private static stripe: Stripe;

  /**
   * Initialize Stripe for webhook verification
   */
  static initialize(): void {
    const secretKey = env.STRIPE_SECRET_KEY as string;
    
    if (!secretKey || typeof secretKey !== 'string') {
      throw new Error('Stripe secret key not configured');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-09-30.clover',
    });

    logger.info('Webhook controller initialized');
  }

  /**
   * Handle Stripe webhook events
   * POST /api/v1/public/webhook
   */
  static async handleWebhook(req: Request, res: Response): Promise<void> {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      logger.error('handleWebhook', 'Webhook signature missing');
      throw Err.badRequest('Webhook signature missing');
    }

    const webhookSecret = env.STRIPE_WEBHOOK_SECRET as string;

    if (!webhookSecret || typeof webhookSecret !== 'string') {
      throw Err.internal('Stripe webhook secret not configured');
    }

    // Verify webhook signature
    const event = this.stripe.webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret
    );

    logger.info('handleWebhook', {
      eventType: event.type,
      eventId: event.id
    }, 'Webhook event received');

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.created':
        await WebhookService.handlePaymentIntentCreated(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.processing':
        await WebhookService.handlePaymentIntentProcessing(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.requires_action':
        await WebhookService.handlePaymentIntentRequiresAction(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.succeeded':
        await WebhookService.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await WebhookService.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await WebhookService.handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        logger.info('handleWebhook', { eventType: event.type }, 'Unhandled webhook event type');
    }

    // Acknowledge receipt of the event
    res.json({ received: true });
  }
}

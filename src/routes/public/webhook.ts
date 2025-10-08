import { Router } from 'express';
import express from 'express';
import { WebhookController } from '../../controllers/payment/webhookController';

const router = Router();

/**
 * @swagger
 * /api/public/webhook/stripe:
 *   post:
 *     summary: Stripe webhook endpoint
 *     description: Handles Stripe webhook events for payment intent status updates
 *     tags:
 *       - Webhook
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Stripe webhook event payload
 *     responses:
 *       200:
 *         description: Webhook event received and processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Webhook processing failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Webhook Error: Invalid signature"
 */
router.post('/stripe', 
  express.raw({ type: 'application/json' }),
  WebhookController.handleWebhook
);

export { router as webhookRouter };


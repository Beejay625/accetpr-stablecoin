import { Router } from 'express';
import { PaymentIntentController } from '../../controllers/payment/paymentIntentController';

const router = Router();

/**
 * @swagger
 * /api/public/payment/intent:
 *   post:
 *     summary: Create payment intent from payment link
 *     description: Creates a Stripe payment intent from a product payment link. This is a public endpoint that uses the payment link to identify the product.
 *     tags:
 *       - Payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentLink
 *             properties:
 *               paymentLink:
 *                 type: string
 *                 description: The payment link (e.g., https://pay.stablestack.com/johndoe/premium-subscription)
 *                 example: "https://pay.stablestack.com/johndoe/premium-subscription"
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Payment intent created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     clientSecret:
 *                       type: string
 *                       description: Stripe client secret for payment confirmation
 *                       example: "pi_3OjKjqLkdIwHu7ix1K8x2YzQ_secret_abc123def456"
 *                     productId:
 *                       type: string
 *                       description: The product ID
 *                       example: "pr_abc123def"
 *                     amount:
 *                       type: number
 *                       description: Amount in cents
 *                       example: 2999
 *                     currency:
 *                       type: string
 *                       description: Currency code
 *                       example: "USD"
 *       400:
 *         description: Bad request - Invalid payment link format or product issues
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   examples:
 *                     invalid_format:
 *                       value: "Invalid payment link format. Expected: {baseUrl}/{userUniqueName}/{slug}"
 *                     product_inactive:
 *                       value: "Product is not active"
 *                     product_expired:
 *                       value: "Product has expired"
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Product not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to create payment intent"
 */
router.post('/intent', PaymentIntentController.createPaymentIntent);

export { router as paymentIntentRouter };


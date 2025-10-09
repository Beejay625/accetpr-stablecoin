import { Router } from 'express';
import { z } from 'zod';
import { PaymentIntentController } from '../../../controllers/payment/paymentIntentController';
import { cancelPaymentIntent } from '../../../controllers/payment/cancelPaymentIntentController';
import { verifyMicrodeposits } from '../../../controllers/payment/verifyMicrodepositsController';
import { syncPaymentIntent } from '../../../controllers/payment/syncPaymentIntentController';
import { asyncHandler } from '../../../errors';
import { validate } from '../../../middleware/validate';

const router = Router();

/**
 * @swagger
 * /public/payment/intent:
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
router.post('/intent', asyncHandler(PaymentIntentController.createPaymentIntent));

/**
 * Cancel Payment Intent Request Schema
 */
const cancelPaymentIntentSchema = z.object({
  clientSecret: z.string()
    .min(1, 'Client secret is required')
    .regex(/^pi_[a-zA-Z0-9]+_secret_[a-zA-Z0-9]+$/, 'Invalid client secret format'),
  cancellationReason: z.string()
    .optional()
});

/**
 * @swagger
 * /public/payment/intent/cancel:
 *   post:
 *     tags:
 *       - Payment
 *     summary: Cancel a payment intent
 *     description: |
 *       Cancel a payment intent using its client secret.
 *       
 *       **Flow:**
 *       1. Extract payment intent ID from client secret
 *       2. Find payment intent in database
 *       3. Cancel payment intent in Stripe
 *       4. Update status to CANCELLED in database
 *       
 *       **Important:**
 *       - Payment intent must exist in database
 *       - Payment intent must not already be canceled
 *       - Client secret must be valid format: `pi_{id}_secret_{secret}`
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientSecret
 *             properties:
 *               clientSecret:
 *                 type: string
 *                 description: The client secret from Stripe payment intent
 *                 example: "pi_3MtwBwLkdIwHu7ix28a3tqPa_secret_YrKJUKribcBjcG8HVhfZluoGH"
 *               cancellationReason:
 *                 type: string
 *                 description: Optional reason for cancellation
 *                 example: "duplicate"
 *           examples:
 *             cancelWithReason:
 *               summary: Cancel with reason
 *               value:
 *                 clientSecret: "pi_3MtwBwLkdIwHu7ix28a3tqPa_secret_YrKJUKribcBjcG8HVhfZluoGH"
 *                 cancellationReason: "duplicate"
 *             cancelWithoutReason:
 *               summary: Cancel without reason
 *               value:
 *                 clientSecret: "pi_3MtwBwLkdIwHu7ix28a3tqPa_secret_YrKJUKribcBjcG8HVhfZluoGH"
 *     responses:
 *       200:
 *         description: Payment intent canceled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Payment intent canceled successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                 requestId:
 *                   type: string
 *                   example: "c23ed84e-4a7a-4516-a0c0-c6f284c3e010"
 *             examples:
 *               success:
 *                 summary: Successful cancellation
 *                 value:
 *                   ok: true
 *                   message: "Payment intent canceled successfully"
 *                   data:
 *                     success: true
 *                   requestId: "c23ed84e-4a7a-4516-a0c0-c6f284c3e010"
 *               alreadyCanceled:
 *                 summary: Already canceled
 *                 value:
 *                   ok: true
 *                   message: "Payment intent is already canceled"
 *                   data:
 *                     success: true
 *                   requestId: "c23ed84e-4a7a-4516-a0c0-c6f284c3e010"
 *       400:
 *         description: Bad request - Invalid client secret format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "VALIDATION_ERROR"
 *                     message:
 *                       type: string
 *                       example: "Invalid client secret format"
 *                     requestId:
 *                       type: string
 *                       example: "c23ed84e-4a7a-4516-a0c0-c6f284c3e010"
 *       404:
 *         description: Payment intent not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "NOT_FOUND"
 *                     message:
 *                       type: string
 *                       example: "Payment intent not found"
 *                     requestId:
 *                       type: string
 *                       example: "c23ed84e-4a7a-4516-a0c0-c6f284c3e010"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "INTERNAL_ERROR"
 *                     message:
 *                       type: string
 *                       example: "Something went wrong"
 *                     requestId:
 *                       type: string
 *                       example: "c23ed84e-4a7a-4516-a0c0-c6f284c3e010"
 */
router.post(
  '/intent/cancel',
  validate(cancelPaymentIntentSchema),
  asyncHandler(cancelPaymentIntent)
);

/**
 * Verify Microdeposits Request Schema
 */
const verifyMicrodepositsSchema = z.object({
  clientSecret: z.string()
    .min(1, 'Client secret is required')
    .regex(/^pi_[a-zA-Z0-9]+_secret_[a-zA-Z0-9]+$/, 'Invalid client secret format'),
  amounts: z.array(z.number().int().min(0).max(99))
    .length(2, 'Amounts must be an array of exactly 2 numbers')
});

/**
 * @swagger
 * /public/payment/intent/verify-microdeposits:
 *   post:
 *     tags:
 *       - Payment
 *     summary: Verify microdeposits for a payment intent
 *     description: |
 *       Verify microdeposits for a payment intent using its client secret.
 *       
 *       **Flow:**
 *       1. Extract payment intent ID from client secret
 *       2. Find payment intent in database
 *       3. Verify microdeposits in Stripe with provided amounts
 *       4. Update status in database based on verification result
 *       
 *       **Important:**
 *       - Payment intent must exist in database
 *       - Amounts must be exactly 2 numbers between 0-99
 *       - Client secret must be valid format: `pi_{id}_secret_{secret}`
 *       - This is typically used for ACH Direct Debit payments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientSecret
 *               - amounts
 *             properties:
 *               clientSecret:
 *                 type: string
 *                 description: The client secret from Stripe payment intent
 *                 example: "pi_1DtBRR2eZvKYlo2CmCVxxvd7_secret_l80vlOGz9kZQwnzocExJQUsJx"
 *               amounts:
 *                 type: array
 *                 description: Two microdeposit amounts (between 0-99)
 *                 items:
 *                   type: integer
 *                   minimum: 0
 *                   maximum: 99
 *                 minItems: 2
 *                 maxItems: 2
 *                 example: [32, 45]
 *           examples:
 *             verify:
 *               summary: Verify microdeposits
 *               value:
 *                 clientSecret: "pi_1DtBRR2eZvKYlo2CmCVxxvd7_secret_l80vlOGz9kZQwnzocExJQUsJx"
 *                 amounts: [32, 45]
 *     responses:
 *       200:
 *         description: Microdeposits verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Microdeposits verified successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     status:
 *                       type: string
 *                       enum: [succeeded, processing, requires_action, requires_payment_method]
 *                       example: "succeeded"
 *                 requestId:
 *                   type: string
 *                   example: "c23ed84e-4a7a-4516-a0c0-c6f284c3e010"
 *             examples:
 *               success:
 *                 summary: Successful verification
 *                 value:
 *                   ok: true
 *                   message: "Microdeposits verified successfully"
 *                   data:
 *                     success: true
 *                     status: "succeeded"
 *                   requestId: "c23ed84e-4a7a-4516-a0c0-c6f284c3e010"
 *       400:
 *         description: Bad request - Invalid client secret or amounts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "VALIDATION_ERROR"
 *                     message:
 *                       type: string
 *                       example: "Each amount must be a number between 0 and 99"
 *                     requestId:
 *                       type: string
 *                       example: "c23ed84e-4a7a-4516-a0c0-c6f284c3e010"
 *       404:
 *         description: Payment intent not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "NOT_FOUND"
 *                     message:
 *                       type: string
 *                       example: "Payment intent not found"
 *                     requestId:
 *                       type: string
 *                       example: "c23ed84e-4a7a-4516-a0c0-c6f284c3e010"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "INTERNAL_ERROR"
 *                     message:
 *                       type: string
 *                       example: "Stripe microdeposits verification failed"
 *                     requestId:
 *                       type: string
 *                       example: "c23ed84e-4a7a-4516-a0c0-c6f284c3e010"
 */
router.post(
  '/intent/verify-microdeposits',
  validate(verifyMicrodepositsSchema),
  asyncHandler(verifyMicrodeposits)
);

/**
 * Sync Payment Intent Request Schema
 */
const syncPaymentIntentSchema = z.object({
  clientSecret: z.string()
    .min(1, 'Client secret is required')
    .regex(/^pi_[a-zA-Z0-9]+_secret_[a-zA-Z0-9]+$/, 'Invalid client secret format')
});

/**
 * @swagger
 * /public/payment/intent/sync:
 *   post:
 *     tags:
 *       - Payment
 *     summary: Retrieve and sync payment intent from Stripe
 *     description: |
 *       Retrieves the latest payment intent status from Stripe and syncs it with the database.
 *       
 *       **Use Cases:**
 *       - Webhook was missed or failed
 *       - Status verification before proceeding
 *       - Manual status refresh
 *       - Recovery from network issues
 *       
 *       **Flow:**
 *       1. Extract payment intent ID from client secret
 *       2. Find payment intent in database
 *       3. Retrieve latest status from Stripe
 *       4. Compare Stripe status with database status
 *       5. If different, update database with Stripe status
 *       6. Return sync result
 *       
 *       **Status Mapping:**
 *       - Stripe `requires_payment_method` → Database `INITIATED`
 *       - Stripe `requires_action` → Database `REQUIRES_ACTION`
 *       - Stripe `processing` → Database `PROCESSING`
 *       - Stripe `succeeded` → Database `SUCCEEDED`
 *       - Stripe `canceled` → Database `CANCELLED`
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientSecret
 *             properties:
 *               clientSecret:
 *                 type: string
 *                 description: The client secret from Stripe payment intent
 *                 example: "pi_3MtwBwLkdIwHu7ix28a3tqPa_secret_YrKJUKribcBjcG8HVhfZluoGH"
 *           examples:
 *             sync:
 *               summary: Sync payment intent
 *               value:
 *                 clientSecret: "pi_3MtwBwLkdIwHu7ix28a3tqPa_secret_YrKJUKribcBjcG8HVhfZluoGH"
 *     responses:
 *       200:
 *         description: Payment intent synced or already in sync
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Payment intent status synced successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     synced:
 *                       type: boolean
 *                       description: Whether status was synced (true) or already in sync (false)
 *                       example: true
 *                     previousStatus:
 *                       type: string
 *                       example: "INITIATED"
 *                     currentStatus:
 *                       type: string
 *                       example: "SUCCEEDED"
 *                 requestId:
 *                   type: string
 *                   example: "c23ed84e-4a7a-4516-a0c0-c6f284c3e010"
 *             examples:
 *               synced:
 *                 summary: Status was updated
 *                 value:
 *                   ok: true
 *                   message: "Payment intent status synced successfully"
 *                   data:
 *                     synced: true
 *                     previousStatus: "INITIATED"
 *                     currentStatus: "SUCCEEDED"
 *                   requestId: "c23ed84e-4a7a-4516-a0c0-c6f284c3e010"
 *               alreadyInSync:
 *                 summary: Already in sync
 *                 value:
 *                   ok: true
 *                   message: "Payment intent already in sync"
 *                   data:
 *                     synced: false
 *                     previousStatus: "SUCCEEDED"
 *                     currentStatus: "SUCCEEDED"
 *                   requestId: "c23ed84e-4a7a-4516-a0c0-c6f284c3e010"
 *       400:
 *         description: Bad request - Invalid client secret format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "VALIDATION_ERROR"
 *                     message:
 *                       type: string
 *                       example: "Invalid client secret format"
 *                     requestId:
 *                       type: string
 *                       example: "c23ed84e-4a7a-4516-a0c0-c6f284c3e010"
 *       404:
 *         description: Payment intent not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "NOT_FOUND"
 *                     message:
 *                       type: string
 *                       example: "Payment intent not found in database"
 *                     requestId:
 *                       type: string
 *                       example: "c23ed84e-4a7a-4516-a0c0-c6f284c3e010"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "INTERNAL_ERROR"
 *                     message:
 *                       type: string
 *                       example: "Failed to retrieve payment intent from Stripe"
 *                     requestId:
 *                       type: string
 *                       example: "c23ed84e-4a7a-4516-a0c0-c6f284c3e010"
 */
router.post(
  '/intent/sync',
  validate(syncPaymentIntentSchema),
  asyncHandler(syncPaymentIntent)
);

export { router as paymentIntentRouter };


import { Router } from 'express';
import { EarningsController } from '../../../controllers/payment/earningsController';
import { asyncHandler } from '../../../errors';

const router = Router();

/**
 * @swagger
 * /protected/payment/earnings:
 *   get:
 *     summary: Get payment intent earnings by status
 *     description: |
 *       Returns total earnings from the authenticated user's payment intents, grouped by status.
 *       Amounts are in dollars (USD) with 2 decimal places.
 *       
 *       Statuses included:
 *       - initiated: Payment intents in initial state
 *       - processing: Payment intents being processed (includes PROCESSING, PENDING, REQUIRES_ACTION, MICRODEPOSITS_VERIFIED)
 *       - succeeded: Successfully completed payments
 *       - failed: Failed payment attempts
 *       - cancelled: Cancelled payment intents
 *       - total: Sum of all payment intents across all statuses
 *     tags:
 *       - Payment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Earnings retrieved successfully
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
 *                   example: "Payment earnings retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     initiated:
 *                       type: object
 *                       properties:
 *                         amount:
 *                           type: string
 *                           description: Total amount in dollars
 *                           example: "299.99"
 *                         count:
 *                           type: number
 *                           description: Number of payment intents
 *                           example: 5
 *                     processing:
 *                       type: object
 *                       properties:
 *                         amount:
 *                           type: string
 *                           example: "50.00"
 *                         count:
 *                           type: number
 *                           example: 2
 *                     succeeded:
 *                       type: object
 *                       properties:
 *                         amount:
 *                           type: string
 *                           example: "1250.00"
 *                         count:
 *                           type: number
 *                           example: 10
 *                     failed:
 *                       type: object
 *                       properties:
 *                         amount:
 *                           type: string
 *                           example: "75.50"
 *                         count:
 *                           type: number
 *                           example: 3
 *                     cancelled:
 *                       type: object
 *                       properties:
 *                         amount:
 *                           type: string
 *                           example: "100.00"
 *                         count:
 *                           type: number
 *                           example: 4
 *                     total:
 *                       type: object
 *                       properties:
 *                         amount:
 *                           type: string
 *                           description: Grand total across all statuses
 *                           example: "1775.49"
 *                         count:
 *                           type: number
 *                           description: Total number of all payment intents
 *                           example: 24
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.get('/earnings', asyncHandler(EarningsController.getEarnings));

export default router;


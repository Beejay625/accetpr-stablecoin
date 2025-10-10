import { Router } from 'express';
import { TransactionsController } from '../../../controllers/payment/transactionsController';
import { asyncHandler } from '../../../errors';

const router = Router();

/**
 * @swagger
 * /protected/payment/transactions:
 *   get:
 *     summary: Get payment intent transactions
 *     description: |
 *       Returns paginated list of payment intents with terminal statuses (succeeded, failed, cancelled) for authenticated user.
 *       Only includes payment intents with final statuses that represent completed transactions.
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: 
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema: 
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of transactions per page
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
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
 *                   example: "Transactions retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "cuid123456789"
 *                             description: "Internal payment intent ID"
 *                           paymentIntentId:
 *                             type: string
 *                             example: "pi_1234567890"
 *                             description: "Stripe payment intent ID"
 *                           productId:
 *                             type: string
 *                             example: "prod_1234567890"
 *                             description: "Product ID associated with this transaction"
 *                           slug:
 *                             type: string
 *                             example: "premium-subscription"
 *                             description: "Product slug"
 *                           amount:
 *                             type: string
 *                             example: "29.99"
 *                             description: "Transaction amount in dollars"
 *                           currency:
 *                             type: string
 *                             example: "USD"
 *                             description: "Transaction currency"
 *                           status:
 *                             type: string
 *                             enum: [SUCCEEDED, FAILED, CANCELLED]
 *                             example: "SUCCEEDED"
 *                             description: "Transaction status"
 *                           customerName:
 *                             type: string
 *                             example: "John Doe"
 *                             description: "Customer billing name"
 *                           customerEmail:
 *                             type: string
 *                             example: "john@example.com"
 *                             description: "Customer billing email"
 *                           paymentMethodTypes:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["card"]
 *                             description: "Payment method types used"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-01-01T00:00:00.000Z"
 *                             description: "Transaction creation timestamp"
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-01-01T00:00:00.000Z"
 *                             description: "Last update timestamp"
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                           description: "Current page number"
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                           description: "Items per page"
 *                         total:
 *                           type: integer
 *                           example: 45
 *                           description: "Total number of transactions"
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 *                           description: "Total number of pages"
 *       400:
 *         description: Bad request - Invalid pagination parameters
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       500:
 *         description: Internal server error
 */
router.get('/transactions', asyncHandler(TransactionsController.getTransactions));

export default router;

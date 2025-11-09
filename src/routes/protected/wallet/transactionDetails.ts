import { Router } from 'express';
import { requireAuthWithUserId } from '../../../middleware/auth';
import { TransactionDetailsController } from '../../../controllers/wallet/transactionDetailsController';
import { DEFAULT_CHAINS } from '../../../types/chains';

const router = Router();

// All transaction detail routes require authentication

/**
 * @swagger
 * /api/v1/protected/wallet/transactions/{chain}/{transactionId}:
 *   get:
 *     summary: Get detailed transaction information
 *     description: Retrieve detailed information about a specific transaction by ID
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chain
 *         required: true
 *         schema:
 *           type: string
 *           enum: [${DEFAULT_CHAINS.join(', ')}]
 *         description: Blockchain chain
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction details retrieved successfully
 *       404:
 *         description: Transaction not found
 *       401:
 *         description: Authentication required
 */
router.get('/transactions/:chain/:transactionId', requireAuthWithUserId, TransactionDetailsController.getTransactionDetails);

/**
 * @swagger
 * /api/v1/protected/wallet/transactions/{chain}/search:
 *   get:
 *     summary: Search transactions
 *     description: Search transactions by hash, reference, address, or transaction ID
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chain
 *         required: true
 *         schema:
 *           type: string
 *           enum: [${DEFAULT_CHAINS.join(', ')}]
 *         description: Blockchain chain
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search completed successfully
 *       400:
 *         description: Invalid search query
 *       401:
 *         description: Authentication required
 */
router.get('/transactions/:chain/search', requireAuthWithUserId, TransactionDetailsController.searchTransactions);

export default router;


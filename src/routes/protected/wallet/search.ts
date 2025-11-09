import { Router } from 'express';
import { requireAuthWithUserId } from '../../../middleware/auth';
import { TransactionSearchController } from '../../../controllers/wallet/transactionSearchController';

const router = Router();

/**
 * @swagger
 * /api/v1/protected/wallet/transactions/search:
 *   get:
 *     summary: Search for a transaction
 *     description: Search for a single transaction by hash, transaction ID, or reference across all chains
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query (hash, transaction ID, or reference)
 *         required: true
 *     responses:
 *       200:
 *         description: Transaction found
 *       404:
 *         description: Transaction not found
 */
router.get('/transactions/search', requireAuthWithUserId, TransactionSearchController.searchTransaction);

/**
 * @swagger
 * /api/v1/protected/wallet/transactions/search/all:
 *   get:
 *     summary: Search for multiple transactions
 *     description: Search for multiple transactions matching a query across all chains
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *         required: true
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of results (1-100)
 *     responses:
 *       200:
 *         description: Transactions found
 */
router.get('/transactions/search/all', requireAuthWithUserId, TransactionSearchController.searchTransactions);

export default router;


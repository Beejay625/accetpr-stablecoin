import { Router } from 'express';
import { requireAuthWithUserId } from '../../../middleware/auth';
import { TransactionsController } from '../../../controllers/wallet/transactionsController';
import { DEFAULT_CHAINS } from '../../../types/chains';

const router = Router();

// All transaction routes require authentication

/**
 * @swagger
 * /api/v1/protected/wallet/transactions/{chain}:
 *   get:
 *     summary: Get wallet transactions for a specific chain
 *     description: Retrieve all transactions for the authenticated user's wallet on the specified blockchain chain
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
 *         description: Blockchain chain to get transactions for
 *         example: "base"
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
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
 *                   example: "Transactions retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           transactionId:
 *                             type: string
 *                             example: "4c2cf0db-3ba3-422d-b973-02eaf1074781"
 *                           hash:
 *                             type: string
 *                             example: "0xa8637dbe4614184f91198f907b5266f0d70453974d7167d44b41955277816754"
 *                           asset:
 *                             type: string
 *                             example: "USDT"
 *                           chain:
 *                             type: string
 *                             example: "BNB smart chain"
 *                           reference:
 *                             type: string
 *                             nullable: true
 *                             example: "aGEomQa4pj"
 *                           amountPaid:
 *                             type: string
 *                             example: "1.0"
 *                           status:
 *                             type: string
 *                             enum: [PENDING, SUCCESS, FAILED, CANCELLED]
 *                             example: "SUCCESS"
 *                           transactionTime:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-10-16T05:24:11.171Z"
 *                     count:
 *                       type: number
 *                       example: 1
 *                     chain:
 *                       type: string
 *                       example: "base"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid request parameters
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
 *                     missing_chain:
 *                       value: "Chain parameter is required"
 *                     invalid_chain:
 *                       value: "Invalid chain: invalid-chain. Supported chains: ${DEFAULT_CHAINS.join(', ')}"
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Wallet not found for the specified chain
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
 *                   example: "Wallet not found for the specified chain. Wallet should be auto-created."
 *       500:
 *         description: Internal server error
 */
router.get('/transactions/:chain', requireAuthWithUserId, TransactionsController.getUserTransactions);

export default router;

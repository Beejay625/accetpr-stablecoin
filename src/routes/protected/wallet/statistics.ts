import { Router } from 'express';
import { requireAuthWithUserId } from '../../../middleware/auth';
import { WalletStatisticsController } from '../../../controllers/wallet/walletStatisticsController';

const router = Router();

// All statistics routes require authentication

/**
 * @swagger
 * /api/v1/protected/wallet/statistics:
 *   get:
 *     summary: Get comprehensive wallet statistics
 *     description: Retrieve aggregated statistics for the authenticated user's wallets across all chains
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet statistics retrieved successfully
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
 *                   example: "Wallet statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalChains:
 *                       type: number
 *                       example: 2
 *                     totalBalance:
 *                       type: object
 *                       additionalProperties:
 *                         type: object
 *                         properties:
 *                           balance:
 *                             type: string
 *                             example: "100.5"
 *                           asset:
 *                             type: string
 *                             example: "USDC"
 *                           chain:
 *                             type: string
 *                             example: "base"
 *                     totalTransactions:
 *                       type: number
 *                       example: 25
 *                     transactionsByChain:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 *                       example:
 *                         base: 15
 *                         arbitrum: 10
 *                     transactionsByStatus:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 *                       example:
 *                         SUCCESS: 20
 *                         PENDING: 3
 *                         FAILED: 2
 *                     recentTransactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                     walletAddresses:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           chain:
 *                             type: string
 *                           address:
 *                             type: string
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.get('/statistics', requireAuthWithUserId, WalletStatisticsController.getStatistics);

export default router;


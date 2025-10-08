import { Router } from 'express';
import { requireAuthWithUserId } from '../../../middleware/auth';
import { WalletController } from '../../../controllers/wallet/getBalance';

const router = Router();

// All wallet routes require authentication
router.use(requireAuthWithUserId);
// Add your wallet endpoints here

/**
 * @swagger
 * /api/v1/protected/wallet/balance:
 *   get:
 *     summary: Get wallet balance
 *     description: Retrieve the balance for the authenticated user's wallet on a specific chain
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: chain
 *         schema:
 *           type: string
 *           enum: [base, arbitrum, ethereum, polygon, optimism, solana, tron]
 *         description: Blockchain chain to get balance for
 *         required: true
 *     responses:
 *       200:
 *         description: Wallet balance retrieved successfully
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
 *                   example: "Wallet balance retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     balance:
 *                       type: string
 *                       description: Wallet balance in the native asset
 *                       example: "1.234567890123456789"
 *                     chain:
 *                       type: string
 *                       example: "base"
 *                     asset:
 *                       type: string
 *                       example: "ETH"
 *                     userId:
 *                       type: string
 *                       example: "user_123456789"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Missing or invalid chain parameter
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
 *                     missing:
 *                       value: "Chain parameter is required"
 *                     invalid:
 *                       value: "Invalid chain. Supported chains: base, arbitrum, ethereum, polygon, optimism, solana, tron"
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
router.get('/balance', WalletController.getBalance);

export default router;

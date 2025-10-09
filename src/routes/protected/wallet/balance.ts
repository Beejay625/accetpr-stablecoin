import { Router } from 'express';
import { WalletController } from '../../../controllers/wallet/getBalance';
import { validate } from '../../../middleware/validate';
import { chainQuerySchema } from './schemas/wallet.schema';

const router = Router();

/**
 * @swagger
 * /protected/wallet/balance:
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
 *           enum: [base, base-sepolia]
 *         description: Blockchain chain to get balance for (base for prod, base-sepolia for dev)
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
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Wallet not found for the specified chain
 *       500:
 *         description: Internal server error
 */
router.get('/balance', 
  validate(chainQuerySchema, 'query'),
  WalletController.getBalance
);

export default router;


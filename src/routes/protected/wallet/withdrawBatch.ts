import { Router } from 'express';
import { WithdrawController } from '../../../controllers/wallet/withdrawController';
import { validate } from '../../../middleware/validate';
import { batchWithdrawSchema } from './schemas/wallet.schema';

const router = Router();

/**
 * @swagger
 * /api/v1/protected/wallet/withdraw/batch:
 *   post:
 *     summary: Execute batch asset withdrawal
 *     description: Execute a batch asset withdrawal for the authenticated user's wallet
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assets
 *             properties:
 *               assets:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - chain
 *                     - asset
 *                     - address
 *                     - amount
 *                   properties:
 *                     chain:
 *                       type: string
 *                       enum: [base-sepolia, base]
 *                       description: |
 *                         Blockchain chain for the asset.
 *                         **Development:** base-sepolia
 *                         **Production:** base
 *                       example: "base-sepolia"
 *                     asset:
 *                       type: string
 *                       description: Asset symbol
 *                       example: "USDC"
 *                     address:
 *                       type: string
 *                       description: Recipient address for the withdraw
 *                       example: "0x451dEFC27B45808078e875556AF06bCFdC697BA4"
 *                     amount:
 *                       type: string
 *                       description: Amount to withdraw
 *                       example: "0.5"
 *                     metadata:
 *                       type: object
 *                       description: Additional metadata
 *                       example: { "id": "0001" }
 *                     reference:
 *                       type: string
 *                       description: Optional reference note for the transaction
 *                       example: "batch withdraw 1"
 *                 description: Array of assets for batch withdrawal
 *                 minItems: 1
 *             example:
 *               assets:
 *                 - chain: "base-sepolia"
 *                   asset: "USDC"
 *                   address: "0x451dEFC27B45808078e875556AF06bCFdC697BA4"
 *                   amount: "0.5"
 *                   metadata: { "id": "0001" }
 *                   reference: "batch withdraw 1"
 *                 - chain: "base-sepolia"
 *                   asset: "USDC"
 *                   address: "0x451dEFC27B45808078e875556AF06bCFdC697BA4"
 *                   amount: "0.3"
 *                   metadata: { "id": "0002" }
 *                   reference: "batch withdraw 2"
 *     responses:
 *       200:
 *         description: Batch withdraw executed successfully
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
 *                   example: "Batch withdraw executed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactionId:
 *                       type: string
 *                       example: "081d6315-159f-4c38-b02a-c4708836c5bd"
 *                     hash:
 *                       type: string
 *                       example: "0xded90bc7f3d98f5ff0c3a97f711717192e83e01d89ac1ff4483ae6fd9d229e6d"
 *                     status:
 *                       type: string
 *                       enum: [PENDING, CONFIRMED, FAILED, CANCELLED]
 *                       example: "PENDING"
 *                     totalAmount:
 *                       type: string
 *                       example: "0.8"
 *                     assetCount:
 *                       type: number
 *                       example: 2
 *                     chains:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["base", "polygon"]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Wallet not found for the specified chain
 *       500:
 *         description: Internal server error
 */
router.post('/withdraw/batch', 
  validate(batchWithdrawSchema, 'body'),
  WithdrawController.executeBatchWithdraw
);

export default router;


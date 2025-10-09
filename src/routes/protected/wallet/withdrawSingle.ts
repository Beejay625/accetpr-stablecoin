import { Router } from 'express';
import { WithdrawController } from '../../../controllers/wallet/withdrawController';
import { validate } from '../../../middleware/validate';
import { singleWithdrawSchema } from './schemas/wallet.schema';

const router = Router();

/**
 * @swagger
 * /protected/wallet/withdraw/single:
 *   post:
 *     summary: Execute single asset withdrawal
 *     description: Execute a single asset withdrawal for the authenticated user's wallet
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
 *               - chain
 *               - asset
 *               - amount
 *               - address
 *             properties:
 *               chain:
 *                 type: string
 *                 enum: [base, base-sepolia]
 *                 description: Blockchain chain for the withdraw operation (base for prod, base-sepolia for dev)
 *                 example: "base-sepolia"
 *               asset:
 *                 type: string
 *                 description: Asset symbol to withdraw
 *                 example: "USDC"
 *               amount:
 *                 type: string
 *                 description: Amount to withdraw
 *                 example: "0.5"
 *               address:
 *                 type: string
 *                 description: Recipient address
 *                 example: "0x451dEFC27B45808078e875556AF06bCFdC697BA4"
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *                 example: { "id": "0001" }
 *               reference:
 *                 type: string
 *                 description: Optional reference note for the withdrawal
 *                 example: "single withdraw"
 *             example:
 *               chain: "base-sepolia"
 *               asset: "USDC"
 *               amount: "0.5"
 *               address: "0x451dEFC27B45808078e875556AF06bCFdC697BA4"
 *               metadata: { "id": "0001" }
 *               reference: "single withdraw"
 *     responses:
 *       200:
 *         description: Single withdraw executed successfully
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
 *                   example: "Single withdraw executed successfully"
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
 *                     amount:
 *                       type: string
 *                       example: "0.5"
 *                     recipientAddress:
 *                       type: string
 *                       example: "0x451dEFC27B45808078e875556AF06bCFdC697BA4"
 *                     asset:
 *                       type: string
 *                       example: "USDC"
 *                     chain:
 *                       type: string
 *                       example: "polygon"
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
router.post('/withdraw/single', 
  validate(singleWithdrawSchema, 'body'),
  WithdrawController.executeSingleWithdraw
);

export default router;


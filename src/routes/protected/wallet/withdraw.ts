import { Router } from 'express';
import { WithdrawController } from '../../../controllers/wallet/withdrawController';
import { validate } from '../../../middleware/validate';
import { singleWithdrawSchema, batchWithdrawSchema } from '../../../schemas';

const router = Router();

// Authentication handled globally in protected/index.ts

/**
 * @swagger
 * /api/v1/protected/wallet/withdraw/single:
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
 *                 enum: [base, arbitrum, ethereum, polygon, optimism, solana, tron]
 *                 description: Blockchain chain for the withdraw operation
 *                 example: "base"
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
 *               chain: "base"
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
 *                       value: "Invalid chain. Supported chains: base, arbitrum, ethereum, polygon, optimism, solana, tron"
 *                     missing_fields:
 *                       value: "Chain, asset, amount, and address are required for single withdrawal"
 *                     invalid_amount:
 *                       value: "Amount must be a positive number"
 *                     invalid_address:
 *                       value: "Invalid recipient address format"
 *                     asset_not_found:
 *                       value: "Asset 'USDC' not found on chain 'base'. Available assets can be checked via the assets endpoint."
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
router.post('/withdraw/single', WithdrawController.executeSingleWithdraw);

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
 *                       enum: [base, arbitrum, ethereum, polygon, optimism, solana, tron]
 *                       description: Blockchain chain for the asset
 *                       example: "base"
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
 *                 - chain: "base"
 *                   asset: "USDC"
 *                   address: "0x451dEFC27B45808078e875556AF06bCFdC697BA4"
 *                   amount: "0.5"
 *                   metadata: { "id": "0001" }
 *                   reference: "batch withdraw 1"
 *                 - chain: "base"
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
 *                     missing_assets:
 *                       value: "Assets array is required and must contain at least one asset"
 *                     too_many_assets:
 *                       value: "Maximum 10 assets allowed per batch withdrawal"
 *                     invalid_asset:
 *                       value: "Asset 1: Chain is required and must be a string"
 *                     asset_not_found:
 *                       value: "Asset 1: Asset 'USDC' not found on chain 'base'"
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
router.post('/withdraw/batch', WithdrawController.executeBatchWithdraw);

export default router;
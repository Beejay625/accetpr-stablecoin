import { Router } from 'express';
import { requireAuthWithUserId } from '../../../middleware/auth';
import { WalletAddressController } from '../../../controllers/wallet/walletAddressController';
import { DEFAULT_CHAINS } from '../../../types/chains';

const router = Router();

/**
 * @swagger
 * /api/v1/protected/wallet/addresses:
 *   get:
 *     summary: Get all wallet addresses
 *     description: Retrieve all wallet addresses for the authenticated user across all chains
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet addresses retrieved successfully
 */
router.get('/addresses', requireAuthWithUserId, WalletAddressController.getWalletAddresses);

/**
 * @swagger
 * /api/v1/protected/wallet/addresses/{chain}:
 *   get:
 *     summary: Get wallet address for a specific chain
 *     description: Retrieve wallet address for the authenticated user on a specific chain
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
 *     responses:
 *       200:
 *         description: Wallet address retrieved successfully
 *       404:
 *         description: Wallet address not found
 */
router.get('/addresses/:chain', requireAuthWithUserId, WalletAddressController.getWalletAddressByChain);

export default router;

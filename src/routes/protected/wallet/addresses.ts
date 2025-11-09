import { Router } from 'express';
import { requireAuthWithUserId } from '../../../middleware/auth';
import { WalletAddressesController } from '../../../controllers/wallet/walletAddressesController';

const router = Router();

// All address routes require authentication

/**
 * @swagger
 * /api/v1/protected/wallet/addresses:
 *   get:
 *     summary: Get all wallet addresses for authenticated user
 *     description: Retrieve all wallet addresses across all chains for the authenticated user
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet addresses retrieved successfully
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
 *                   example: "Wallet addresses retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     addresses:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "clx1234567890"
 *                           address:
 *                             type: string
 *                             example: "0x451dEFC27B45808078e875556AF06bCFdC697BA4"
 *                           chain:
 *                             type: string
 *                             example: "base"
 *                           addressName:
 *                             type: string
 *                             example: "user_123-base"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     count:
 *                       type: number
 *                       example: 2
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.get('/addresses', requireAuthWithUserId, WalletAddressesController.getAddresses);

export default router;


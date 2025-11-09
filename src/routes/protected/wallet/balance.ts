import { Router } from 'express';
import { requireAuthWithUserId } from '../../../middleware/auth';
import { BalanceAggregationController } from '../../../controllers/wallet/balanceAggregationController';

const router = Router();

/**
 * @swagger
 * /api/v1/protected/wallet/balance/aggregated:
 *   get:
 *     summary: Get aggregated balance across all chains
 *     description: Retrieve aggregated balance information across all user's wallet chains
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aggregated balance retrieved successfully
 */
router.get('/balance/aggregated', requireAuthWithUserId, BalanceAggregationController.getAggregatedBalance);

export default router;


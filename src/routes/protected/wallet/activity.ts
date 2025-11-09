import { Router } from 'express';
import { requireAuthWithUserId } from '../../../middleware/auth';
import { ActivityTimelineController } from '../../../controllers/wallet/activityTimelineController';

const router = Router();

/**
 * @swagger
 * /api/v1/protected/wallet/activity:
 *   get:
 *     summary: Get activity timeline
 *     description: Retrieve activity timeline across all chains for the authenticated user
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of activities (1-100)
 *     responses:
 *       200:
 *         description: Activity timeline retrieved successfully
 */
router.get('/activity', requireAuthWithUserId, ActivityTimelineController.getActivityTimeline);

/**
 * @swagger
 * /api/v1/protected/wallet/activity/recent:
 *   get:
 *     summary: Get recent activity
 *     description: Retrieve recent activity across all chains for the authenticated user
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: count
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of recent activities (1-50)
 *     responses:
 *       200:
 *         description: Recent activity retrieved successfully
 */
router.get('/activity/recent', requireAuthWithUserId, ActivityTimelineController.getRecentActivity);

export default router;


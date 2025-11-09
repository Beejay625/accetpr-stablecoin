import { Router } from 'express';
import { requireAuthWithUserId } from '../../../middleware/auth';
import { TestAuthController } from '../../../controllers/test/testAuthController';

const router = Router();

// All protected routes require authentication
// Add your protected endpoints here

/**
 * @swagger
 * /api/protected/test-auth:
 *   get:
 *     summary: Test authentication endpoint
 *     description: Example endpoint to verify Clerk authentication is working correctly
 *     tags: [Protected]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authentication working correctly
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 user:
 *                   type: object
 *                 timestamp:
 *                   type: string
 *       401:
 *         description: Authentication required
 */
router.get('/test-auth', requireAuthWithUserId, TestAuthController.testAuth);


export default router;

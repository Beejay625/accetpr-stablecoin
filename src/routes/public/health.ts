import { Router } from 'express';
import { PublicController } from '../../controllers/test/publicController';

export const healthRouter = Router();

/**
 * @swagger
 * /api/public/health:
 *   get:
 *     summary: Service health check
 *     description: Public endpoint for monitoring service health
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 uptime:
 *                   type: number
 *                 db:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 */
healthRouter.get('/', PublicController.healthCheck);

export default healthRouter;

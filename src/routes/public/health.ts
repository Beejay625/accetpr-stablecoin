import { Router } from 'express';
import { checkDatabaseHealth } from '../../db/pool';

const router = Router();

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
router.get('/', async (_req, res) => {
  const db = await checkDatabaseHealth();
  res.status(200).json({ ok: true, uptime: process.uptime(), db });
});

export default router;

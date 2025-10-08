import { Router } from 'express';
import { PublicController } from '../../controllers/publicController';

export const logsRouter = Router();

/**
 * @swagger
 * /api/v1/public/logs:
 *   get:
 *     summary: Get application logs from in-memory buffer
 *     description: |
 *       Retrieves logs from the in-memory circular buffer (stateless, no database storage).
 *       The buffer keeps the last 1000 log entries in memory.
 *     tags:
 *       - Logs
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *           maximum: 1000
 *         description: Maximum number of logs to return
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [info, warn, error, debug]
 *         description: Filter logs by level
 *       - in: query
 *         name: since
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs since this ISO timestamp
 *     responses:
 *       200:
 *         description: Logs retrieved successfully
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
 *                   example: Logs retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     logs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           level:
 *                             type: string
 *                             example: info
 *                           time:
 *                             type: string
 *                             format: date-time
 *                           msg:
 *                             type: string
 *                           function:
 *                             type: string
 *                           module:
 *                             type: string
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalLogs:
 *                           type: integer
 *                         maxCapacity:
 *                           type: integer
 *                         levels:
 *                           type: object
 *                         oldestLog:
 *                           type: string
 *                           format: date-time
 *                         newestLog:
 *                           type: string
 *                           format: date-time
 *                     query:
 *                       type: object
 *                       properties:
 *                         limit:
 *                           type: integer
 *                         level:
 *                           type: string
 *                         since:
 *                           type: string
 *       500:
 *         description: Internal server error
 */
logsRouter.get('/', PublicController.getLogs);

export default logsRouter;


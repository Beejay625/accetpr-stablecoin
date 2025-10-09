import { Router } from 'express';
import { PublicController } from '../../controllers/publicController';
import { asyncHandler } from '../../errors';

export const statusRouter = Router();

/**
 * @swagger
 * /public/status:
 *   get:
 *     summary: Get application status
 *     description: Returns the current status of the application
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Application status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                 timestamp:
 *                   type: string
 */
statusRouter.get('/', asyncHandler(PublicController.status));

export default statusRouter;

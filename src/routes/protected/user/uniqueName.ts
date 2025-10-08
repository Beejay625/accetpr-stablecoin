import { Router } from 'express';
import { z } from 'zod';
import { UniqueNameController } from '../../../controllers/user/uniqueNameController';
import { requireAuthWithUserId } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuthWithUserId);

/**
 * @swagger
 * /api/protected/unique-name/check/{uniqueName}:
 *   get:
 *     summary: Check if unique name is available
 *     tags: [Unique Name]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uniqueName
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique name to check
 *     responses:
 *       200:
 *         description: Unique name availability checked
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
 *                     uniqueName:
 *                       type: string
 *                     available:
 *                       type: boolean
 *                     reason:
 *                       type: string
 */
router.get('/check/:uniqueName', UniqueNameController.checkAvailability);

/**
 * @swagger
 * /api/protected/unique-name/set:
 *   post:
 *     summary: Set or update unique name for user
 *     tags: [Unique Name]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uniqueName
 *             properties:
 *               uniqueName:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 pattern: '^[a-zA-Z][a-zA-Z0-9_]*$'
 *                 description: Unique name (3-30 chars, alphanumeric + underscore, must start with letter)
 *     responses:
 *       200:
 *         description: Unique name set/updated successfully
 *       400:
 *         description: Bad request (validation error or name already taken)
 *       401:
 *         description: Unauthorized
 */
router.post('/set', 
  validate(z.object({
    uniqueName: z.string()
      .min(3, 'Unique name must be at least 3 characters')
      .max(30, 'Unique name must not exceed 30 characters')
      .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Unique name must start with a letter and contain only letters, numbers, and underscores')
  }), 'body'), 
  UniqueNameController.setUniqueName
);


/**
 * @swagger
 * /api/protected/unique-name:
 *   get:
 *     summary: Get user's unique name
 *     tags: [Unique Name]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unique name retrieved successfully
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
 *                     uniqueName:
 *                       type: string
 *                       nullable: true
 *       401:
 *         description: Unauthorized
 */
router.get('/', UniqueNameController.getUniqueName);


export default router;

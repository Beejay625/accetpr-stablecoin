import { Router } from 'express';
import { ProductController } from '../../../controllers/product/productController';
import { validate } from '../../../middleware/validate';
import { productStatusSchema } from './schemas/product.schema';
import { asyncHandler } from '../../../utils/asyncHandler';

const router = Router();

/**
 * @swagger
 * /protected/product:
 *   get:
 *     summary: Get all products for authenticated user
 *     description: Retrieve all products created by the authenticated user with optional status filtering (basic info only, use separate endpoints for payment statistics)
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, expired, cancelled]
 *         description: Filter products by status
 *         example: active
 *     responses:
 *       200:
 *         description: Products retrieved successfully
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
 *                   example: "Products retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           productName:
 *                             type: string
 *                           amount:
 *                             type: string
 *                           status:
 *                             type: string
 *                     count:
 *                       type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/', 
  validate(productStatusSchema, 'query'),
  asyncHandler(ProductController.getUserProducts)
);

export default router;


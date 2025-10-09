import { Router } from 'express';
import { ProductController } from '../../controllers/product/productController';

const router = Router();

/**
 * @swagger
 * /api/v1/public/p/{uniqueName}/{slug}:
 *   get:
 *     summary: Get product by payment link (Public)
 *     description: |
 *       Retrieve product details using the payment link format.
 *       This endpoint is public and does not require authentication.
 *       Only returns active, non-expired products.
 *       Sensitive creator data (userId, etc.) is excluded from the response.
 *     tags: [Product - Public]
 *     parameters:
 *       - in: path
 *         name: uniqueName
 *         required: true
 *         schema:
 *           type: string
 *         description: The creator's unique name
 *         example: "johnsmith"
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The product slug
 *         example: "premium-course"
 *     responses:
 *       200:
 *         description: Product retrieved successfully
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
 *                   example: "Product retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "prod_abc123"
 *                         image:
 *                           type: string
 *                           example: "https://cloudinary.com/image.jpg"
 *                         productName:
 *                           type: string
 *                           example: "Premium Course Bundle"
 *                         description:
 *                           type: string
 *                           example: "Complete web development course"
 *                         amount:
 *                           type: string
 *                           example: "199.00"
 *                         payoutChain:
 *                           type: string
 *                           example: "base"
 *                         payoutToken:
 *                           type: string
 *                           example: "USDC"
 *                         slug:
 *                           type: string
 *                           example: "premium-course"
 *                         paymentLink:
 *                           type: string
 *                           example: "https://pay.stablestack.com/johnsmith/premium-course"
 *                         linkExpiration:
 *                           type: string
 *                           example: "never"
 *                         customDays:
 *                           type: number
 *                           example: 30
 *                         expiresAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-02-15T10:30:00Z"
 *                         status:
 *                           type: string
 *                           example: "active"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-15T10:30:00Z"
 *       404:
 *         description: Product not found or has expired
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Product not found or has expired"
 */
router.get('/p/:uniqueName/:slug', ProductController.getProductByPaymentLink);

export default router;


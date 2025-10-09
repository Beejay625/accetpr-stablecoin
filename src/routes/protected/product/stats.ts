import { Router } from 'express';
import { ProductController } from '../../../controllers/product/productController';
import { validate } from '../../../middleware/validate';
import { productIdSchema } from './schemas/product.schema';
import { asyncHandler } from '../../../errors';

const router = Router();

/**
 * @swagger
 * /protected/product/{productId}/payment-counts:
 *   get:
 *     summary: Get payment intent counts for a specific product
 *     description: Get the count of payment intents by status for a specific product
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: The product ID
 *     responses:
 *       200:
 *         description: Payment counts retrieved successfully
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
 *                   example: "Payment counts retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     created:
 *                       type: number
 *                       example: 45
 *                     succeeded:
 *                       type: number
 *                       example: 38
 *                     failed:
 *                       type: number
 *                       example: 3
 *                     cancelled:
 *                       type: number
 *                       example: 2
 *                     processing:
 *                       type: number
 *                       example: 1
 *                     requiresAction:
 *                       type: number
 *                       example: 1
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */
router.get('/:productId/payment-counts', 
  validate(productIdSchema, 'params'),
  asyncHandler(ProductController.getProductPaymentCounts)
);

/**
 * @swagger
 * /protected/product/{productId}/payment-amounts:
   *   get:
     *     summary: Get payment intent amounts for a specific product
     *     description: Get the total amounts (in dollars) of payment intents by status for a specific product
     *     tags: [Product]
     *     security:
       *       - bearerAuth: []
       *     parameters:
         *       - in: path
         *         name: productId
         *         required: true
         *         schema:
           *           type: string
           *         description: The product ID
           *     responses:
             *       200:
               *         description: Payment amounts retrieved successfully
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
                           *                   example: "Payment amounts retrieved successfully"
                           *                 data:
                             *                   type: object
                             *                   properties:
                               *                     amountCreated:
                                 *                       type: number
                                 *                       example: 8955.00
                                 *                       description: Total amount of all payment intents (in dollars)
                                 *                     amountSucceeded:
                                   *                       type: number
                                   *                       example: 7562.00
                                   *                       description: Total amount of successful payments (in dollars)
                                   *                     amountFailed:
                                     *                       type: number
                                     *                       example: 597.00
                                     *                       description: Total amount of failed payments (in dollars)
                                     *                     amountCancelled:
                                       *                       type: number
                                       *                       example: 398.00
                                       *                       description: Total amount of cancelled payments (in dollars)
                                       *                     amountProcessing:
                                         *                       type: number
                                         *                       example: 199.00
                                         *                       description: Total amount of processing payments (in dollars)
                                       *                     amountRequiresAction:
                                           *                       type: number
                                           *                       example: 199.00
                                           *                       description: Total amount of payments requiring action (in dollars)
                                           *       401:
                                             *         description: Unauthorized
                                             *       404:
                                               *         description: Product not found
                                               */
router.get('/:productId/payment-amounts', 
  validate(productIdSchema, 'params'),
  asyncHandler(ProductController.getProductPaymentAmounts)
);

/**
 * @swagger
 * /protected/product/stats:
   *   get:
     *     summary: Get product statistics for authenticated user
     *     description: Get aggregate statistics for all products owned by the authenticated user
     *     tags: [Product]
     *     security:
       *       - bearerAuth: []
       *     responses:
         *       200:
           *         description: Product statistics retrieved successfully
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
                       *                   example: "Product statistics retrieved successfully"
                       *                 data:
                         *                   type: object
                         *                   properties:
                           *                     total:
                             *                       type: number
                             *                       example: 15
                             *                     active:
                               *                       type: number
                               *                       example: 12
                               *                     expired:
                                 *                       type: number
                                 *                       example: 3
                                 *                     cancelled:
                                   *                       type: number
                                   *                       example: 2
                                   *       401:
                                     *         description: Unauthorized
                                     */
router.get('/stats', asyncHandler(ProductController.getUserProductStats));

export default router;


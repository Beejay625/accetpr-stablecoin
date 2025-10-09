import { Router } from 'express';
import { uploadPaymentImage, handleUploadError } from '../../../middleware/fileUpload';
import { ProductController } from '../../../controllers/product/productController';
import { validate } from '../../../middleware/validate';
import { updateProductSchema, productIdSchema } from './schemas/product.schema';
import { asyncHandler } from '../../../utils/asyncHandler';

const router = Router();

/**
 * @swagger
 * /protected/product/{productId}:
 *   put:
 *     summary: Update a product
 *     description: |
 *       Update product details including name, description, amount, payout settings, image, expiration, and status.
 *       
 *       **Updatable Fields:**
 *       - Product name and description
 *       - Amount (price)
 *       - Payout chain and token
 *       - Image (upload new file)
 *       - Link expiration settings
 *       - Status (active, expired, cancelled)
 *       
 *       **Status Updates:**
 *       - Set to "cancelled" to prevent new payments (soft delete)
 *       - Set to "active" to reactivate a cancelled product
 *       - Cancelled products can only be updated if reactivating (status: "active")
 *       
 *       **Note:** slug and paymentLink cannot be changed
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: The product ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional new product image
 *               productName:
 *                 type: string
 *                 description: Product name
 *               description:
 *                 type: string
 *                 description: Product description
 *               amount:
 *                 type: string
 *                 description: Product price
 *               payoutChain:
 *                 type: string
 *                 enum: [base, base-sepolia]
 *                 description: Blockchain for payout (base for prod, base-sepolia for dev)
 *               payoutToken:
 *                 type: string
 *                 enum: [USDC]
 *                 description: Token for payout (only USDC supported)
 *               linkExpiration:
 *                 type: string
 *                 enum: [never, custom_days]
 *                 description: Link expiration setting
 *               customDays:
 *                 type: number
 *                 description: Days until expiration (required if linkExpiration is custom_days)
 *               status:
 *                 type: string
 *                 enum: [active, expired, cancelled]
 *                 description: Product status
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */
router.put('/:productId', 
  uploadPaymentImage, 
  handleUploadError,
  validate(productIdSchema, 'params'),
  validate(updateProductSchema, 'body'),
  asyncHandler(ProductController.updateProduct)
);

export default router;


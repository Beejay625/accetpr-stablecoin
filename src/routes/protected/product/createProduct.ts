import { Router } from 'express';
import { uploadPaymentImage, handleUploadError } from '../../../middleware/fileUpload';
import { ProductController } from '../../../controllers/product/productController';
import { validate } from '../../../middleware/validate';
import { createProductSchema } from './schemas/product.schema';

const router = Router();

/**
 * @swagger
 * /api/v1/protected/product:
 *   post:
 *     summary: Create a new product
 *     description: |
 *       Create a new product with details and payment configuration.
 *       
 *       **Supported Chains & Tokens:**
 *       - **Development (NODE_ENV=development):**
 *         - Chain: `base-sepolia`
 *         - Token: `USDC`
 *       
 *       - **Production (NODE_ENV=production):**
 *         - Chain: `base`
 *         - Token: `USDC`
 *       
 *       **Note:** Use the correct chain for your environment or you'll get a validation error.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - productName
 *               - description
 *               - amount
 *               - payoutChain
 *               - payoutToken
 *               - slug
 *               - linkExpiration
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional product image file (JPEG, PNG, WebP, GIF, max 5MB)
 *               productName:
 *                 type: string
 *                 description: Name of the product or service
 *                 example: "Premium Subscription"
 *               description:
 *                 type: string
 *                 description: Detailed description of the product or service
 *                 example: "Monthly premium subscription with advanced features"
 *               amount:
 *                 type: string
 *                 description: Payment amount
 *                 example: "29.99"
 *               payoutChain:
 *                 type: string
 *                 enum: [base, arbitrum, ethereum, polygon, optimism, solana, tron]
 *                 description: Chain for payout
 *                 example: "base"
 *               payoutToken:
 *                 type: string
 *                 description: Token for payout (must be supported on the specified chain)
 *                 example: "USDC"
 *               slug:
 *                 type: string
 *                 description: Required custom slug for the payment link
 *                 example: "premium-subscription"
 *               linkExpiration:
 *                 type: string
 *                 enum: [never, custom_days]
 *                 description: Link expiration setting
 *                 example: "custom_days"
 *               customDays:
 *                 type: number
 *                 description: Number of days until expiration (required when linkExpiration is custom_days)
 *                 example: 30
 *             example:
 *               image: "product-image.jpg"
 *               productName: "Premium Subscription"
 *               description: "Monthly premium subscription with advanced features"
 *               amount: "29.99"
 *               payoutChain: "base"
 *               payoutToken: "USDC"
 *               slug: "premium-subscription"
 *               linkExpiration: "custom_days"
 *               customDays: 30
 *     responses:
 *       200:
 *         description: Product created successfully
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.post('/', 
  uploadPaymentImage, 
  handleUploadError, 
  validate(createProductSchema, 'body'),
  ProductController.createProduct
);

export default router;


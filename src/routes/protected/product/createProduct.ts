import { Router } from 'express';
import { uploadPaymentImage, handleUploadError } from '../../../middleware/fileUpload';
import { ProductController } from '../../../controllers/product/productController';
import { validate } from '../../../middleware/validate';
import { createProductSchema } from './schemas/product.schema';
import { asyncHandler } from '../../../errors';

const router = Router();

/**
 * @swagger
 * /protected/product:
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
 *                 enum: [base, base-sepolia]
 *                 description: Chain for payout (base for prod, base-sepolia for dev)
 *                 example: "base-sepolia"
 *               payoutToken:
 *                 type: string
 *                 enum: [USDC]
 *                 description: Token for payout (only USDC supported)
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
 *               payoutChain: "base-sepolia"
 *               payoutToken: "USDC"
 *               slug: "premium-subscription"
 *               linkExpiration: "custom_days"
 *               customDays: 30
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Product created successfully"
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       enum: [BAD_REQUEST, VALIDATION_ERROR]
 *                       example: "BAD_REQUEST"
 *                     message:
 *                       type: string
 *                       example: "User must set a unique name before creating products"
 *                     requestId:
 *                       type: string
 *             examples:
 *               missingUniqueName:
 *                 summary: User missing unique name
 *                 value:
 *                   ok: false
 *                   error:
 *                     code: "BAD_REQUEST"
 *                     message: "User must set a unique name before creating products"
 *                     requestId: "550e8400-e29b-41d4-a716-446655440000"
 *               invalidChain:
 *                 summary: Invalid payout chain
 *                 value:
 *                   ok: false
 *                   error:
 *                     code: "VALIDATION_ERROR"
 *                     message: "Invalid chain: ethereum. Supported chains in development: base-sepolia"
 *                     requestId: "550e8400-e29b-41d4-a716-446655440000"
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "UNAUTHORIZED"
 *                     message:
 *                       type: string
 *                       example: "Authentication required"
 *                     requestId:
 *                       type: string
 *       409:
 *         description: Conflict - Resource already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "ALREADY_EXISTS"
 *                     message:
 *                       type: string
 *                       example: "A product with this slug already exists. Please use a different slug."
 *                     requestId:
 *                       type: string
 *       422:
 *         description: Validation Error - Invalid input format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "VALIDATION_ERROR"
 *                     message:
 *                       type: string
 *                       example: "Validation failed"
 *                     requestId:
 *                       type: string
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "INTERNAL_ERROR"
 *                     message:
 *                       type: string
 *                       example: "Something went wrong"
 *                     requestId:
 *                       type: string
 */
router.post('/', 
  uploadPaymentImage, 
  handleUploadError, 
  validate(createProductSchema, 'body'),
  asyncHandler(ProductController.createProduct)
);

export default router;


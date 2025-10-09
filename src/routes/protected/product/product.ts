import { Router } from 'express';
import { uploadPaymentImage, handleUploadError } from '../../../middleware/fileUpload';
import { ProductController } from '../../../controllers/product/productController';
import { validate } from '../../../middleware/validate';
import { 
  createProductSchema, 
  updateProductSchema, 
  productStatusSchema,
  productIdSchema 
} from '../../../schemas';

const router = Router();

// Authentication handled globally in protected/index.ts

/**
 * @swagger
 * /api/v1/protected/product:
 *   post:
 *     summary: Create a new product
 *     description: |
 *       Create a new product with details and payment configuration.
 *       
 *       **Supported Token-Chain Combinations (Development):**
 *       - **base**: USDC
 *       - **arbitrum**: USDC, USDT
 *       - **solana**: USDC, USDT
 *       - **tron**: USDT
 *       
 *       **Supported Token-Chain Combinations (Production):**
 *       - **base-sepolia**: USDC
 *       
 *       **Note:** The available chains and tokens depend on your current environment (NODE_ENV).
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
 *                   example: "Product created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "pr_abc123def"
 *                         image:
 *                           type: string
 *                           example: "https://example.com/product-image.jpg"
 *                         productName:
 *                           type: string
 *                           example: "Premium Subscription"
 *                         description:
 *                           type: string
 *                           example: "Monthly premium subscription with advanced features"
 *                         amount:
 *                           type: string
 *                           example: "29.99"
 *                         payoutChain:
 *                           type: string
 *                           example: "base"
 *                         payoutToken:
 *                           type: string
 *                           example: "USDC"
 *                         slug:
 *                           type: string
 *                           example: "premium-subscription-1234567890-abc123"
 *                         paymentLink:
 *                           type: string
 *                           example: "https://pay.stablestack.com/johndoe/premium-subscription-1234567890-abc123"
 *                         linkExpiration:
 *                           type: string
 *                           enum: [never, custom_days]
 *                           example: "custom_days"
 *                         customDays:
 *                           type: number
 *                           example: 30
 *                         expiresAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-02-15T10:30:00Z"
 *                         status:
 *                           type: string
 *                           enum: [active, expired, cancelled]
 *                           example: "active"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-15T10:30:00Z"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid request parameters
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
 *                   examples:
 *                     missing_fields:
 *                       value: "Product name, description, amount, payout chain, payout token, and slug are required"
 *                     missing_expiration:
 *                       value: "Link expiration is required"
 *                     missing_custom_days:
 *                       value: "Custom days is required when link expiration is custom_days"
 *                     invalid_amount:
 *                       value: "Amount must be a positive number"
 *                     invalid_chain:
 *                       value: "Invalid payout chain: invalid-chain. Supported chains: base, arbitrum, solana, tron"
 *                     invalid_token:
 *                       value: "Token USDT is not supported on chain base. Supported tokens: USDC"
 *                     invalid_expiration:
 *                       value: "Invalid link expiration: invalid. Supported values: never, custom_days"
 *                     file_too_large:
 *                       value: "File size too large. Maximum size is 5MB."
 *                     invalid_file_type:
 *                       value: "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed."
 *                     upload_error:
 *                       value: "File upload error."
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

/**
 * @swagger
 * /api/v1/protected/product:
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
  ProductController.getUserProducts
);

/**
 * @swagger
 * /api/v1/protected/product/{productId}:
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
 *                 enum: [base, solana, tron, arbitrum]
 *                 description: Blockchain for payout
 *               payoutToken:
 *                 type: string
 *                 enum: [USDC, USDT]
 *                 description: Token for payout
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
 *                   example: "Product updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: object
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
  ProductController.updateProduct
);


/**
 * @swagger
 * /api/v1/protected/product/{productId}/payment-counts:
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
  ProductController.getProductPaymentCounts
);

/**
 * @swagger
 * /api/v1/protected/product/{productId}/payment-amounts:
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
router.get('/:productId/payment-amounts', ProductController.getProductPaymentAmounts);

/**
 * @swagger
 * /api/v1/protected/product/stats:
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
router.get('/stats', ProductController.getUserProductStats);

export default router;

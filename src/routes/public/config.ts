import { Router } from 'express';
import { swaggerDynamicValues } from '../../config/swagger';

export const configRouter = Router();

/**
 * @swagger
 * /api/v1/public/config/chains:
 *   get:
 *     summary: Get supported chains and tokens
 *     description: |
 *       Returns the currently supported blockchain chains and tokens based on the server environment.
 *       Use this endpoint to get the correct values for your requests.
 *     tags: [Configuration]
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
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
 *                   example: "Configuration retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ChainTokenInfo'
 */
configRouter.get('/config/chains', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Configuration retrieved successfully',
    data: {
      environment: swaggerDynamicValues.environment,
      supportedChains: swaggerDynamicValues.supportedChains,
      supportedTokens: swaggerDynamicValues.supportedTokens,
      chainTokenCombinations: swaggerDynamicValues.chainTokenCombinations,
      exampleChain: swaggerDynamicValues.exampleChain,
      exampleToken: swaggerDynamicValues.exampleToken,
    },
    timestamp: new Date().toISOString(),
  });
});

export default configRouter;


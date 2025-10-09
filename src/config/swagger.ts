import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';
import { 
  DEFAULT_CHAINS, 
  getAllSupportedTokenChains 
} from '../providers/blockradar/walletIdAndTokenManagement/chainsAndTokensHelpers';

// Build servers list dynamically
const servers = [
  { url: 'http://localhost:3000', description: 'Local Development' },
];

// Add base URL if different from localhost
const baseUrl = env.BASE_URL as string;
if (baseUrl && !baseUrl.includes('localhost')) {
  servers.unshift({ url: baseUrl, description: 'Public URL' });
}

// Get environment info
const isDev = process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'dev';
const envName = isDev ? 'Development' : 'Production';

// Get supported chains and tokens dynamically
const supportedChains = Array.from(DEFAULT_CHAINS);
const chainTokenCombos = getAllSupportedTokenChains();

// Build chain/token description
const chainTokenDesc = chainTokenCombos.reduce((acc, { chain, token }) => {
  if (!acc[chain]) {
    acc[chain] = [];
  }
  acc[chain].push(token);
  return acc;
}, {} as Record<string, string[]>);

let chainDescription = `**Current Environment: ${envName}**\n\n**Supported Chains:**\n`;
Object.entries(chainTokenDesc).forEach(([chain, tokens]) => {
  chainDescription += `- **${chain}**: ${tokens.join(', ')}\n`;
});

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Stablestack Backend API',
      version: '1.0.0',
      description: `
Stablestack payment infrastructure API.

${chainDescription}

**Note:** Supported chains and tokens vary by environment. Always use the chains/tokens listed above for ${envName}.
      `.trim(),
    },
    servers,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // Dynamic chain enum
        ChainEnum: {
          type: 'string',
          enum: supportedChains,
          description: chainDescription,
          example: supportedChains[0] || 'base-sepolia',
        },
        // Dynamic token enum
        TokenEnum: {
          type: 'string',
          enum: ['USDC'],
          description: 'Supported tokens. Currently: USDC',
          example: 'USDC',
        },
        // Chain/Token combination info
        ChainTokenInfo: {
          type: 'object',
          properties: {
            environment: {
              type: 'string',
              example: envName,
              description: 'Current environment',
            },
            supportedChains: {
              type: 'array',
              items: { type: 'string' },
              example: supportedChains,
            },
            supportedCombinations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  chain: { type: 'string' },
                  tokens: { 
                    type: 'array',
                    items: { type: 'string' }
                  }
                }
              },
              example: Object.entries(chainTokenDesc).map(([chain, tokens]) => ({ chain, tokens })),
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Product',
        description: `Product management endpoints. Use chains: ${supportedChains.join(', ')}`,
      },
      {
        name: 'Wallet',
        description: `Wallet operations. Supported chains: ${supportedChains.join(', ')}`,
      },
      {
        name: 'Payment',
        description: 'Payment intent and webhook endpoints',
      },
      {
        name: 'User',
        description: 'User profile and unique name management',
      },
    ],
  },
  apis: ['src/routes/**/*.ts'],
});

// Export dynamic values for use in route documentation
export const swaggerDynamicValues = {
  environment: envName,
  supportedChains,
  supportedTokens: ['USDC'],
  chainTokenCombinations: Object.entries(chainTokenDesc).map(([chain, tokens]) => ({ chain, tokens })),
  exampleChain: supportedChains[0] || 'base-sepolia',
  exampleToken: 'USDC',
  chainDescription,
};

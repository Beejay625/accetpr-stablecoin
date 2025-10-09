import { 
  DEV_EVM_CHAINS,
  DEV_NON_EVM_CHAINS,
  PROD_EVM_CHAINS,
  PROD_NON_EVM_CHAINS,
  DEV_SUPPORTED_TOKENS,
  PROD_SUPPORTED_TOKENS
} from '../providers/blockradar/walletIdManagement/configuration';

/**
 * Combined chains for each environment
 */
export const DEV_CHAINS = [
  DEV_EVM_CHAINS,
  ...DEV_NON_EVM_CHAINS
] as const;

export const PROD_CHAINS = [
  PROD_EVM_CHAINS,
  ...PROD_NON_EVM_CHAINS
] as const;

// Re-export for convenience
export const EVM_CHAINS_DEV = DEV_EVM_CHAINS;
export const EVM_CHAINS_PROD = PROD_EVM_CHAINS;

/**
 * Get EVM chains based on environment
 */
export const EVM_CHAINS = (() => {
  const isDev = process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'dev';
  return isDev ? EVM_CHAINS_DEV : EVM_CHAINS_PROD;
})();

/**
 * Get chains based on environment
 * Development: base-sepolia
 * Production: base
 */
export const DEFAULT_CHAINS = (() => {
  const isDev = process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'dev';
  
  const chains = isDev ? DEV_CHAINS : PROD_CHAINS;
  
  // Flatten nested arrays
  return chains.flat() as readonly string[];
})();

/**
 * Supported tokens per chain for development
 */
export const DEV_SUPPORTED_TOKENS = {
  'base-sepolia': ['USDC'],
  // base: ['USDC'],
  // arbitrum: ['USDC', 'USDT'],
  // solana: ['USDC', 'USDT'],
  // tron: ['USDT']
} as const;

/**
 * Supported tokens per chain for production
 */
export const PROD_SUPPORTED_TOKENS = {
  'base': ['USDC']
} as const;

/**
 * Get supported tokens based on environment
 */
export const SUPPORTED_TOKENS = (() => {
  const isDev = process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'dev';
  return isDev ? DEV_SUPPORTED_TOKENS : PROD_SUPPORTED_TOKENS;
})();

/**
 * Get supported tokens for a chain
 */
export function getSupportedTokensForChain(chain: string): readonly string[] {
  return SUPPORTED_TOKENS[chain as keyof typeof SUPPORTED_TOKENS] || [];
}

/**
 * Check if a token is supported on a chain
 */
export function isTokenSupportedOnChain(chain: string, token: string): boolean {
  const supportedTokens = getSupportedTokensForChain(chain);
  return supportedTokens.includes(token.toUpperCase());
}

/**
 * Get all supported token-chain combinations
 */
export function getAllSupportedTokenChains(): Array<{ chain: string; token: string }> {
  const combinations: Array<{ chain: string; token: string }> = [];
  
  Object.entries(SUPPORTED_TOKENS).forEach(([chain, tokens]) => {
    tokens.forEach(token => {
      combinations.push({ chain, token });
    });
  });
  
  return combinations;
}

/**
 * Default asset to use for wallet generation
 */
export const DEFAULT_ASSET = 'USDC';

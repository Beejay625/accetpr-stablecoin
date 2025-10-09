/**
 * EVM compatible chains
 */
export const EVM_CHAINS = [
  'base',
  'arbitrum'
] as const;

/**
 * Development chains with nested EVM chains
 */
export const DEV_CHAINS = [
  EVM_CHAINS,
  // 'solana', 
  // 'tron'
] as const;

/**
 * Production chains with nested EVM chains
 */
export const PROD_CHAINS = [
  ['base-sepolia']
] as const;

/**
 * Get chains based on environment
 * Development: base, arbitrum, solana, tron
 * Production: base-sepolia
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
  base: ['USDC'],
  arbitrum: ['USDC', 'USDT'],
  solana: ['USDC', 'USDT'],
  tron: ['USDT']
} as const;

/**
 * Supported tokens per chain for production
 */
export const PROD_SUPPORTED_TOKENS = {
  'base-sepolia': ['USDC']
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

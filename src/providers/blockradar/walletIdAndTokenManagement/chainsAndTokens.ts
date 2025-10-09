import { 
  DEV_EVM_CHAINS,
  DEV_NON_EVM_CHAINS,
  PROD_EVM_CHAINS,
  PROD_NON_EVM_CHAINS
} from '../../../config/configuration';

// Helper to determine environment
const isDev = process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'dev';

/**
 * Get all chains with tokens for current environment
 */
const ALL_CHAINS_WITH_TOKENS = isDev
  ? { ...DEV_EVM_CHAINS, ...DEV_NON_EVM_CHAINS }
  : { ...PROD_EVM_CHAINS, ...PROD_NON_EVM_CHAINS };

/**
 * Get EVM chains for current environment
 */
export const EVM_CHAINS = Object.keys(isDev ? DEV_EVM_CHAINS : PROD_EVM_CHAINS);

/**
 * Get all chains for current environment (flattened)
 */
export const DEFAULT_CHAINS = Object.keys(ALL_CHAINS_WITH_TOKENS);

/**
 * Get supported tokens for a chain
 */
export function getSupportedTokensForChain(chain: string): readonly string[] {
  return ALL_CHAINS_WITH_TOKENS[chain as keyof typeof ALL_CHAINS_WITH_TOKENS] || [];
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
  
  Object.entries(ALL_CHAINS_WITH_TOKENS).forEach(([chain, tokens]) => {
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
